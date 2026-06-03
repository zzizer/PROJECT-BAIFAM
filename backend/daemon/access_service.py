from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from django.utils import timezone

from device.models import DeviceSettings
from fingerprints.models import AccessLog, Fingerprint
from staff.models import AccessPermission


@dataclass(slots=True)
class AccessDecision:
    granted: bool
    reason: str = ""
    fingerprint: Optional[Fingerprint] = None
    staff: object = None
    slot: Optional[int] = None
    confidence: int = 0


class AccessDecisionService:
    def evaluate(self, slot: Optional[int], confidence: int = 0) -> AccessDecision:
        now = timezone.localtime(timezone.now())

        if slot is None:
            return AccessDecision(
                granted=False,
                reason=AccessLog.DENY_NO_MATCH,
                slot=None,
                confidence=confidence,
            )

        fingerprint = (
            Fingerprint.objects.select_related("staff", "staff__role")
            .filter(slot=slot, deleted_at__isnull=True, is_active=True)
            .first()
        )

        if not fingerprint:
            return AccessDecision(
                granted=False,
                reason=AccessLog.DENY_NO_MATCH,
                slot=slot,
                confidence=confidence,
            )

        staff = fingerprint.staff

        if not staff or staff.deleted_at is not None or not staff.is_active:
            return AccessDecision(
                granted=False,
                reason=AccessLog.DENY_INACTIVE_STAFF,
                fingerprint=fingerprint,
                staff=staff,
                slot=slot,
                confidence=confidence,
            )

        permission = (
            AccessPermission.objects.filter(
                staff=staff,
                deleted_at__isnull=True,
            )
            .order_by("-created_at")
            .first()
        )

        if not permission:
            return AccessDecision(
                granted=False,
                reason=AccessLog.DENY_NO_PERMISSION,
                fingerprint=fingerprint,
                staff=staff,
                slot=slot,
                confidence=confidence,
            )

        if not permission.is_allowed or not permission.is_active:
            return AccessDecision(
                granted=False,
                reason=AccessLog.DENY_REVOKED,
                fingerprint=fingerprint,
                staff=staff,
                slot=slot,
                confidence=confidence,
            )

        today = now.date()

        if permission.valid_from and today < permission.valid_from:
            return AccessDecision(
                granted=False,
                reason=AccessLog.DENY_NOT_YET_VALID,
                fingerprint=fingerprint,
                staff=staff,
                slot=slot,
                confidence=confidence,
            )

        if permission.valid_until and today > permission.valid_until:
            return AccessDecision(
                granted=False,
                reason=AccessLog.DENY_EXPIRED,
                fingerprint=fingerprint,
                staff=staff,
                slot=slot,
                confidence=confidence,
            )

        if permission.allowed_days:
            allowed_days = {
                int(day.strip())
                for day in permission.allowed_days.split(",")
                if day.strip().isdigit()
            }

            if allowed_days and now.weekday() not in allowed_days:
                return AccessDecision(
                    granted=False,
                    reason=AccessLog.DENY_OUTSIDE_DAYS,
                    fingerprint=fingerprint,
                    staff=staff,
                    slot=slot,
                    confidence=confidence,
                )

        start_time = permission.access_start_time
        end_time = permission.access_end_time
        current_time = now.time()

        if start_time and end_time:
            if start_time <= end_time:
                in_window = start_time <= current_time <= end_time
            else:
                in_window = current_time >= start_time or current_time <= end_time

            if not in_window:
                return AccessDecision(
                    granted=False,
                    reason=AccessLog.DENY_OUTSIDE_HOURS,
                    fingerprint=fingerprint,
                    staff=staff,
                    slot=slot,
                    confidence=confidence,
                )

        return AccessDecision(
            granted=True,
            reason="",
            fingerprint=fingerprint,
            staff=staff,
            slot=slot,
            confidence=confidence,
        )

    def record_log(self, decision: AccessDecision) -> AccessLog:
        return AccessLog.objects.create(
            staff=decision.staff,
            fingerprint=decision.fingerprint,
            result=(
                AccessLog.RESULT_GRANTED
                if decision.granted
                else AccessLog.RESULT_DENIED
            ),
            deny_reason="" if decision.granted else decision.reason,
            confidence=decision.confidence or 0,
            scanner_slot=decision.slot,
            timestamp=timezone.now(),
        )

    def should_log_unknown_finger(self) -> bool:
        return DeviceSettings.get().allow_unknown_finger_log

    def unlock_duration_seconds(self) -> float:
        settings = DeviceSettings.get()
        return float(settings.unlock_duration_sec or 3)
