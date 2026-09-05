from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from . import network


class ConnectSerializer(serializers.Serializer):
    uuid = serializers.UUIDField(required=False)
    bssid = serializers.RegexField(
        r"^(?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$", required=False
    )
    password = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=64,
        trim_whitespace=False,
        write_only=True,
    )

    def validate(self, attrs):
        if bool(attrs.get("uuid")) == bool(attrs.get("bssid")):
            raise serializers.ValidationError("Provide either uuid or bssid.")
        if attrs.get("uuid") and attrs.get("password"):
            raise serializers.ValidationError("Saved networks use saved credentials.")
        if any(char in attrs.get("password", "") for char in ("\n", "\r", "\0")):
            raise serializers.ValidationError("Password contains invalid characters.")
        if attrs.get("bssid"):
            attrs["bssid"] = attrs["bssid"].upper()
        return attrs


class NetworkConnectView(APIView):
    required_scopes = {"POST": ["write:settings"]}

    @extend_schema(
        tags=["Networks"], request=ConnectSerializer, responses=OpenApiTypes.OBJECT
    )
    def post(self, request):
        serializer = ConnectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with network.network_operation():
            uuid = network.connect(serializer.validated_data)
        return Response({"uuid": uuid})


class NetworkForgetView(APIView):
    required_scopes = {"DELETE": ["write:settings"]}

    @extend_schema(tags=["Networks"], responses={204: None})
    def delete(self, request, uuid):
        with network.network_operation():
            network.forget(
                str(uuid), disconnect=request.query_params.get("disconnect") == "true"
            )
        return Response(status=204)
