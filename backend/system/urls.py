from django.urls import path
from .views import ScopeListView

urlpatterns = [
    path("scopes/", ScopeListView.as_view(), name="scope-list"),
]

