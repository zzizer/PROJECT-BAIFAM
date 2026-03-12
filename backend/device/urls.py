from django.urls import path
from .views import DeviceSettingsView

urlpatterns = [
    path("settings/", DeviceSettingsView.as_view(), name="device-settings"),
]
