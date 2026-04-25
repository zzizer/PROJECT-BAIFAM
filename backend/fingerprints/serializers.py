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
