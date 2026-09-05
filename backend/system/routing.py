from django.urls import re_path

from device.network_consumer import NetworkConsumer

from .consumers import DashboardConsumer
from .terminal_consumer import TerminalConsumer


websocket_urlpatterns = [
    re_path(r"ws/networks/$", NetworkConsumer.as_asgi()),
    re_path(r"ws/dashboard/$", DashboardConsumer.as_asgi()),
    re_path(r"ws/terminal/$", TerminalConsumer.as_asgi()),
]
