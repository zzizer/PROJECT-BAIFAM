from rest_framework import serializers
from .models import Staff, Department, Role
from utils.helpers import BaseSerializer
from utils.helpers import UUIDRelatedField


class RoleSerializer(BaseSerializer):
    class Meta:
        model = Role
        fields = "__all__"


class DepartmentSerializer(BaseSerializer):
    class Meta:
        model = Department
        fields = "__all__"


class StaffSerializer(BaseSerializer):
    role = UUIDRelatedField(queryset=Role.objects.all())
    department = UUIDRelatedField(queryset=Department.objects.all())

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
