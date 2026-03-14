from django.db import models
from utils.helpers import SoftDeletionModel


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

    class Meta:
        verbose_name = "Staff Member"
        verbose_name_plural = "Staff Members"

    def __str__(self):
        return self.user.email
