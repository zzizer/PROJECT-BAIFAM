from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied
from .models import APIKey


class HasRequiredScopes(BasePermission):
    """
    Supports two declaration styles on APIView:

    1. Flat list — all methods require the same scopes:
        required_scopes = ["devices:read"]

    2. Per-method dict — different scopes per HTTP method:
        required_scopes = {
            "GET":    ["devices:read"],
            "POST":   ["devices:write"],
            "PUT":    ["devices:write"],
            "PATCH":  ["devices:write"],
            "DELETE": ["devices:delete"],
        }

    JWT-authenticated requests always pass through.
    Unlisted methods in a dict declaration pass through too.
    """

    def has_permission(self, request, view) -> bool:
        declared = getattr(view, "required_scopes", None)

        if not declared:
            return True

        if not isinstance(request.auth, APIKey):
            return True

        required_scopes = self._resolve_scopes(declared, request.method)

        if required_scopes is None:
            return True

        api_key: APIKey = request.auth
        missing = [s for s in required_scopes if not api_key.has_scope(s)]

        if missing:
            raise PermissionDenied(
                {
                    "detail": "API key is missing required scopes.",
                    "missing_scopes": missing,
                }
            )

        return True

    @staticmethod
    def _resolve_scopes(declared, method: str) -> list[str] | None:
        if isinstance(declared, dict):
            return declared.get(method.upper())
        return declared
