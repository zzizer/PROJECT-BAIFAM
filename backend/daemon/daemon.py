from __future__ import annotations

import logging
import os
import signal
import sys
import time
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

import django

django.setup()

from daemon.access_service import AccessDecisionService
from daemon.manager import fingerprint_manager
from daemon.relay import cleanup as relay_cleanup
from daemon.relay import unlock
from system.dashboard import collect_system_metrics, update_and_publish

logging.basicConfig(
    level=os.environ.get("ACCESSPI_DAEMON_LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

logger = logging.getLogger("accesspi.daemon")


def _shutdown(signum, frame):
    logger.info("Shutdown Signal Received: %s", signum)
    fingerprint_manager.stop()


def run() -> None:
    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    access_service = AccessDecisionService()
    scanner_connected = None
    last_metrics_at = 0.0
    last_storage_at = 0.0

    update_and_publish(
        "door",
        "door.status",
        {"locked": True, "relay_active": False},
    )

    logger.info("Access Pi Verification Daemon Starting...")

    try:
        while not fingerprint_manager.should_stop():
            result = fingerprint_manager.verify_once(wait_timeout=0.8)
            now = time.monotonic()
            connected = result.error is None

            if connected != scanner_connected:
                scanner_connected = connected
                update_and_publish(
                    "scanner",
                    "scanner.status",
                    {
                        "connected": connected,
                        "message": (
                            "Scanner connected"
                            if connected
                            else "Scanner unavailable"
                        ),
                    },
                )

            if now - last_metrics_at >= 5:
                try:
                    metrics = collect_system_metrics()
                    update_and_publish(
                        "system",
                        "system.metrics",
                        metrics,
                    )
                except (OSError, ValueError):
                    logger.exception("Failed to collect system metrics")
                last_metrics_at = now

            if connected and now - last_storage_at >= 30:
                try:
                    used, capacity = fingerprint_manager.storage_info()
                    storage = {
                        "used": used,
                        "capacity": capacity,
                        "remaining": max(capacity - used, 0),
                        "percentage": (
                            round((used / capacity) * 100)
                            if capacity
                            else 0
                        ),
                    }
                    update_and_publish(
                        "scanner_storage",
                        "scanner.storage",
                        storage,
                    )
                except (BlockingIOError, OSError):
                    logger.debug("Scanner storage temporarily unavailable")
                last_storage_at = now

            if result.error:
                logger.warning("Scanner error: %s", result.error)
                time.sleep(2)
                continue

            if not result.found:
                time.sleep(0.1)
                continue

            decision = access_service.evaluate(result.slot, result.confidence)

            if (
                decision.fingerprint
                or decision.granted
                or access_service.should_log_unknown_finger()
            ):
                access_service.record_log(decision)

            if decision.granted:
                staff_name = getattr(decision.staff, "full_name", "Unknown")
                logger.info(
                    "Access granted: staff=%s slot=%s confidence=%s",
                    staff_name,
                    result.slot,
                    result.confidence,
                )

                unlock(duration=access_service.unlock_duration_seconds())

            else:
                logger.info(
                    "Access denied: reason=%s slot=%s confidence=%s",
                    decision.reason,
                    result.slot,
                    result.confidence,
                )

            time.sleep(0.2)
    finally:
        fingerprint_manager.disconnect()
        relay_cleanup()
        logger.info("Access Pi Verification Daemon Stopped.")


if __name__ == "__main__":
    run()
