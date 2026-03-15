from django.contrib import admin
from .models import Role, Department, Staff, StaffFingerprint


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ["ref_code", "name", "description"]
    search_fields = ["name"]


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ["ref_code", "name", "description"]
    search_fields = ["name"]


admin.site.register(StaffFingerprint)


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = [
        "ref_code",
        "full_name",
        "email",
        "role",
        "department",
        "is_active",
    ]
    list_filter = ["is_active", "role", "department"]
    search_fields = ["full_name", "email", "ref_code"]
    readonly_fields = ["ref_code"]
    raw_id_fields = ["user"]
