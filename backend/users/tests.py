from django.conf import settings
from django.urls import reverse
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request
from rest_framework.test import APIClient, APIRequestFactory, APITestCase
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from .authentication import CookieJWTAuthentication
from .models import CustomUser


class AuthenticationEndpointTests(APITestCase):
    password = "correct-horse-battery-staple"

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="admin@example.com",
            password=self.password,
            fullname="Admin User",
        )
        self.client = APIClient(enforce_csrf_checks=True)
        csrf_response = self.client.get(reverse("csrf"))
        self.csrf_token = csrf_response.cookies["csrftoken"].value

    def post(self, url_name, data=None):
        return self.client.post(
            reverse(url_name),
            data or {},
            format="json",
            HTTP_X_CSRFTOKEN=self.csrf_token,
        )

    def test_login_sets_httponly_cookies_without_returning_tokens(self):
        response = self.post(
            "login",
            {
                "email": self.user.email,
                "password": self.password,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn(settings.ACCESS_COOKIE_NAME, response.cookies)
        self.assertIn(settings.REFRESH_COOKIE_NAME, response.cookies)
        self.assertTrue(
            response.cookies[settings.ACCESS_COOKIE_NAME]["httponly"]
        )
        self.assertTrue(
            response.cookies[settings.REFRESH_COOKIE_NAME]["httponly"]
        )
        self.assertEqual(
            response.cookies[settings.ACCESS_COOKIE_NAME]["path"],
            settings.ACCESS_COOKIE_PATH,
        )
        self.assertEqual(
            response.cookies[settings.REFRESH_COOKIE_NAME]["path"],
            settings.REFRESH_COOKIE_PATH,
        )
        self.assertNotIn("access", response.data)
        self.assertNotIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], self.user.email)

    def test_invalid_login_does_not_set_auth_cookies(self):
        response = self.post(
            "login",
            {
                "email": self.user.email,
                "password": "wrong-password",
            },
        )

        self.assertEqual(response.status_code, 401)
        self.assertNotIn(settings.ACCESS_COOKIE_NAME, response.cookies)
        self.assertNotIn(settings.REFRESH_COOKIE_NAME, response.cookies)

    def test_login_requires_csrf(self):
        response = self.client.post(
            reverse("login"),
            {
                "email": self.user.email,
                "password": self.password,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_refresh_rotates_cookie_without_returning_tokens(self):
        refresh = RefreshToken.for_user(self.user)
        self.client.cookies[settings.REFRESH_COOKIE_NAME] = str(refresh)

        response = self.post("token_refresh")

        self.assertEqual(response.status_code, 200)
        self.assertIn(settings.ACCESS_COOKIE_NAME, response.cookies)
        self.assertIn(settings.REFRESH_COOKIE_NAME, response.cookies)
        self.assertNotIn("access", response.data)
        self.assertNotIn("refresh", response.data)

    def test_refresh_rejects_missing_cookie(self):
        response = self.post("token_refresh")

        self.assertEqual(response.status_code, 401)

    def test_refresh_rejects_invalid_cookie(self):
        self.client.cookies[settings.REFRESH_COOKIE_NAME] = "invalid"

        response = self.post("token_refresh")

        self.assertEqual(response.status_code, 401)

    def test_logout_blacklists_refresh_and_clears_cookies(self):
        refresh = RefreshToken.for_user(self.user)
        self.client.cookies[settings.ACCESS_COOKIE_NAME] = str(
            refresh.access_token
        )
        self.client.cookies[settings.REFRESH_COOKIE_NAME] = str(refresh)

        response = self.post("logout")

        self.assertEqual(response.status_code, 205)
        self.assertEqual(
            response.cookies[settings.ACCESS_COOKIE_NAME]["max-age"],
            0,
        )
        self.assertEqual(
            response.cookies[settings.REFRESH_COOKIE_NAME]["max-age"],
            0,
        )

        with self.assertRaises(Exception):
            RefreshToken(str(refresh)).check_blacklist()


class CookieJWTAuthenticationTests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="cookie-auth@example.com",
            password="test-password",
        )
        self.factory = APIRequestFactory()
        self.authentication = CookieJWTAuthentication()

    def test_valid_access_cookie_authenticates(self):
        token = AccessToken.for_user(self.user)
        django_request = self.factory.get(
            "/protected/",
            HTTP_COOKIE=(
                f"{settings.ACCESS_COOKIE_NAME}={str(token)}"
            ),
        )

        user, validated_token = self.authentication.authenticate(
            Request(django_request)
        )

        self.assertEqual(user, self.user)
        self.assertEqual(validated_token["user_id"], str(self.user.pk))

    def test_invalid_access_cookie_fails(self):
        django_request = self.factory.get(
            "/protected/",
            HTTP_COOKIE=f"{settings.ACCESS_COOKIE_NAME}=invalid",
        )

        with self.assertRaises(AuthenticationFailed):
            self.authentication.authenticate(Request(django_request))

    def test_bearer_authentication_remains_supported(self):
        token = AccessToken.for_user(self.user)
        django_request = self.factory.get(
            "/protected/",
            HTTP_AUTHORIZATION=f"Bearer {str(token)}",
        )

        user, _ = self.authentication.authenticate(
            Request(django_request)
        )

        self.assertEqual(user, self.user)
