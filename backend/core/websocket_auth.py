from channels.db import database_sync_to_async
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import (
    InvalidToken,
    TokenError,
)

from users.authentication import authenticate_access_token

@database_sync_to_async
def authenticate_token(token):
    return authenticate_access_token(token)


class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        token = scope.get("cookies", {}).get(
            settings.ACCESS_COOKIE_NAME
        )

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
