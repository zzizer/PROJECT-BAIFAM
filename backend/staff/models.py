from django.db import models
from utils.helpers import SoftDeletionModel
from fingerprints.models import Fingerprint


class Role(SoftDeletionModel):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Role"
        verbose_name_plural = "Roles"

        constraints = [
            models.UniqueConstraint(
                fields=["name"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_active_role_name",
            )
        ]

    def __str__(self):
        return self.name


class Department(SoftDeletionModel):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Department"
        verbose_name_plural = "Departments"

    def __str__(self):
        return self.name

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["name"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_active_department_name",
            )
        ]


class Staff(SoftDeletionModel):

    ref_prefix = "STF"

    user = models.OneToOneField(
        "users.CustomUser",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="staff_profile",
        help_text="System login account for this person. May be null.",
    )

    full_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)

    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        related_name="staff_members",
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        related_name="staff_members",
    )

    fingerprints = models.ManyToManyField(
        Fingerprint,
        through="StaffFingerprint",
        related_name="assigned_staff",
        blank=True,
    )

    class Meta:
        verbose_name = "Staff Member"
        verbose_name_plural = "Staff Members"
        ordering = ["full_name"]

    def __str__(self):
        return self.user.email


class StaffFingerprint(SoftDeletionModel):
    ref_prefix = "SFP"

    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name="staff_fingerprints",
    )

    fingerprint = models.ForeignKey(
        Fingerprint,
        on_delete=models.CASCADE,
        related_name="staff_fingerprints",
    )

    class Meta:
        verbose_name = "Staff Fingerprint"
        verbose_name_plural = "Staff Fingerprints"
        unique_together = [("fingerprint",)]
        constraints = [
            models.UniqueConstraint(
                fields=["staff", "fingerprint"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_active_staff_fingerprint",
            )
        ]

    def __str__(self):
        return f"{self.staff} → {self.fingerprint}"


DAYS_OF_WEEK = [
    (0, "Monday"),
    (1, "Tuesday"),
    (2, "Wednesday"),
    (3, "Thursday"),
    (4, "Friday"),
    (5, "Saturday"),
    (6, "Sunday"),
]


class AccessPermission(SoftDeletionModel):
    ref_prefix = "PRM"

    staff = models.OneToOneField(
        Staff,
        on_delete=models.CASCADE,
        related_name="access_permission",
    )

    is_allowed = models.BooleanField(
        default=True,
        help_text="Master on/off switch. False = always denied regardless of schedule.",
    )

    access_start_time = models.TimeField(
        null=True,
        blank=True,
        help_text="Earliest time of day entry is allowed (e.g. 08:00).",
    )
    access_end_time = models.TimeField(
        null=True,
        blank=True,
        help_text="Latest time of day entry is allowed (e.g. 18:00).",
    )

    allowed_days = models.CharField(
        max_length=20,
        default="0,1,2,3,4",
        blank=True,
        help_text="Comma-separated day indices (0=Mon … 6=Sun). Empty = all days.",
    )

    valid_from = models.DateField(
        null=True,
        blank=True,
        help_text="Permission becomes active on this date.",
    )
    valid_until = models.DateField(
        null=True,
        blank=True,
        help_text="Permission expires after this date.",
    )

    class Meta:
        verbose_name = "Access Permission"
        verbose_name_plural = "Access Permissions"

    def __str__(self):
        status = "allowed" if self.is_allowed else "denied"
        return f"{self.staff} — {status}"
