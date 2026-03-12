from rest_framework.response import Response
from rest_framework.views import APIView
from .models import DeviceSettings
from .serializers import DeviceSettingsSerializer
from drf_spectacular.utils import extend_schema


class DeviceSettingsView(APIView):
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
