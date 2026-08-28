import os
import django
from channels.sessions import CookieMiddleware
from django.conf import settings
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import OriginValidator

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

django_asgi_app = get_asgi_application()

from core.websocket_auth import JWTAuthMiddleware
from fingerprints.routing import websocket_urlpatterns as fingerprint_routes
from system.routing import websocket_urlpatterns as dashboard_routes

websocket_urlpatterns = fingerprint_routes + dashboard_routes

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": OriginValidator(
            CookieMiddleware(
                JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
            ),
            settings.WEBSOCKET_ALLOWED_ORIGINS,
        ),
    }
)
