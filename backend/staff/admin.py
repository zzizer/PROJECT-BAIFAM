from django.contrib import admin
from .models import Role, Department, Staff


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "description")
    search_fields = ("name",)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "description")
    search_fields = ("name",)


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ("full_name", "role", "department")
    search_fields = ("full_name",)
    list_filter = ("role", "department")
