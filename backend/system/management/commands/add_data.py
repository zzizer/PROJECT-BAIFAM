import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings

from system.models import Scope


# ─────────────────────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────────────────────

SCOPES_FILE = Path(settings.BASE_DIR) / "system" / "fixtures" / "scopes.json"


# ─────────────────────────────────────────────────────────────
# Sync Logic
# ─────────────────────────────────────────────────────────────


def sync_scopes():
    """
    Sync scopes from JSON fixture.

    Behavior:
    - Create missing scopes
    - Update changed scopes
    - Hard delete scopes removed from JSON
    """

    if not SCOPES_FILE.exists():
        raise FileNotFoundError(f"Scopes file not found: {SCOPES_FILE}")

    with open(SCOPES_FILE, "r") as f:
        scopes_data = json.load(f)

    incoming_map = {s["value"]: s for s in scopes_data}
    incoming_values = set(incoming_map.keys())

    db_qs = Scope.objects.all()
    db_values = set(db_qs.values_list("value", flat=True))

    created_count = 0
    updated_count = 0
    deleted_count = 0

    # ─────────────────────────────────────────────
    # UPSERT (create + update diff)
    # ─────────────────────────────────────────────
    for value, payload in incoming_map.items():
        obj, created = Scope.objects.get_or_create(
            value=value,
            defaults={
                "label": payload["label"],
                "description": payload.get("description", ""),
            },
        )

        if created:
            created_count += 1
            continue

        # ── Detect changes ────────────────────────
        changes = {}

        if obj.label != payload["label"]:
            changes["label"] = payload["label"]

        if obj.description != payload.get("description", ""):
            changes["description"] = payload.get("description", "")

        # ── Apply only if changed ──────────────────
        if changes:
            for k, v in changes.items():
                setattr(obj, k, v)

            obj.save(update_fields=list(changes.keys()))
            updated_count += 1

    # ─────────────────────────────────────────────
    # HARD DELETE (removed from JSON)
    # ─────────────────────────────────────────────
    to_delete = db_values - incoming_values

    if to_delete:
        qs = Scope.objects.filter(value__in=to_delete)

        # IMPORTANT: bypass soft delete if supported
        for obj in qs:
            if hasattr(obj, "delete"):
                obj.delete()  # or obj.delete(hard=True) if supported

        deleted_count = qs.count()

    return {
        "created": created_count,
        "updated": updated_count,
        "deleted": deleted_count,
    }


# ─────────────────────────────────────────────────────────────
# Management Command
# ─────────────────────────────────────────────────────────────


class Command(BaseCommand):
    help = "Centralized data command for system fixtures (scopes, etc.)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--scopes",
            action="store_true",
            help="Sync scopes from JSON fixture",
        )

        parser.add_argument(
            "--all",
            action="store_true",
            help="Run all data sync tasks",
        )

        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simulate changes without writing to DB",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        results = {}

        dry_run = options["dry_run"]

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN MODE ENABLED"))

        # ─────────────────────────────────────────────
        # Scopes
        # ─────────────────────────────────────────────
        if options["scopes"] or options["all"]:
            self.stdout.write("Syncing scopes...")

            if dry_run:
                self.stdout.write("Skipping DB writes (dry run)")
            else:
                results["scopes"] = sync_scopes()

        # ─────────────────────────────────────────────
        # Output summary
        # ─────────────────────────────────────────────
        if not results and not dry_run:
            self.stdout.write(self.style.WARNING("No operations executed."))
            return

        self.stdout.write(self.style.SUCCESS("\nSync completed\n"))

        for key, res in results.items():
            self.stdout.write(
                f"{key.upper()} → "
                f"Created: {res['created']}, "
                f"Updated: {res['updated']}, "
                f"Deleted: {res['deleted']}"
            )
