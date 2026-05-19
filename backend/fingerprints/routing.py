from django.urls import re_path
from .consumers import FingerprintConsumer

websocket_urlpatterns = [
    re_path(r"ws/scanner/$", FingerprintConsumer.as_asgi()),
]
