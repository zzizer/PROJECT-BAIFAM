from rest_framework import serializers
from utils.helpers import BaseSerializer
from .models import APIKey, APIKeyScope, APIKeyRequestLog
from system.models import Scope
from system.serializers import ScopeSerializer


class APIKeyScopeSerializer(serializers.ModelSerializer):
    scope = ScopeSerializer(read_only=True)

    class Meta:
        model = APIKeyScope
        fields = "__all__"


class APIKeySerializer(BaseSerializer):
    scopes = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    created_by_name = serializers.SerializerMethodField()
    request_log_count = serializers.SerializerMethodField()

    class Meta:
        model = APIKey
        fields = "__all__"

    def get_scopes(self, obj):
        active_scopes = obj.api_key_scopes.filter(is_active=True).select_related(
            "scope"
        )
        return [
            {
                "id": aks.scope.id,
                "uuid": str(aks.scope.internal_base_uuid),
                "value": aks.scope.value,
                "label": aks.scope.label,
                "description": aks.scope.description,
                "scope_link_id": aks.id,
                "scope_link_active": aks.is_active,
            }
            for aks in active_scopes
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return getattr(obj.created_by, "fullname", None) or obj.created_by.email
        return None

    def get_request_log_count(self, obj):
        return obj.request_logs.count()


class CreateAPIKeySerializer(serializers.Serializer):
    name = serializers.CharField(max_length=128)
    scope_uuids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
        help_text="List of Scope internal_base_uuid values to attach.",
    )
    expires_at = serializers.DateTimeField(required=False, allow_null=True)

    def validate_scope_uuids(self, value):
        scopes = Scope.objects.filter(internal_base_uuid__in=value, is_active=True)
        if scopes.count() != len(value):
            raise serializers.ValidationError(
                "One or more scope UUIDs are invalid or inactive."
            )
        return value

    def create(self, validated_data):
        scope_uuids = validated_data.pop("scope_uuids")
        request = self.context["request"]
        instance, plaintext = APIKey.generate()
        instance.name = validated_data["name"]
        instance.expires_at = validated_data.get("expires_at")
        instance.created_by = request.user
        instance.save()

        scopes = Scope.objects.filter(internal_base_uuid__in=scope_uuids)
        for scope in scopes:
            APIKeyScope.objects.create(api_key=instance, scope=scope)

        return instance, plaintext


class UpdateAPIKeySerializer(serializers.ModelSerializer):
    scope_uuids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=False,
        write_only=True,
        help_text="Replaces all current scope assignments.",
    )

    class Meta:
        model = APIKey
        fields = ["name", "expires_at", "scope_uuids"]

    def validate_scope_uuids(self, value):
        scopes = Scope.objects.filter(internal_base_uuid__in=value, is_active=True)
        if scopes.count() != len(value):
            raise serializers.ValidationError(
                "One or more scope UUIDs are invalid or inactive."
            )
        return value

    def update(self, instance, validated_data):
        scope_uuids = validated_data.pop("scope_uuids", None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        if scope_uuids is not None:
            instance.api_key_scopes.all().delete()
            scopes = Scope.objects.filter(internal_base_uuid__in=scope_uuids)
            for scope in scopes:
                APIKeyScope.objects.create(api_key=instance, scope=scope)

        return instance


class APIKeyRequestLogSerializer(serializers.ModelSerializer):
    api_key_name = serializers.CharField(source="api_key.name", read_only=True)
    api_key_prefix = serializers.CharField(source="api_key.prefix", read_only=True)

    class Meta:
        model = APIKeyRequestLog
        fields = [
            "id",
            "api_key",
            "api_key_name",
            "api_key_prefix",
            "method",
            "path",
            "status_code",
            "ip_address",
            "requested_at",
        ]
