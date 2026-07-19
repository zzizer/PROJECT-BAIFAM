import logging
import shutil
import threading
from pathlib import Path

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.core.cache import cache
from django.utils import timezone


logger = logging.getLogger(__name__)

DASHBOARD_GROUP = "dashboard"
DASHBOARD_CACHE_KEY = "dashboard:hardware"
DASHBOARD_CACHE_TIMEOUT = None

_cpu_lock = threading.Lock()
_previous_cpu_sample: tuple[int, int] | None = None


def _read_cpu_sample() -> tuple[int, int]:
    values = [
        int(value)
        for value in Path("/proc/stat").read_text().splitlines()[0].split()[1:]
    ]
    idle = values[3] + (values[4] if len(values) > 4 else 0)
    return idle, sum(values)


def _cpu_percent() -> int:
    global _previous_cpu_sample

    with _cpu_lock:
        current_idle, current_total = _read_cpu_sample()
        previous = _previous_cpu_sample
        _previous_cpu_sample = (current_idle, current_total)

    if previous is None:
        return 0

    idle_delta = current_idle - previous[0]
    total_delta = current_total - previous[1]

    if total_delta <= 0:
        return 0

    return round((1 - idle_delta / total_delta) * 100)


def _memory_percent() -> int:
    values = {}

    for line in Path("/proc/meminfo").read_text().splitlines():
        key, value = line.split(":", 1)
        values[key] = int(value.strip().split()[0])

    total = values.get("MemTotal", 0)
    available = values.get("MemAvailable", 0)
    return round(((total - available) / total) * 100) if total else 0


def _temperature() -> float | None:
    path = Path("/sys/class/thermal/thermal_zone0/temp")

    try:
        return round(int(path.read_text().strip()) / 1000, 1)
    except (OSError, ValueError):
        return None


def _uptime_seconds() -> int:
    return int(float(Path("/proc/uptime").read_text().split()[0]))


def collect_system_metrics() -> dict:
    disk = shutil.disk_usage("/")

    return {
        "cpu_percent": _cpu_percent(),
        "memory_percent": _memory_percent(),
        "disk_percent": round((disk.used / disk.total) * 100),
        "cpu_temperature": _temperature(),
        "uptime_seconds": _uptime_seconds(),
    }


def get_hardware_snapshot() -> dict:
    return cache.get(DASHBOARD_CACHE_KEY, {})


def update_hardware_snapshot(section: str, data: dict) -> dict:
    snapshot = get_hardware_snapshot()
    snapshot[section] = data
    snapshot["updated_at"] = timezone.now().isoformat()
    cache.set(
        DASHBOARD_CACHE_KEY,
        snapshot,
        timeout=DASHBOARD_CACHE_TIMEOUT,
    )
    return snapshot


def publish_dashboard_event(event_type: str, data: dict) -> None:
    channel_layer = get_channel_layer()

    if channel_layer is None:
        logger.warning("Dashboard event dropped: no channel layer configured")
        return

    try:
        async_to_sync(channel_layer.group_send)(
            DASHBOARD_GROUP,
            {
                "type": "dashboard.event",
                "event_type": event_type,
                "data": data,
                "timestamp": timezone.now().isoformat(),
            },
        )
    except Exception:
        logger.exception("Failed to publish dashboard event %s", event_type)


def update_and_publish(section: str, event_type: str, data: dict) -> None:
    update_hardware_snapshot(section, data)
    publish_dashboard_event(event_type, data)
