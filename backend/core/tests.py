from unittest.mock import AsyncMock, patch
from urllib.parse import urlparse

from channels.sessions import CookieMiddleware
from channels.security.websocket import OriginValidator
from channels.testing import WebsocketCommunicator
from django.conf import settings
from django.test import TransactionTestCase
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.tokens import AccessToken

from users.models import CustomUser

from .websocket_auth import JWTAuthMiddleware


async def authenticated_socket(scope, receive, send):
    message = await receive()
    if message["type"] != "websocket.connect":
        return

    await send({"type": "websocket.accept"})
    await send(
        {
            "type": "websocket.send",
            "text": str(scope["user"].pk),
        }
    )


def middleware_application():
    return CookieMiddleware(
        JWTAuthMiddleware(authenticated_socket)
    )


class WebSocketCookieAuthenticationTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="socket@example.com",
            password="test-password",
        )

    @patch(
        "core.websocket_auth.authenticate_token",
        new_callable=AsyncMock,
    )
    async def test_valid_access_cookie_authenticates(
        self, authenticate_token
    ):
        token = AccessToken.for_user(self.user)
        authenticate_token.return_value = (self.user, token)
        communicator = WebsocketCommunicator(
            middleware_application(),
            "/ws/test/",
            headers=[
                (
                    b"cookie",
                    (
                        f"{settings.ACCESS_COOKIE_NAME}={str(token)}"
                    ).encode(),
                )
            ],
        )

        connected, _ = await communicator.connect()

        self.assertTrue(connected)
        self.assertEqual(
            await communicator.receive_from(),
            str(self.user.pk),
        )
        await communicator.disconnect()

    async def test_missing_cookie_is_rejected(self):
        communicator = WebsocketCommunicator(
            middleware_application(),
            "/ws/test/",
        )

        connected, close_code = await communicator.connect()

        self.assertFalse(connected)
        self.assertEqual(close_code, 4401)

    @patch(
        "core.websocket_auth.authenticate_token",
        new_callable=AsyncMock,
    )
    async def test_invalid_cookie_is_rejected(
        self, authenticate_token
    ):
        authenticate_token.side_effect = InvalidToken("Invalid token")
        communicator = WebsocketCommunicator(
            middleware_application(),
            "/ws/test/",
            headers=[
                (
                    b"cookie",
                    f"{settings.ACCESS_COOKIE_NAME}=invalid".encode(),
                )
            ],
        )

        connected, close_code = await communicator.connect()

        self.assertFalse(connected)
        self.assertEqual(close_code, 4401)

    def test_untrusted_origin_is_rejected(self):
        validator = OriginValidator(
            middleware_application(),
            ["https://trusted.example.com"],
        )

        self.assertFalse(
            validator.valid_origin(
                urlparse("https://evil.example.com")
            )
        )
        self.assertTrue(
            validator.valid_origin(
                urlparse("https://trusted.example.com")
            )
        )
