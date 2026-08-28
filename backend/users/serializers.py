from .models import CustomUser
from utils.helpers import BaseSerializer
from rest_framework import serializers


class CustomUserSerializer(BaseSerializer):
    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "fullname",
            "is_staff",
            "created_at",
            "updated_at",
            "ref_code",
            "is_active",
            "deleted_at",
            "internal_base_uuid",
        ]


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class LoginResponseSerializer(serializers.Serializer):
    user = CustomUserSerializer(read_only=True)


class ResponseRefreshTokenSerializer(serializers.Serializer):
    detail = serializers.CharField(read_only=True)
