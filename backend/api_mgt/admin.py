from django.contrib import admin
from .models import APIKey, APIKeyScope, APIKeyRequestLog


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = ("name", "key_digest", "is_active")
    search_fields = ("name",)


@admin.register(APIKeyScope)
class APIKeyScopeAdmin(admin.ModelAdmin):
    list_display = ("api_key", "scope", "is_active")
    search_fields = ("api_key__name",)


@admin.register(APIKeyRequestLog)
class APIKeyRequestLogAdmin(admin.ModelAdmin):
    list_display = ("api_key", "method", "path", "status_code")
    search_fields = ("api_key__name", "path")
