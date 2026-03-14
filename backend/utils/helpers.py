from django.db import models
import uuid
from rest_framework import serializers
from django.utils import timezone


class BaseTimeStampedModel(models.Model):

    internal_base_uuid = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    ref_code = models.CharField(max_length=255, blank=True, null=True)

    ref_prefix = None

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        is_new = self._state.adding

        ref_prefix = getattr(self, "ref_prefix", None)

        if not ref_prefix:
            ref_prefix = self.__class__.__name__.upper()[:3]

        if is_new and not self.ref_code:
            self.ref_code = f"{ref_prefix}-{uuid.uuid4().hex[:8].upper()}"

        super().save(*args, **kwargs)


class SoftDeletionModel(BaseTimeStampedModel):
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def delete(self, deleted_by=None, *args, **kwargs):
        from django.contrib.contenttypes.models import ContentType
        from system.models import RecycleBin, RecycleBinItem

        self.deleted_at = timezone.now()
        self.is_active = False

        self.save(update_fields=["deleted_at", "is_active", "updated_at"])

        RecycleBinItem.objects.get_or_create(
            content_type=ContentType.objects.get_for_model(self.__class__),
            object_uuid=self.internal_base_uuid,
            defaults={
                "bin": RecycleBin.get(),
                "object_repr": str(self),
                "model_label": f"{self._meta.app_label}.{self.__class__.__name__}",
                "deleted_at": self.deleted_at,
                "deleted_by": deleted_by,
            },
        )

    def hard_delete(self, *args, **kwargs):
        from django.contrib.contenttypes.models import ContentType
        from system.models import RecycleBinItem

        RecycleBinItem.objects.filter(
            content_type=ContentType.objects.get_for_model(self.__class__),
            object_id=self.pk,
        ).delete()

        super().delete(*args, **kwargs)


class BaseSerializer(serializers.ModelSerializer):

    DEFAULT_READ_ONLY_FIELDS = [
        "id",
        "created_at",
        "updated_at",
        "ref_code",
        "internal_base_uuid",
        "is_active",
        "deleted_at",
    ]

    def get_extra_kwargs(self):
        extra_kwargs = super().get_extra_kwargs()
        for field in self.DEFAULT_READ_ONLY_FIELDS:
            extra_kwargs.setdefault(field, {})["read_only"] = True
        return extra_kwargs

    class Meta:
        abstract = True


class UUIDRelatedField(serializers.PrimaryKeyRelatedField):
    def __init__(self, queryset, uuid_field="internal_base_uuid", **kwargs):
        self.uuid_field = uuid_field
        kwargs["pk_field"] = serializers.UUIDField()
        super().__init__(queryset=queryset, **kwargs)

    def to_internal_value(self, data):
        try:
            return self.get_queryset().get(**{self.uuid_field: data})
        except self.get_queryset().model.DoesNotExist:
            raise serializers.ValidationError(
                f"Object with internal_base_uuid {data} does not exist."
            )
