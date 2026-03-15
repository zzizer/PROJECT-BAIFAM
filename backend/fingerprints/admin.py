from django.contrib import admin
from .models import Fingerprint, AccessLog


@admin.register(Fingerprint)
class FingerprintAdmin(admin.ModelAdmin):
    list_display = [
        "ref_code",
        "staff",
        "finger_display",
        "slot",
        "enrolled_at",
    ]
    list_filter = ["finger_index"]
    search_fields = ["staff__fullname", "staff__ref_code", "ref_code"]
    readonly_fields = ["ref_code", "enrolled_at", "enrolled_by"]
    raw_id_fields = ["staff"]


@admin.register(AccessLog)
class AccessLogAdmin(admin.ModelAdmin):
    list_display = [
        "ref_code",
        "staff",
        "result",
        "deny_reason",
        "confidence",
        "scanner_slot",
        "timestamp",
    ]
    list_filter = ["result", "deny_reason"]
    search_fields = ["staff__fullname", "ref_code"]
    readonly_fields = [
        "ref_code",
        "staff",
        "fingerprint",
        "result",
        "deny_reason",
        "confidence",
        "scanner_slot",
        "timestamp",
    ]
    date_hierarchy = "timestamp"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
