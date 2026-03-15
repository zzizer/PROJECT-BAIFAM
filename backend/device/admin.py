from django.contrib import admin
from .models import DeviceSettings


@admin.register(DeviceSettings)
class DeviceSettingsAdmin(admin.ModelAdmin):
    list_display = (
        "device_name",
        "device_location",
        "serial_number",
        "device_model",
        "hardware_version",
        "firmware_version",
        "fingerprint_template_size",
    )

    readonly_fields = (
        "serial_number",
        "device_model",
        "hardware_version",
        "firmware_version",
        "fingerprint_template_size",
    )

    def has_delete_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request):
        return not DeviceSettings.objects.exists()
