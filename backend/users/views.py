from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from drf_spectacular.utils import extend_schema
from .serializers import (
    LoginSerializer,
    LoginResponseSerializer,
    CustomUserSerializer,
    RefreshTokenSerializer,
    ResponseRefreshTokenSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError


class LoginView(APIView):

    permission_classes = [AllowAny]

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

        token = user.get_tokens()

        response_data = {
            "access": str(token["access"]),
            "refresh": str(token["refresh"]),
            "user": CustomUserSerializer(user).data,
        }

        return Response(response_data)


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=RefreshTokenSerializer,
        responses=ResponseRefreshTokenSerializer,
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refresh_token = serializer.validated_data["refresh"]

        try:
            refresh = RefreshToken(refresh_token)

            access_token = refresh.access_token

            return Response(
                {"access": str(access_token), "refresh": str(refresh)},
                status=status.HTTP_200_OK,
            )

        except TokenError:
            return Response(
                {"detail": "Invalid or expired refresh token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class LogoutView(APIView):
    @extend_schema(
        request=RefreshTokenSerializer,
        responses={205: None, 400: {"detail": "Invalid refresh token"}},
        tags=["Authentication"],
    )
    def post(self, request):
        try:
            serializer = RefreshTokenSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            refresh_token = serializer.validated_data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"detail": "Successfully logged out"},
                status=status.HTTP_205_RESET_CONTENT,
            )
        except Exception as e:
            return Response(
                {"detail": "Invalid refresh token"},
                status=status.HTTP_400_BAD_REQUEST,
            )
