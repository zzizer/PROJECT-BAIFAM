from django.db import models
from utils.helpers import SoftDeletionModel


class Fingerprint(SoftDeletionModel):
    ref_prefix = "FPR"

    FINGER_CHOICES = [
        (0, "Right Thumb"),
        (1, "Right Index"),
        (2, "Right Middle"),
        (3, "Right Ring"),
        (4, "Right Little"),
        (5, "Left Thumb"),
        (6, "Left Index"),
        (7, "Left Middle"),
        (8, "Left Ring"),
        (9, "Left Little"),
    ]

    staff = models.ForeignKey(
        "staff.Staff",
        on_delete=models.CASCADE,
        related_name="fingerprint_entries",
    )

    slot = models.PositiveSmallIntegerField(
        help_text="Scanner hardware slot index (0-1000)."
    )
    finger_index = models.PositiveSmallIntegerField(
        choices=FINGER_CHOICES,
        help_text="Which finger (0 = right thumb … 9 = left little).",
    )

    label = models.CharField(
        max_length=100,
        blank=True,
        help_text="Optional label for this fingerprint (e.g. 'Work Scanner').",
    )
    enrolled_at = models.DateTimeField(null=True, blank=True)
    enrolled_by = models.ForeignKey(
        "users.CustomUser",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="enrollments_performed",
        help_text="Admin user who performed the enrollment.",
    )

    class Meta:
        verbose_name = "Fingerprint"
        verbose_name_plural = "Fingerprints"
        unique_together = [("slot",)]
        ordering = ["slot", "staff__full_name", "finger_index"]
        constraints = [
            models.UniqueConstraint(
                fields=["staff", "finger_index"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_active_finger_per_staff",
            )
        ]

    def __str__(self):
        finger_name = dict(self.FINGER_CHOICES).get(self.finger_index, "Unknown")
        return f"{self.staff} — {finger_name} (slot {self.slot})"

    @property
    def finger_display(self):
        return dict(self.FINGER_CHOICES).get(self.finger_index, "Unknown")


class AccessLog(SoftDeletionModel):
    ref_prefix = "LOG"

    RESULT_GRANTED = "granted"
    RESULT_DENIED = "denied"

    RESULT_CHOICES = [
        (RESULT_GRANTED, "Granted"),
        (RESULT_DENIED, "Denied"),
    ]

    DENY_NO_MATCH = "no_fingerprint_match"
    DENY_OUTSIDE_HOURS = "outside_allowed_hours"
    DENY_OUTSIDE_DAYS = "outside_allowed_days"
    DENY_REVOKED = "access_revoked"
    DENY_INACTIVE_STAFF = "inactive_staff"
    DENY_LOCKED_OUT = "locked_out"
    DENY_EXPIRED = "permission_expired"

    DENY_REASON_CHOICES = [
        (DENY_NO_MATCH, "No Fingerprint Match"),
        (DENY_OUTSIDE_HOURS, "Outside Allowed Hours"),
        (DENY_OUTSIDE_DAYS, "Outside Allowed Days"),
        (DENY_REVOKED, "Access Revoked"),
        (DENY_INACTIVE_STAFF, "Inactive Staff"),
        (DENY_LOCKED_OUT, "Locked Out"),
        (DENY_EXPIRED, "Permission Expired"),
    ]

    staff = models.ForeignKey(
        "staff.Staff",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="access_logs",
        help_text="Null when the fingerprint did not match anyone.",
    )

    fingerprint = models.ForeignKey(
        Fingerprint,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="access_logs",
        help_text="The specific fingerprint template that was matched.",
    )

    result = models.CharField(
        max_length=10,
        choices=RESULT_CHOICES,
        db_index=True,
    )

    deny_reason = models.CharField(
        max_length=30,
        choices=DENY_REASON_CHOICES,
        blank=True,
        default="",
        help_text="Populated only when result is denied.",
    )

    confidence = models.PositiveSmallIntegerField(
        default=0,
        help_text="Match confidence score from the scanner (0–100).",
    )

    scanner_slot = models.SmallIntegerField(
        null=True,
        blank=True,
        help_text="Hardware slot index that triggered this event.",
    )

    timestamp = models.DateTimeField(
        db_index=True,
        help_text="When the scan occurred (set by the daemon, not auto_now_add).",
    )

    class Meta:
        verbose_name = "Access Log"
        verbose_name_plural = "Access Logs"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["-timestamp"]),
            models.Index(fields=["staff", "-timestamp"]),
            models.Index(fields=["result", "-timestamp"]),
        ]

    def __str__(self):
        who = str(self.staff) if self.staff else "Unknown"
        return f"{self.result.upper()} — {who} at {self.timestamp:%Y-%m-%d %H:%M:%S}"

    @property
    def deny_reason_display_value(self):
        return dict(self.DENY_REASON_CHOICES).get(self.deny_reason, "")
