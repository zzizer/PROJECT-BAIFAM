import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.conf import settings

from daemon.manager import fingerprint_manager
from daemon.scanner import ScannerError
from fingerprints.models import Fingerprint
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


def clean_orphaned_fingerprint_slots(dry_run=False):
    active_slots = set(
        Fingerprint.objects.filter(
            deleted_at__isnull=True,
        ).values_list("slot", flat=True)
    )

    orphaned_slots = fingerprint_manager.clean_orphaned_templates(
        active_slots=active_slots,
        dry_run=dry_run,
    )

    return {
        "slots": orphaned_slots,
        "deleted": 0 if dry_run else len(orphaned_slots),
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

        parser.add_argument(
            "--clean-orphaned-fingerprints",
            action="store_true",
            help=(
                "Delete scanner templates that have no active fingerprint "
                "database record"
            ),
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
        # Orphaned fingerprint scanner templates
        # ─────────────────────────────────────────────
        if options["clean_orphaned_fingerprints"]:
            action = "Checking" if dry_run else "Cleaning"
            self.stdout.write(
                f"{action} orphaned fingerprint scanner slots..."
            )

            try:
                fingerprint_result = clean_orphaned_fingerprint_slots(
                    dry_run=dry_run,
                )
            except ScannerError as exc:
                raise CommandError(str(exc)) from exc

            orphaned_slots = fingerprint_result["slots"]

            if orphaned_slots:
                self.stdout.write(
                    self.style.WARNING(
                        "Orphaned scanner slots: "
                        + ", ".join(str(slot) for slot in orphaned_slots)
                    )
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(
                        "No orphaned fingerprint scanner slots found."
                    )
                )

            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f"Dry run: {len(orphaned_slots)} slot(s) would be deleted."
                    )
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Deleted {fingerprint_result['deleted']} "
                        "orphaned scanner template(s)."
                    )
                )

            results["fingerprint_orphans"] = fingerprint_result

        # ─────────────────────────────────────────────
        # Output summary
        # ─────────────────────────────────────────────
        if not results and not dry_run:
            self.stdout.write(self.style.WARNING("No operations executed."))
            return

        self.stdout.write(self.style.SUCCESS("\nSync completed\n"))

        for key, res in results.items():
            if key == "fingerprint_orphans":
                continue

            self.stdout.write(
                f"{key.upper()} → "
                f"Created: {res['created']}, "
                f"Updated: {res['updated']}, "
                f"Deleted: {res['deleted']}"
            )
