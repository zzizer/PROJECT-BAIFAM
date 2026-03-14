from django.utils.deprecation import MiddlewareMixin
from .models import APIKey, APIKeyRequestLog


def _get_client_ip(request) -> str | None:
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class APIKeyRequestLogMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        auth = getattr(request, "auth", None)
        if not isinstance(auth, APIKey):
            return response

        try:
            APIKeyRequestLog.objects.create(
                api_key=auth,
                method=request.method,
                path=request.path,
                status_code=response.status_code,
                ip_address=_get_client_ip(request),
            )
        except Exception:
            pass

        return response
