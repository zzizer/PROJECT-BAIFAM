from channels.db import database_sync_to_async
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import (
    InvalidToken,
    TokenError,
)

from api_mgt.models import APIKey
from users.authentication import authenticate_access_token


@database_sync_to_async
def authenticate_token(token):
    return authenticate_access_token(token)


@database_sync_to_async
def authenticate_api_key(raw_key):
    try:
        api_key = APIKey.objects.select_related("created_by").get(
            key_digest=APIKey.hash(raw_key),
        )
    except APIKey.DoesNotExist:
        raise AuthenticationFailed("Invalid API key.")

    if not api_key.is_valid or api_key.created_by is None:
        raise AuthenticationFailed("API key is inactive or expired.")

    api_key.touch()
    return api_key.created_by, api_key


class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        headers = dict(scope.get("headers", []))
        raw_api_key = headers.get(b"x-api-key")
        token = scope.get("cookies", {}).get(
            settings.ACCESS_COOKIE_NAME
        )

        if raw_api_key:
            try:
                user, api_key = await authenticate_api_key(
                    raw_api_key.decode("utf-8")
                )
            except (AuthenticationFailed, UnicodeDecodeError):
                scope["user"] = AnonymousUser()
                await send({"type": "websocket.close", "code": 4401})
                return

            scope["user"] = user
            scope["auth"] = api_key
            return await self.inner(scope, receive, send)

        if not token:
            scope["user"] = AnonymousUser()
            await send({"type": "websocket.close", "code": 4401})
            return

        try:
            user, validated_token = await authenticate_token(token)
        except (AuthenticationFailed, InvalidToken, TokenError):
            scope["user"] = AnonymousUser()
            await send({"type": "websocket.close", "code": 4401})
            return

        scope["user"] = user
        scope["auth"] = validated_token
        scope["auth_expires_at"] = validated_token.get("exp")

        return await self.inner(scope, receive, send)
