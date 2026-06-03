from rest_framework import serializers

from utils.helpers import BaseSerializer, UUIDRelatedField
from .models import AccessLog, Fingerprint
from staff.models import Staff

FINGER_NAME_TO_INDEX = {
    "right_thumb": 0,
    "right_index": 1,
    "right_middle": 2,
    "right_ring": 3,
    "right_little": 4,
    "left_thumb": 5,
    "left_index": 6,
    "left_middle": 7,
    "left_ring": 8,
    "left_little": 9,
}


class FingerIndexField(serializers.Field):
    def to_internal_value(self, data):
        if isinstance(data, int):
            value = data

        elif isinstance(data, str):
            if data.isdigit():
                value = int(data)
            else:
                key = data.strip().lower()

                if key not in FINGER_NAME_TO_INDEX:
                    raise serializers.ValidationError("Invalid finger_index.")

                value = FINGER_NAME_TO_INDEX[key]

        else:
            raise serializers.ValidationError("Invalid finger_index.")

        valid_values = {choice[0] for choice in Fingerprint.FINGER_CHOICES}

        if value not in valid_values:
            raise serializers.ValidationError("Invalid finger_index.")

        return value

    def to_representation(self, value):
        return value


class FingerprintSerializer(BaseSerializer):
    staff = UUIDRelatedField(
        queryset=Staff.objects.filter(deleted_at__isnull=True),
    )
    finger_index = FingerIndexField()

    class Meta:
        model = Fingerprint
        fields = "__all__"
        read_only_fields = [
            "enrolled_at",
            "enrolled_by",
        ]

    def validate_slot(self, value):
        qs = Fingerprint.objects.filter(
            slot=value,
            deleted_at__isnull=True,
        )

        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                "This scanner slot is already linked to an active fingerprint."
            )

        return value

    def validate(self, attrs):
        staff = attrs.get("staff", getattr(self.instance, "staff", None))
        finger_index = attrs.get(
            "finger_index",
            getattr(self.instance, "finger_index", None),
        )

        if staff is not None and finger_index is not None:
            qs = Fingerprint.objects.filter(
                staff=staff,
                finger_index=finger_index,
                deleted_at__isnull=True,
            )

            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)

            if qs.exists():
                raise serializers.ValidationError(
                    {
                        "finger_index": (
                            "This staff member already has an active "
                            "fingerprint for this finger."
                        )
                    }
                )

        return attrs

    def to_representation(self, instance):
        repr = super().to_representation(instance)

        repr["finger_display"] = instance.finger_display

        repr["staff"] = {
            "internal_base_uuid": instance.staff.internal_base_uuid,
            "id": instance.staff.id,
            "full_name": instance.staff.full_name,
        }

        if instance.enrolled_by:
            repr["enrolled_by"] = {
                "internal_base_uuid": instance.enrolled_by.internal_base_uuid,
                "id": instance.enrolled_by.id,
                "fullname": instance.enrolled_by.fullname,
            }
        else:
            repr["enrolled_by"] = None

        return repr


class AccessLogSerializer(BaseSerializer):
    staff_name = serializers.SerializerMethodField()
    staff_employee_id = serializers.SerializerMethodField()
    staff_role = serializers.SerializerMethodField()
    granted = serializers.SerializerMethodField()
    deny_reason_display = serializers.CharField(
        source="deny_reason_display_value",
        read_only=True,
    )

    class Meta:
        model = AccessLog
        fields = [
            "id",
            "staff",
            "staff_name",
            "staff_employee_id",
            "staff_role",
            "fingerprint",
            "result",
            "granted",
            "deny_reason",
            "deny_reason_display",
            "confidence",
            "scanner_slot",
            "timestamp",
        ]

    def get_staff_name(self, obj):
        return obj.staff.full_name if obj.staff else "Unknown"

    def get_staff_employee_id(self, obj):
        return getattr(obj.staff, "ref_code", "—") if obj.staff else "—"

    def get_staff_role(self, obj):
        if obj.staff and obj.staff.role:
            return obj.staff.role.name
        return "—"

    def get_granted(self, obj):
        return obj.result == AccessLog.RESULT_GRANTED
