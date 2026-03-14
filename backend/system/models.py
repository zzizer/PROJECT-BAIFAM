from utils.helpers import SoftDeletionModel
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone


class Scope(SoftDeletionModel):
    value = models.CharField(
        max_length=64,
        unique=True,
        help_text='Machine-readable scope, e.g. "read:logs"',
    )
    label = models.CharField(
        max_length=128,
        help_text='Human-readable label, e.g. "Read Logs"',
    )
    description = models.CharField(
        max_length=256,
        blank=True,
        help_text='Endpoint hint, e.g. "GET /api/logs/"',
    )

    class Meta:
        app_label = "system"
        ordering = ["value"]

    def __str__(self) -> str:
        return self.value


class RecycleBin(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Recycle Bin"
        verbose_name_plural = "Recycle Bin"

    def __str__(self):
        return f"System Recycle Bin (#{self.pk})"

    def delete(self, *args, **kwargs):
        raise ValueError("The system recycle bin cannot be deleted.")

    @classmethod
    def get(cls) -> "RecycleBin":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def empty(self) -> int:
        items = self.items.select_related("content_type").all()
        count = 0
        for item in items:
            instance = item.content_object
            if instance is not None:
                instance.__class__.objects.filter(pk=instance.pk).delete()
            item.delete()
            count += 1
        return count


class RecycleBinItem(models.Model):
    bin = models.ForeignKey(
        RecycleBin,
        on_delete=models.CASCADE,
        related_name="items",
    )

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_uuid = models.UUIDField(db_index=True)
    content_object = GenericForeignKey("content_type", "object_uuid")

    object_repr = models.CharField(
        max_length=255,
        help_text="Snapshot of str(instance) at deletion time, "
        "so the item is identifiable even if the object is later hard-deleted.",
    )
    model_label = models.CharField(
        max_length=255,
        help_text='app_label.ModelName, e.g. "staff.Staff"',
    )
    deleted_at = models.DateTimeField(default=timezone.now, db_index=True)
    deleted_by = models.ForeignKey(
        "users.CustomUser",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recycled_items",
        help_text="User who triggered the soft-delete, if available.",
    )

    class Meta:
        ordering = ["-deleted_at"]
        verbose_name = "Recycle Bin Item"
        verbose_name_plural = "Recycle Bin Items"
        indexes = [
            models.Index(fields=["content_type", "object_uuid"]),
        ]

    def __str__(self):
        return f"{self.model_label} | {self.object_repr} (deleted {self.deleted_at:%Y-%m-%d %H:%M})"

    def restore(self) -> object:
        instance = self.content_object
        if instance is None:
            raise ValueError(
                f"Cannot restore — the original object no longer exists. "
                f"It may have been hard-deleted. [{self.model_label} id={self.object_uuid}]"
            )

        instance.__class__.objects.filter(pk=instance.pk).update(deleted_at=None)
        self.delete()
        return instance

    def hard_delete(self) -> None:
        instance = self.content_object
        if instance is not None:
            instance.__class__.objects.filter(pk=instance.pk).delete()
        self.delete()
