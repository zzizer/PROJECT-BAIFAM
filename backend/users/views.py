from django.contrib.auth import authenticate
from django.conf import settings
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .cookies import (
    clear_auth_cookies,
    set_access_cookie,
    set_refresh_cookie,
)
from .serializers import (
    CustomUserSerializer,
    LoginResponseSerializer,
    LoginSerializer,
    ResponseRefreshTokenSerializer,
)


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        request=LoginSerializer,
        responses=LoginResponseSerializer,
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(request, email=email, password=password)

        if not user:
            return Response(
                {"detail": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        response = Response(
            {"user": CustomUserSerializer(user).data},
            status=status.HTTP_200_OK,
        )
        set_access_cookie(response, refresh.access_token)
        set_refresh_cookie(response, refresh)

        return response


@method_decorator(csrf_protect, name="dispatch")
class RefreshTokenView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        request=None,
        responses=ResponseRefreshTokenSerializer,
        tags=["Authentication"],
    )
    def post(self, request):
        refresh_token = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if not refresh_token:
            return Response(
                {"detail": "Refresh token cookie is missing"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            serializer = TokenRefreshSerializer(
                data={"refresh": refresh_token}
            )
            serializer.is_valid(raise_exception=True)
        except (InvalidToken, TokenError):
            return Response(
                {"detail": "Invalid or expired refresh token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        response = Response(
            {"detail": "Token refreshed"},
            status=status.HTTP_200_OK,
        )
        set_access_cookie(response, serializer.validated_data["access"])

        rotated_refresh = serializer.validated_data.get("refresh")
        if rotated_refresh:
            set_refresh_cookie(response, rotated_refresh)

        return response


@method_decorator(csrf_protect, name="dispatch")
class LogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        request=None,
        responses={205: None, 400: {"detail": "Invalid refresh token"}},
        tags=["Authentication"],
    )
    def post(self, request):
        refresh_token = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)

        response = Response(
            {"detail": "Successfully logged out"},
            status=status.HTTP_205_RESET_CONTENT,
        )
        clear_auth_cookies(response)

        if not refresh_token:
            return response

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            response.data = {
                "detail": "Invalid or expired refresh token"
            }
            response.status_code = status.HTTP_400_BAD_REQUEST

        return response


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CSRFTokenView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        responses={200: {"detail": "CSRF cookie set"}},
        tags=["Authentication"],
    )
    def get(self, request):
        get_token(request)
        return Response(
            {"detail": "CSRF cookie set"},
            status=status.HTTP_200_OK,
        )
