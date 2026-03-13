from rest_framework import serializers
from .models import DeviceSettings


class DeviceSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceSettings
        fields = "__all__"

        read_only_fields = [
            "serial_number",
            "device_model",
            "hardware_version",
            "firmware_version",
        ]
