from utils.helpers import SoftDeletionModel
from django.db import models


class Scope(SoftDeletionModel):
    value = models.CharField(
        max_length=64,
        unique=True,
        help_text='Machine-readable scope, e.g. "read:logs"',
    )
    label = models.CharField(
        max_length=128,
        help_text='Human-readable label, e.g. "Read Logs"',
    )
    description = models.CharField(
        max_length=256,
        blank=True,
        help_text='Endpoint hint, e.g. "GET /api/logs/"',
    )

    class Meta:
        app_label = "system"
        ordering = ["value"]

    def __str__(self) -> str:
        return self.value
