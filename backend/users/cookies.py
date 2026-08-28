from datetime import timedelta

from django.conf import settings


def _max_age(value):
    if isinstance(value, timedelta):
        return int(value.total_seconds())
    return int(value)


def _common_cookie_options():
    return {
        "httponly": True,
        "secure": settings.AUTH_COOKIE_SECURE,
        "samesite": settings.AUTH_COOKIE_SAMESITE,
        "domain": settings.AUTH_COOKIE_DOMAIN,
    }


def set_access_cookie(response, token):
    response.set_cookie(
        key=settings.ACCESS_COOKIE_NAME,
        value=str(token),
        path=settings.ACCESS_COOKIE_PATH,
        max_age=_max_age(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"]),
        **_common_cookie_options(),
    )


def set_refresh_cookie(response, token):
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=str(token),
        path=settings.REFRESH_COOKIE_PATH,
        max_age=_max_age(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"]),
        **_common_cookie_options(),
    )


def clear_auth_cookies(response):
    response.delete_cookie(
        key=settings.ACCESS_COOKIE_NAME,
        path=settings.ACCESS_COOKIE_PATH,
        domain=settings.AUTH_COOKIE_DOMAIN,
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        path=settings.REFRESH_COOKIE_PATH,
        domain=settings.AUTH_COOKIE_DOMAIN,
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )
