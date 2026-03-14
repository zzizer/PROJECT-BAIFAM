from django.contrib import admin
from .models import Scope


@admin.register(Scope)
class ScopeAdmin(admin.ModelAdmin):
    list_display = ("value", "label", "description")
    search_fields = ("value", "label")
    ordering = ("value",)
