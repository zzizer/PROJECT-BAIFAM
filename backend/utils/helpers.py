from django.db import models
import uuid
from rest_framework import serializers


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
