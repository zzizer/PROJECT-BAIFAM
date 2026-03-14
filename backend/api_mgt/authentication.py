from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import APIKey


class APIKeyAuthentication(BaseAuthentication):
    HEADER = "X-API-KEY"

    def authenticate(self, request):
        raw_key = request.headers.get(self.HEADER)
        if not raw_key:
            return None

        digest = APIKey.hash(raw_key)

        try:
            api_key = (
                APIKey.objects.select_related("created_by")
                .prefetch_related("scopes")
                .get(key_digest=digest)
            )
        except APIKey.DoesNotExist:
            raise AuthenticationFailed("Invalid API key.")

        if not api_key.is_valid:
            raise AuthenticationFailed("API key is inactive or expired.")

        api_key.touch()

        return (api_key.created_by, api_key)
