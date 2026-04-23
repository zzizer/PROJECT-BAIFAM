from rest_framework.views import APIView
from utils.pagination import CustomPageNumberPagination
from system.models import Scope
from .serializers import (
    ScopeSerializer,
)
from drf_spectacular.utils import extend_schema


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
