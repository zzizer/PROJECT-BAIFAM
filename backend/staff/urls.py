from django.urls import path
from .views import (
    RoleListCreateView,
    RoleDetailView,
    DepartmentListCreateView,
    DepartmentDetailView,
    StaffListCreateView,
    StaffDetailView,
)

urlpatterns = [
    path("roles/", RoleListCreateView.as_view(), name="role-list-create"),
    path("roles/<uuid:uuid>/", RoleDetailView.as_view(), name="role-detail"),
    path(
        "departments/",
        DepartmentListCreateView.as_view(),
        name="department-list-create",
    ),
    path(
        "departments/<uuid:uuid>/",
        DepartmentDetailView.as_view(),
        name="department-detail",
    ),
    path("", StaffListCreateView.as_view(), name="staff-list-create"),
    path("<uuid:uuid>/", StaffDetailView.as_view(), name="staff-detail"),
]
