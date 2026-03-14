from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import APIKey
from django.utils import timezone


class APIKeyAuthentication(BaseAuthentication):
    HEADER = "X-API-KEY"

    def authenticate(self, request):
        raw_key = request.headers.get(self.HEADER)
        if not raw_key:
            return None

        digest = APIKey.has(raw_key)

        try:
            api_key = (
                APIKey.objects.select_related("created_by")
                .prefetch_related("scopes")
                .get(key_digest=digest)
            )
        except APIKey.DoesNotExist:
            raise AuthenticationFailed("Invalid API key.")

        if api_key.expires_at and api_key.expires_at < timezone.now():
            raise AuthenticationFailed("API key has expired.")

        if not api_key.is_active:
            raise AuthenticationFailed("API key is disabled.")

        api_key.touch()

        return (api_key.created_by, api_key)
