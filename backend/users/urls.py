from django.urls import path

from .views import (
    CSRFTokenView,
    LoginView,
    LogoutView,
    RefreshTokenView,
)

urlpatterns = [
    path("csrf/", CSRFTokenView.as_view(), name="csrf"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", RefreshTokenView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
]
