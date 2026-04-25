from .models import Staff, Department, Role, StaffFingerprint, AccessPermission
from utils.helpers import BaseSerializer
from utils.helpers import UUIDRelatedField
from users.models import CustomUser
from fingerprints.serializers import FingerprintSerializer
from rest_framework import serializers


class RoleSerializer(BaseSerializer):
    staff_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Role
        fields = "__all__"

    def get_staff_count(self, obj):
        return obj.staff_members.count()


class DepartmentSerializer(BaseSerializer):
    staff_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Department
        fields = "__all__"

    def get_staff_count(self, obj):
        return obj.staff_members.count()


class StaffFingerprintSerializer(BaseSerializer):
    class Meta:
        model = StaffFingerprint
        fields = "__all__"

    def to_representation(self, instance):
        repr = super().to_representation(instance)
        repr["fingerprint"] = FingerprintSerializer(instance.fingerprint).data
        return repr


class AccessPermissionSerializer(BaseSerializer):
    class Meta:
        model = AccessPermission
        fields = "__all__"
        read_only_fields = [
            "staff",
        ]


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
    access_permission = AccessPermissionSerializer(write_only=True)

    access_config = serializers.SerializerMethodField(read_only=True)

    def get_access_config(self):
        if (
            hasattr(self.instance, "access_permission")
            and self.instance.access_permission
        ):
            return AccessPermissionSerializer(self.instance.access_permission).data
        return None

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

    def create(self, validated_data):
        access_permission_data = validated_data.pop("access_permission", None)
        staff = super().create(validated_data)

        if access_permission_data is not None:
            AccessPermission.objects.create(staff=staff, **access_permission_data)

        return staff

    def update(self, instance, validated_data):
        access_permission_data = validated_data.pop("access_permission", None)
        staff = super().update(instance, validated_data)

        if access_permission_data is not None:
            AccessPermission.objects.update_or_create(
                staff=staff,
                defaults=access_permission_data,
            )

        return staff
