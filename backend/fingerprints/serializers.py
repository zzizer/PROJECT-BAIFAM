from rest_framework import serializers
from utils.helpers import BaseSerializer, UUIDRelatedField
from .models import AccessLog, Fingerprint
from staff.models import Staff


class FingerprintSerializer(BaseSerializer):
    staff = UUIDRelatedField(
        queryset=Staff.objects.all(),
    )

    class Meta:
        model = Fingerprint
        fields = "__all__"

        read_only_fields = [
            "enrolled_at",
            "enrolled_by",
            "slot",
        ]

    def to_representation(self, instance):
        repr = super().to_representation(instance)

        repr["staff"] = {
            "internal_base_uuid": instance.staff.internal_base_uuid,
            "id": instance.staff.id,
            "full_name": instance.staff.full_name,
        }

        repr["enrolled_by"] = {
            "internal_base_uuid": instance.enrolled_by.internal_base_uuid,
            "id": instance.enrolled_by.id,
            "fullname": instance.enrolled_by.fullname,
        }

        return repr


class AccessLogSerializer(BaseSerializer):
    class Meta:
        model = AccessLog
        fields = "__all__"

    def to_representation(self, instance):
        repr = super().to_representation(instance)

        if instance.fingerprint:
            repr["fingerprint"] = FingerprintSerializer(instance.fingerprint).data

        if instance.staff:
            repr["staff"] = {
                "internal_base_uuid": instance.staff.internal_base_uuid,
                "id": instance.staff.id,
                "full_name": instance.staff.full_name,
            }

        return repr
