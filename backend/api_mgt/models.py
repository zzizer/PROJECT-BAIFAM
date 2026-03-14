from django.db import models
from utils.helpers import SoftDeletionModel
from django.utils import timezone
import secrets
import hashlib


class APIKey(SoftDeletionModel):
    name = models.CharField(
        max_length=128,
        help_text='Human label, e.g. "HR System Integration"',
    )

    prefix = models.CharField(max_length=10, editable=False)
    key_digest = models.CharField(max_length=64, unique=True, editable=False)
    created_by = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        related_name="api_keys",
    )
    scopes = models.ManyToManyField(
        "system.Scope",
        blank=True,
        related_name="api_keys",
        help_text="Permissions granted to this key",
        through="APIKeyScope",
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Leave blank for a non-expiring key",
    )
    last_used_at = models.DateTimeField(null=True, blank=True, editable=False)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "API Key"
        verbose_name_plural = "API Keys"

    @property
    def is_expired(self) -> bool:
        if self.expires_at is None:
            return False
        return timezone.now() >= self.expires_at

    @property
    def is_valid(self) -> bool:
        return self.is_active and not self.is_expired

    def has_scope(self, scope_value: str) -> bool:
        return self.api_key_scopes.filter(
            scope__value=scope_value, is_active=True
        ).exists()

    @classmethod
    def generate(cls) -> tuple["APIKey", str]:
        raw = secrets.token_urlsafe(30)
        plaintext = f"ak_{raw}"
        digest = hashlib.sha256(plaintext.encode()).hexdigest()
        prefix = plaintext[:10]
        instance = cls(prefix=prefix, key_digest=digest)
        return instance, plaintext

    @staticmethod
    def hash(plaintext: str) -> str:
        return hashlib.sha256(plaintext.encode()).hexdigest()

    def touch(self) -> None:
        APIKey.objects.filter(pk=self.pk).update(last_used_at=timezone.now())

    def __str__(self) -> str:
        return f"{self.name} ({self.prefix}…)"


class APIKeyScope(models.Model):
    api_key = models.ForeignKey(
        APIKey,
        on_delete=models.CASCADE,
        related_name="api_key_scopes",
    )
    scope = models.ForeignKey(
        "system.Scope",
        on_delete=models.CASCADE,
        related_name="api_key_scopes",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("api_key", "scope")
        verbose_name = "API Key Scope"
        verbose_name_plural = "API Key Scopes"


class APIKeyRequestLog(models.Model):
    api_key = models.ForeignKey(
        APIKey,
        on_delete=models.CASCADE,
        related_name="request_logs",
    )
    method = models.CharField(max_length=10)
    path = models.CharField(max_length=512)
    status_code = models.PositiveSmallIntegerField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    requested_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-requested_at"]
        verbose_name = "API Key Request Log"
        verbose_name_plural = "API Key Request Logs"

    def __str__(self) -> str:
        return f"{self.api_key.prefix}… {self.method} {self.path} → {self.status_code}"
