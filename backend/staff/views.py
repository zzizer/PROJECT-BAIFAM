from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiResponse
from utils.pagination import CustomPageNumberPagination
from .models import Staff, Department, Role
from .serializers import (
    RoleSerializer,
    DepartmentSerializer,
    StaffSerializer,
)


class RoleListCreateView(APIView):
    required_scopes = {
        "GET": ["roles:read"],
        "POST": ["roles:write"],
    }

    @extend_schema(
        summary="List roles",
        description="Returns a paginated list of all active (non-deleted) roles.",
        responses={200: RoleSerializer(many=True)},
        tags=["Roles"],
    )
    def get(self, request):
        roles = Role.objects.filter(deleted_at__isnull=True)
        paginator = CustomPageNumberPagination()
        page = paginator.paginate_queryset(roles, request)
        serializer = RoleSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        summary="Create a role",
        description="Creates a new role. Name must be unique.",
        request=RoleSerializer,
        responses={
            201: RoleSerializer,
            400: OpenApiResponse(description="Validation error"),
        },
        tags=["Roles"],
    )
    def post(self, request):
        serializer = RoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RoleDetailView(APIView):
    required_scopes = {
        "GET": ["roles:read"],
        "PATCH": ["roles:write"],
        "DELETE": ["roles:delete"],
    }

    def get_object(self, uuid):
        return get_object_or_404(Role, base_uuid=uuid)

    @extend_schema(
        summary="Retrieve a role",
        responses={
            200: RoleSerializer,
            404: OpenApiResponse(description="Not found"),
        },
        tags=["Roles"],
    )
    def get(self, request, uuid):
        return Response(RoleSerializer(self.get_object(uuid)).data)

    @extend_schema(
        summary="Partially update a role",
        request=RoleSerializer,
        responses={
            200: RoleSerializer,
            400: OpenApiResponse(description="Validation error"),
            404: OpenApiResponse(description="Not found"),
        },
        tags=["Roles"],
    )
    def patch(self, request, uuid):
        serializer = RoleSerializer(
            self.get_object(uuid), data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @extend_schema(
        summary="Delete a role",
        responses={
            204: OpenApiResponse(description="Deleted successfully"),
            404: OpenApiResponse(description="Not found"),
        },
        tags=["Roles"],
    )
    def delete(self, request, uuid):
        self.get_object(uuid).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DepartmentListCreateView(APIView):
    required_scopes = {
        "GET": ["departments:read"],
        "POST": ["departments:write"],
    }

    @extend_schema(
        summary="List departments",
        description="Returns a paginated list of all active (non-deleted) departments.",
        responses={200: DepartmentSerializer(many=True)},
        tags=["Departments"],
    )
    def get(self, request):
        departments = Department.objects.filter(deleted_at__isnull=True)
        paginator = CustomPageNumberPagination()
        page = paginator.paginate_queryset(departments, request)
        serializer = DepartmentSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        summary="Create a department",
        description="Creates a new department. Name must be unique.",
        request=DepartmentSerializer,
        responses={
            201: DepartmentSerializer,
            400: OpenApiResponse(description="Validation error"),
        },
        tags=["Departments"],
    )
    def post(self, request):
        serializer = DepartmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DepartmentDetailView(APIView):
    required_scopes = {
        "GET": ["departments:read"],
        "PATCH": ["departments:write"],
        "DELETE": ["departments:delete"],
    }

    def get_object(self, uuid):
        return get_object_or_404(Department, base_uuid=uuid)

    @extend_schema(
        summary="Retrieve a department",
        responses={
            200: DepartmentSerializer,
            404: OpenApiResponse(description="Not found"),
        },
        tags=["Departments"],
    )
    def get(self, request, uuid):
        return Response(DepartmentSerializer(self.get_object(uuid)).data)

    @extend_schema(
        summary="Partially update a department",
        request=DepartmentSerializer,
        responses={
            200: DepartmentSerializer,
            400: OpenApiResponse(description="Validation error"),
            404: OpenApiResponse(description="Not found"),
        },
        tags=["Departments"],
    )
    def patch(self, request, uuid):
        serializer = DepartmentSerializer(
            self.get_object(uuid), data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @extend_schema(
        summary="Delete a department",
        responses={
            204: OpenApiResponse(description="Deleted successfully"),
            404: OpenApiResponse(description="Not found"),
        },
        tags=["Departments"],
    )
    def delete(self, request, uuid):
        self.get_object(uuid).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StaffListCreateView(APIView):
    required_scopes = {
        "GET": ["staff:read"],
        "POST": ["staff:write"],
    }

    @extend_schema(
        summary="List staff members",
        description=(
            "Returns a paginated list of active staff. "
            "Role and department are returned as nested objects."
        ),
        responses={200: StaffSerializer(many=True)},
        tags=["Staff"],
    )
    def get(self, request):
        staff = Staff.objects.select_related("role", "department").filter(
            deleted_at__isnull=True
        )
        paginator = CustomPageNumberPagination()
        page = paginator.paginate_queryset(staff, request)
        serializer = StaffSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        summary="Create a staff member",
        description="Creates a staff member. Pass role and department as base_uuid values.",
        request=StaffSerializer,
        responses={
            201: StaffSerializer,
            400: OpenApiResponse(description="Validation error"),
        },
        tags=["Staff"],
    )
    def post(self, request):
        serializer = StaffSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StaffDetailView(APIView):
    required_scopes = {
        "GET": ["staff:read"],
        "PATCH": ["staff:write"],
        "DELETE": ["staff:delete"],
    }

    def get_object(self, uuid):
        return get_object_or_404(
            Staff.objects.select_related("role", "department"),
            base_uuid=uuid,
        ).filter(deleted_at__isnull=True)

    @extend_schema(
        summary="Retrieve a staff member",
        responses={
            200: StaffSerializer,
            404: OpenApiResponse(description="Not found"),
        },
        tags=["Staff"],
    )
    def get(self, request, uuid):
        return Response(StaffSerializer(self.get_object(uuid)).data)

    @extend_schema(
        summary="Partially update a staff member",
        request=StaffSerializer,
        responses={
            200: StaffSerializer,
            400: OpenApiResponse(description="Validation error"),
            404: OpenApiResponse(description="Not found"),
        },
        tags=["Staff"],
    )
    def patch(self, request, uuid):
        serializer = StaffSerializer(
            self.get_object(uuid),
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @extend_schema(
        summary="Delete a staff member",
        responses={
            204: OpenApiResponse(description="Deleted successfully"),
            404: OpenApiResponse(description="Not found"),
        },
        tags=["Staff"],
    )
    def delete(self, request, uuid):
        self.get_object(uuid).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
