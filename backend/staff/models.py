from django.db import models
from utils.helpers import SoftDeletionModel
from fingerprints.models import Fingerprint


class Role(SoftDeletionModel):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Role"
        verbose_name_plural = "Roles"

    def __str__(self):
        return self.name


class Department(SoftDeletionModel):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Department"
        verbose_name_plural = "Departments"

    def __str__(self):
        return self.name


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
