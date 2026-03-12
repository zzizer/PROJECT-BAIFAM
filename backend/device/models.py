from django.db import models
from django.conf import settings

DEVICE_SERIAL_NUMBER = settings.DEVICE_SERIAL_NUMBER
DEVICE_MODEL = settings.DEVICE_MODEL
HARDWARE_VERSION = settings.HARDWARE_VERSION
FIRMWARE_VERSION = settings.FIRMWARE_VERSION


class DeviceSettings(models.Model):
    device_name = models.CharField(max_length=255, default="BAIFAM Device")
    device_location = models.CharField(max_length=255, blank=True, null=True)

    serial_number = models.CharField(
        max_length=255,
        unique=True,
        editable=False,
    )
    device_model = models.CharField(
        max_length=255,
        editable=False,
    )
    hardware_version = models.CharField(
        max_length=255,
        editable=False,
    )
    firmware_version = models.CharField(
        max_length=255,
        editable=False,
    )

    class Meta:
        verbose_name = "Device Setting"
        verbose_name_plural = "Device Settings"

    def __str__(self):
        return f"{self.serial_number} - {self.device_model}"

    def delete(self, *args, **kwargs):
        raise ValueError("Device settings cannot be deleted.")

    def save(self, *args, **kwargs):
        if (
            not self.pk
            and DeviceSettings.objects.filter(serial_number=self.serial_number).exists()
        ):
            raise ValueError(
                f"DeviceSettings for serial '{self.serial_number}' already exists."
            )

        if self.pk:
            original = DeviceSettings.objects.get(pk=self.pk)
            self.serial_number = original.serial_number
            self.device_model = original.device_model
            self.hardware_version = original.hardware_version
            self.firmware_version = original.firmware_version

        super().save(*args, **kwargs)

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(
            serial_number=DEVICE_SERIAL_NUMBER,
            defaults={
                "device_model": DEVICE_MODEL,
                "hardware_version": HARDWARE_VERSION,
                "firmware_version": FIRMWARE_VERSION,
            },
        )
        return obj
