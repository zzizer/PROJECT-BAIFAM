from django.urls import path
from .views import (
    APIKeyListCreateView,
    APIKeyDetailView,
    APIKeyToggleView,
    APIKeyRequestLogListView,
)

urlpatterns = [
    path(
        "",
        APIKeyListCreateView.as_view(),
        name="api-key-list-create",
    ),
    path(
        "<uuid:uuid>/",
        APIKeyDetailView.as_view(),
        name="api-key-detail",
    ),
    path(
        "<uuid:uuid>/toggle/",
        APIKeyToggleView.as_view(),
        name="api-key-toggle",
    ),
    path(
        "logs/",
        APIKeyRequestLogListView.as_view(),
        name="api-key-log-list",
    ),
]
