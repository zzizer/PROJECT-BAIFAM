from django.contrib import admin
from django.utils.html import format_html
from django.contrib import messages
from .models import Scope, RecycleBin, RecycleBinItem


@admin.register(Scope)
class ScopeAdmin(admin.ModelAdmin):
    list_display = ["value", "label", "description", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["value", "label", "description"]
    readonly_fields = [
        "internal_base_uuid",
        "ref_code",
        "created_at",
        "updated_at",
        "deleted_at",
    ]
    ordering = ["value"]

    fieldsets = (
        (
            "Scope Identity",
            {
                "fields": ("value", "label", "description"),
            },
        ),
        (
            "Status",
            {
                "fields": ("is_active",),
            },
        ),
        (
            "Metadata",
            {
                "classes": ("collapse",),
                "fields": (
                    "internal_base_uuid",
                    "ref_code",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                ),
            },
        ),
    )


class RecycleBinItemInline(admin.TabularInline):
    model = RecycleBinItem
    extra = 0
    can_delete = False
    show_change_link = True

    readonly_fields = [
        "model_label",
        "object_repr",
        "object_uuid",
        "deleted_by",
        "deleted_at",
    ]
    fields = [
        "model_label",
        "object_repr",
        "object_uuid",
        "deleted_by",
        "deleted_at",
    ]

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(RecycleBin)
class RecycleBinAdmin(admin.ModelAdmin):
    list_display = ["__str__", "item_count", "created_at"]
    readonly_fields = ["created_at", "item_count"]
    inlines = [RecycleBinItemInline]
    actions = ["empty_bin"]

    def item_count(self, obj):
        return obj.items.count()

    item_count.short_description = "Items in Bin"

    @admin.action(description="🗑️ Empty entire recycle bin (hard-delete all items)")
    def empty_bin(self, request, queryset):
        total = 0
        for bin_obj in queryset:
            total += bin_obj.empty()
        self.message_user(
            request,
            f"Permanently destroyed {total} item(s).",
            level=messages.WARNING,
        )

    def has_add_permission(self, request):
        # Only one bin ever exists — block manual creation via admin.
        return not RecycleBin.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(RecycleBinItem)
class RecycleBinItemAdmin(admin.ModelAdmin):
    list_display = [
        "object_repr",
        "model_label",
        "deleted_by",
        "deleted_at",
        "restore_link",
        "hard_delete_link",
    ]
    list_filter = ["model_label", "deleted_at"]
    search_fields = ["object_repr", "model_label", "deleted_by__email"]
    readonly_fields = [
        "bin",
        "content_type",
        "object_uuid",
        "object_repr",
        "model_label",
        "deleted_by",
        "deleted_at",
    ]
    actions = ["restore_selected", "hard_delete_selected"]

    fieldsets = (
        (
            "Object",
            {
                "fields": ("model_label", "object_repr", "object_uuid", "content_type"),
            },
        ),
        (
            "Deletion Info",
            {
                "fields": ("bin", "deleted_by", "deleted_at"),
            },
        ),
    )

    def restore_link(self, obj):
        url = f"restore/{obj.pk}/"
        return format_html(
            '<a href="{}" style="color: green; font-weight: bold;">↩ Restore</a>', url
        )

    restore_link.short_description = "Restore"
    restore_link.allow_tags = True

    def hard_delete_link(self, obj):
        url = f"hard-delete/{obj.pk}/"
        return format_html(
            '<a href="{}" style="color: red; font-weight: bold;" '
            "onclick=\"return confirm('Permanently delete this item?')\">✕ Hard Delete</a>",
            url,
        )

    hard_delete_link.short_description = "Hard Delete"
    hard_delete_link.allow_tags = True

    @admin.action(description="↩ Restore selected items")
    def restore_selected(self, request, queryset):
        restored, failed = 0, 0
        for item in queryset:
            try:
                item.restore()
                restored += 1
            except ValueError:
                failed += 1

        if restored:
            self.message_user(request, f"Successfully restored {restored} item(s).")
        if failed:
            self.message_user(
                request,
                f"{failed} item(s) could not be restored — original objects no longer exist.",
                level=messages.ERROR,
            )

    @admin.action(description="✕ Hard-delete selected items (permanent)")
    def hard_delete_selected(self, request, queryset):
        count = queryset.count()
        for item in queryset:
            item.hard_delete()
        self.message_user(
            request,
            f"Permanently destroyed {count} item(s).",
            level=messages.WARNING,
        )

    def get_urls(self):
        from django.urls import path

        urls = super().get_urls()
        custom = [
            path(
                "restore/<int:pk>/",
                self.admin_site.admin_view(self.restore_view),
                name="recyclebinitem-restore",
            ),
            path(
                "hard-delete/<int:pk>/",
                self.admin_site.admin_view(self.hard_delete_view),
                name="recyclebinitem-hard-delete",
            ),
        ]
        # Custom URLs must come before the default ones.
        return custom + urls

    def restore_view(self, request, pk):
        from django.shortcuts import redirect

        item = RecycleBinItem.objects.filter(pk=pk).first()
        if item is None:
            self.message_user(request, "Item not found.", level=messages.ERROR)
        else:
            try:
                item.restore()
                self.message_user(
                    request, f'"{item.object_repr}" restored successfully.'
                )
            except ValueError as e:
                self.message_user(request, str(e), level=messages.ERROR)
        return redirect("..")

    def hard_delete_view(self, request, pk):
        from django.shortcuts import redirect

        item = RecycleBinItem.objects.filter(pk=pk).first()
        if item is None:
            self.message_user(request, "Item not found.", level=messages.ERROR)
        else:
            label = item.object_repr
            item.hard_delete()
            self.message_user(
                request,
                f'"{label}" permanently deleted.',
                level=messages.WARNING,
            )
        return redirect("..")

    def has_add_permission(self, request):
        return False
