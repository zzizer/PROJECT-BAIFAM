from django.urls import path
from .views import DeviceRestartView, DeviceSettingsResetView, DeviceSettingsView

from .network_views import (
    NetworkConnectView,
    NetworkForgetView,
)

urlpatterns = [
    path(
        "networks/connect/", NetworkConnectView.as_view(), name="device-network-connect"
    ),
    path(
        "networks/<uuid:uuid>/",
        NetworkForgetView.as_view(),
        name="device-network-forget",
    ),
    path("settings/", DeviceSettingsView.as_view(), name="device-settings"),
    path(
        "settings/reset/",
        DeviceSettingsResetView.as_view(),
        name="device-settings-reset",
    ),
    path("restart/", DeviceRestartView.as_view(), name="device-restart"),
]
