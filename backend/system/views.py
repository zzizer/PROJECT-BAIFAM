from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from utils.pagination import CustomPageNumberPagination
from system.models import Scope
from .serializers import (
    ScopeSerializer,
)
from drf_spectacular.utils import extend_schema
from device.models import DeviceSettings
from fingerprints.models import AccessLog
from fingerprints.serializers import AccessLogSerializer
from .dashboard import get_hardware_snapshot


class DashboardSnapshotView(APIView):
    required_scopes = {
        "GET": ["dashboard:read"],
    }

    @extend_schema(
        summary="Get Dashboard Snapshot",
        description="Returns current hardware state and access statistics.",
        tags=["System"],
        responses={200: dict},
    )
    def get(self, request):
        today = timezone.localdate()
        logs = AccessLog.objects.filter(timestamp__date=today)
        totals = logs.aggregate(
            granted=Count(
                "id",
                filter=Q(result=AccessLog.RESULT_GRANTED),
            ),
            denied=Count(
                "id",
                filter=Q(result=AccessLog.RESULT_DENIED),
            ),
            total=Count("id"),
            staff_seen=Count(
                "staff_id",
                filter=Q(staff_id__isnull=False),
                distinct=True,
            ),
        )
        recent = logs.select_related(
            "staff",
            "staff__role",
            "fingerprint",
        )[:10]
        hardware = get_hardware_snapshot()
        settings = DeviceSettings.get()

        return Response(
            {
                "generated_at": timezone.now().isoformat(),
                "device": {
                    "name": settings.device_name,
                    "scanner_connected": hardware.get(
                        "scanner",
                        {},
                    ).get("connected", False),
                    "door_locked": hardware.get(
                        "door",
                        {},
                    ).get("locked", True),
                    "uptime_seconds": hardware.get(
                        "system",
                        {},
                    ).get("uptime_seconds", 0),
                },
                "scanner": hardware.get("scanner_storage"),
                "today": totals,
                "system": hardware.get("system"),
                "recent_access": AccessLogSerializer(
                    recent,
                    many=True,
                ).data,
            }
        )


class ScopeListView(APIView):
    required_scopes = {
        "GET": ["scopes:read"],
    }

    @extend_schema(
        summary="List scopes",
        description="Returns a paginated list of all active scopes.",
        responses={200: ScopeSerializer(many=True)},
        tags=["System"],
    )
    def get(self, request):
        qs = Scope.objects.filter(is_active=True).order_by("value")

        paginator = CustomPageNumberPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = ScopeSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
