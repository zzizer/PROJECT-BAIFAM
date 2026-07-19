import subprocess

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DeviceSettings
from .serializers import DeviceSettingsSerializer
from .services import schedule_device_restart
from drf_spectacular.utils import extend_schema


class DeviceSettingsView(APIView):
    required_scopes = {
        "GET": ["read:settings"],
        "PATCH": ["write:settings"],
    }

    @extend_schema(
        summary="Get Device Settings",
        description="Retrieve the current device settings.",
        tags=["Device Settings"],
        responses={
            200: DeviceSettingsSerializer,
        },
    )
    def get(self, request):
        device_settings = DeviceSettings.get()
        serializer = DeviceSettingsSerializer(device_settings)
        return Response(serializer.data)

    @extend_schema(
        summary="Update Device Settings",
        description="Update the device name and location. Immutable fields cannot be changed.",
        tags=["Device Settings"],
        request=DeviceSettingsSerializer,
        responses={
            200: DeviceSettingsSerializer,
            400: "Bad Request",
        },
    )
    def patch(self, request):
        device_settings = DeviceSettings.get()
        serializer = DeviceSettingsSerializer(
            device_settings, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class DeviceSettingsResetView(APIView):
    required_scopes = {
        "POST": ["write:settings"],
    }

    @extend_schema(
        summary="Reset Device Settings",
        description="Reset configurable device settings to their backend defaults.",
        tags=["Device Settings"],
        request=None,
        responses={200: DeviceSettingsSerializer},
    )
    def post(self, request):
        device_settings = DeviceSettings.get()
        device_settings.reset_to_defaults()
        return Response(DeviceSettingsSerializer(device_settings).data)


class DeviceRestartView(APIView):
    required_scopes = {
        "POST": ["restart:device"],
    }

    @extend_schema(
        summary="Restart Device",
        description="Schedule a restart of the Raspberry Pi.",
        tags=["Device Settings"],
        request=None,
        responses={
            202: {"description": "Device restart scheduled."},
            503: {"description": "Unable to schedule device restart."},
        },
    )
    def post(self, request):
        try:
            schedule_device_restart()
        except (
            OSError,
            subprocess.CalledProcessError,
            subprocess.TimeoutExpired,
        ):
            return Response(
                {"detail": "Unable to schedule device restart."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {"detail": "Device restart scheduled."},
            status=status.HTTP_202_ACCEPTED,
        )
