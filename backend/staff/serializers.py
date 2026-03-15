from .models import Staff, Department, Role, StaffFingerprint
from utils.helpers import BaseSerializer
from utils.helpers import UUIDRelatedField
from users.models import CustomUser
from fingerprints.serializers import FingerprintSerializer


class RoleSerializer(BaseSerializer):
    class Meta:
        model = Role
        fields = "__all__"


class DepartmentSerializer(BaseSerializer):
    class Meta:
        model = Department
        fields = "__all__"


class StaffFingerprintSerializer(BaseSerializer):
    class Meta:
        model = StaffFingerprint
        fields = "__all__"

    def to_representation(self, instance):
        repr = super().to_representation(instance)
        repr["fingerprint"] = FingerprintSerializer(instance.fingerprint).data
        return repr


class StaffSerializer(BaseSerializer):
    role = UUIDRelatedField(
        queryset=Role.objects.all(), required=False, allow_null=True
    )
    department = UUIDRelatedField(
        queryset=Department.objects.all(), required=False, allow_null=True
    )
    user = UUIDRelatedField(
        queryset=CustomUser.objects.all(), required=False, allow_null=True
    )
    fingerprints = StaffFingerprintSerializer(
        source="staff_fingerprints",
        many=True,
        read_only=True,
    )

    class Meta:
        model = Staff
        fields = "__all__"

    def to_representation(self, instance):
        repr = super().to_representation(instance)

        repr["role"] = RoleSerializer(instance.role).data if instance.role else None
        repr["department"] = (
            DepartmentSerializer(instance.department).data
            if instance.department
            else None
        )

        return repr
