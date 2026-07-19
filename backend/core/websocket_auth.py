from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from users.models import CustomUser


@database_sync_to_async
def get_user_from_token(token: str):
    try:
        access_token = AccessToken(token)
        user_id = access_token["user_id"]
    except (KeyError, TokenError):
        return AnonymousUser()

    return (
        CustomUser.objects.filter(
            pk=user_id,
            deleted_at__isnull=True,
        ).first()
        or AnonymousUser()
    )


class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query = parse_qs(scope.get("query_string", b"").decode())
        token = query.get("token", [""])[0]

        scope["user"] = (
            await get_user_from_token(token) if token else AnonymousUser()
        )

        return await self.inner(scope, receive, send)
