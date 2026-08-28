from django.conf import settings
from rest_framework.authentication import CSRFCheck
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication


def enforce_csrf(request):
    check = CSRFCheck(lambda request: None)
    check.process_request(request)
    reason = check.process_view(request, None, (), {})

    if reason:
        raise PermissionDenied(f"CSRF Failed: {reason}")


class CookieJWTAuthentication(JWTAuthentication):
    """
    Authenticate browser requests from the HttpOnly access cookie.

    Authorization: Bearer remains available for non-browser clients. CSRF is
    required only when authentication came from the cookie.
    """

    def authenticate(self, request):
        raw_token = request.COOKIES.get(settings.ACCESS_COOKIE_NAME)

        if not raw_token:
            return super().authenticate(request)

        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)
        enforce_csrf(request)

        return user, validated_token


def authenticate_access_token(raw_token):
    authentication = JWTAuthentication()
    validated_token = authentication.get_validated_token(raw_token)
    user = authentication.get_user(validated_token)
    return user, validated_token
