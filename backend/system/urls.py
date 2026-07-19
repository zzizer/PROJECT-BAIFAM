from django.urls import path
from .views import DashboardSnapshotView, ScopeListView

urlpatterns = [
    path("dashboard/", DashboardSnapshotView.as_view(), name="dashboard"),
    path("scopes/", ScopeListView.as_view(), name="scope-list"),
]
