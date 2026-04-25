from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import (
    OpenApiParameter,
    extend_schema,
    OpenApiResponse,
)
from utils.pagination import CustomPageNumberPagination
from .models import Fingerprint, AccessLog
from .serializers import (
    AccessLogSerializer,
    FingerprintSerializer,
)
from django.db.models import Count, Q


class FingerprintListCreateView(APIView):
    required_scopes = {
        "GET": ["fingerprints:read"],
        "POST": ["fingerprints:write"],
    }

    @extend_schema(
        summary="List fingerprints",
        description="Returns a paginated list of all active (non-deleted) fingerprints.",
        responses={200: FingerprintSerializer(many=True)},
        tags=["Fingerprints"],
    )
    def get(self, request):
        fingerprints = Fingerprint.objects.filter(deleted_at__isnull=True)
        paginator = CustomPageNumberPagination()
        page = paginator.paginate_queryset(fingerprints, request)
        serializer = FingerprintSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        summary="Create a fingerprint",
        description="Creates a new fingerprint template for a staff member. Each staff can have up to 10 fingerprints (one per finger).",
        request=FingerprintSerializer,
        responses={
            201: FingerprintSerializer,
            400: OpenApiResponse(description="Validation error"),
        },
        tags=["Fingerprints"],
    )
    def post(self, request):
        serializer = FingerprintSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FingerprintDetailView(APIView):
    required_scopes = {
        "GET": ["fingerprints:read"],
        "PATCH": ["fingerprints:write"],
        "DELETE": ["fingerprints:delete"],
    }

    def get_object(self, uuid):
        return get_object_or_404(Fingerprint, base_uuid=uuid)

    @extend_schema(
        summary="Retrieve a fingerprint",
        description="Returns details of a specific fingerprint by UUID.",
        responses={
            200: FingerprintSerializer,
            404: OpenApiResponse(description="Not found"),
        },
        tags=["Fingerprints"],
    )
    def get(self, request, uuid):
        return Response(FingerprintSerializer(self.get_object(uuid)).data)

    @extend_schema(
        summary="Update a fingerprint",
        description="Updates an existing fingerprint. You can change the staff association, finger index, or slot. The same validation rules apply as when creating.",
        request=FingerprintSerializer,
        responses={
            200: FingerprintSerializer,
            400: OpenApiResponse(description="Validation error"),
            404: OpenApiResponse(description="Not found"),
        },
        tags=["Fingerprints"],
    )
    def patch(self, request, uuid):
        fingerprint = self.get_object(uuid)
        serializer = FingerprintSerializer(fingerprint, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @extend_schema(
        summary="Delete a fingerprint",
        description="Soft-deletes a fingerprint. The record will remain in the database but will be marked as deleted and excluded from active queries.",
        responses={
            204: OpenApiResponse(description="No content"),
            404: OpenApiResponse(description="Not found"),
        },
        tags=["Fingerprints"],
    )
    def delete(self, request, uuid):
        fingerprint = self.get_object(uuid)
        fingerprint.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AccessLogListView(APIView):
    required_scopes = {
        "GET": ["access_logs:read"],
    }

    @extend_schema(
        summary="List access logs",
        description="Returns a paginated list of access logs. You can filter by staff UUID, date range, or access result (granted/denied).",
        responses={200: AccessLogSerializer(many=True)},
        tags=["Access Logs"],
        parameters=[
            OpenApiParameter(
                name="staff_uuid",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Filter logs by staff UUID",
                required=False,
            ),
            OpenApiParameter(
                name="start_date",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Filter logs from this date (inclusive). Format: YYYY-MM-DD",
                required=False,
            ),
            OpenApiParameter(
                name="end_date",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Filter logs until this date (inclusive). Format: YYYY-MM-DD",
                required=False,
            ),
            OpenApiParameter(
                name="result",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Filter logs by access result (granted or denied)",
                required=False,
            ),
        ],
    )
    def get(self, request):
        logs = AccessLog.objects.filter(deleted_at__isnull=True)

        staff_uuid = request.query_params.get("staff_uuid")
        if staff_uuid:
            logs = logs.filter(staff__base_uuid=staff_uuid)

        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        if start_date and end_date:
            logs = logs.filter(timestamp__date__range=[start_date, end_date])

        if start_date and not end_date:
            logs = logs.filter(timestamp__date__gte=start_date)

        if end_date and not start_date:
            logs = logs.filter(timestamp__date__lte=end_date)

        result = request.query_params.get("result")
        if result in [AccessLog.RESULT_GRANTED, AccessLog.RESULT_DENIED]:
            logs = logs.filter(result=result)

        aggregates = logs.aggregate(
            total=Count("id"),
            granted_count=Count("id", filter=Q(result=AccessLog.RESULT_GRANTED)),
            denied_count=Count("id", filter=Q(result=AccessLog.RESULT_DENIED)),
        )

        paginator = CustomPageNumberPagination()
        page = paginator.paginate_queryset(
            logs.select_related("staff", "staff__role", "fingerprint"), request
        )
        serializer = AccessLogSerializer(page, many=True)
        return Response(
            {
                "count": aggregates["total"],
                "granted_count": aggregates["granted_count"],
                "denied_count": aggregates["denied_count"],
                "next": paginator.get_next_link(),
                "previous": paginator.get_previous_link(),
                "results": serializer.data,
            }
        )
