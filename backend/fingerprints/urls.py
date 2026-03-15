from django.urls import path
from .views import (
    FingerprintListCreateView,
    FingerprintDetailView,
    AccessLogListView,
)

urlpatterns = [
    path(
        "",
        FingerprintListCreateView.as_view(),
        name="fingerprint-list-create",
    ),
    path(
        "<uuid:uuid>/",
        FingerprintDetailView.as_view(),
        name="fingerprint-detail",
    ),
    path(
        "access-logs/",
        AccessLogListView.as_view(),
        name="access-log-list",
    ),
]
