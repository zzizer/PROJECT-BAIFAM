from django.urls import path
from .views import DeviceRestartView, DeviceSettingsResetView, DeviceSettingsView

urlpatterns = [
    path("settings/", DeviceSettingsView.as_view(), name="device-settings"),
    path(
        "settings/reset/",
        DeviceSettingsResetView.as_view(),
        name="device-settings-reset",
    ),
    path("restart/", DeviceRestartView.as_view(), name="device-restart"),
]
