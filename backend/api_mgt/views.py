from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from utils.pagination import CustomPageNumberPagination
from .models import APIKey, APIKeyRequestLog
from .serializers import (
    APIKeySerializer,
    CreateAPIKeySerializer,
    UpdateAPIKeySerializer,
    APIKeyRequestLogSerializer,
)
from drf_spectacular.utils import extend_schema, OpenApiResponse


class APIKeyListCreateView(APIView):
    required_scopes = {
        "GET": ["api_keys:read"],
        "POST": ["api_keys:write"],
    }

    @extend_schema(
        responses={200: APIKeySerializer(many=True), 201: APIKeySerializer},
        request=CreateAPIKeySerializer,
        summary="List and create API keys",
        description="GET returns a paginated list of API keys. POST creates a new API key with specified name, scopes, and optional expiration. The plaintext key is only returned on creation.",
        tags=["API Keys"],
    )
    def get(self, request):
        qs = (
            APIKey.objects.filter(deleted_at__isnull=True)
            .select_related("created_by")
            .prefetch_related("api_key_scopes__scope")
            .order_by("-created_at")
        )

        search = request.query_params.get("search")
        if search:
            qs = qs.filter(name__icontains=search)

        status_filter = request.query_params.get("status")
        if status_filter == "active":
            qs = qs.filter(is_active=True)
        elif status_filter == "inactive":
            qs = qs.filter(is_active=False)

        paginator = CustomPageNumberPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = APIKeySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        summary="Create a new API key",
        description="",
        request=CreateAPIKeySerializer,
        responses={
            201: APIKeySerializer,
            400: OpenApiResponse(description="Validation error"),
        },
        tags=["API Keys"],
    )
    def post(self, request):
        serializer = CreateAPIKeySerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        instance, plaintext = serializer.save()
        out = APIKeySerializer(instance).data
        out["plaintext_key"] = plaintext
        return Response(out, status=status.HTTP_201_CREATED)


class APIKeyDetailView(APIView):
    required_scopes = {
        "GET": ["api_keys:read"],
        "PATCH": ["api_keys:write"],
        "DELETE": ["api_keys:delete"],
    }

    def _get_object(self, uuid):
        return get_object_or_404(
            APIKey.objects.prefetch_related("api_key_scopes__scope").select_related(
                "created_by"
            ),
            internal_base_uuid=uuid,
            deleted_at__isnull=True,
        )

    @extend_schema(
        summary="Retrieve API key details",
        description="Returns details of an API key, including its scopes and request log count.",
        responses={
            200: APIKeySerializer,
            404: OpenApiResponse(description="Not found"),
        },
        tags=["API Keys"],
    )
    def get(self, request, uuid):
        instance = self._get_object(uuid)
        return Response(APIKeySerializer(instance).data)

    @extend_schema(
        summary="Update an API key",
        request=UpdateAPIKeySerializer,
        tags=["API Keys"],
    )
    def patch(self, request, uuid):
        instance = self._get_object(uuid)
        serializer = UpdateAPIKeySerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(APIKeySerializer(instance).data)

    @extend_schema(
        summary="Delete an API Key",
        tags=["API Keys"],
    )
    def delete(self, request, uuid):
        instance = self._get_object(uuid)
        instance.delete(deleted_by=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class APIKeyToggleView(APIView):
    @extend_schema(
        summary="Activate or Deactivate an API key",
        description="Toggles the active status of an API key. If the key is currently active, it will be deactivated, and vice versa.",
        responses={
            200: APIKeySerializer,
            404: OpenApiResponse(description="Not found"),
        },
        tags=["API Keys"],
    )
    def post(self, request, uuid):
        instance = get_object_or_404(
            APIKey, internal_base_uuid=uuid, deleted_at__isnull=True
        )
        instance.is_active = not instance.is_active
        instance.save(update_fields=["is_active", "updated_at"])
        return Response(APIKeySerializer(instance).data)


class APIKeyRequestLogListView(APIView):
    required_scopes = {
        "GET": ["api_keys:read"],
    }

    @extend_schema(
        summary="List API key request logs",
        description="Returns a paginated list of API key request logs. Can be filtered by API key UUID and HTTP method.",
        responses={
            200: APIKeyRequestLogSerializer(many=True),
        },
        tags=["API Keys"],
    )
    def get(self, request):
        qs = APIKeyRequestLog.objects.select_related("api_key").order_by(
            "-requested_at"
        )

        api_key_uuid = request.query_params.get("api_key")
        if api_key_uuid:
            qs = qs.filter(api_key__internal_base_uuid=api_key_uuid)

        method = request.query_params.get("method")
        if method:
            qs = qs.filter(method=method.upper())

        paginator = CustomPageNumberPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = APIKeyRequestLogSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
