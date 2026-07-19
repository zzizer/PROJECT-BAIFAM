import time
import threading

from .config import RELAY_PIN, RELAY_ACTIVE_SEC

try:
    import RPi.GPIO as GPIO

    GPIO.setmode(GPIO.BCM)
    GPIO.setup(RELAY_PIN, GPIO.OUT, initial=GPIO.LOW)
    HAS_GPIO = True

except (ImportError, RuntimeError):
    HAS_GPIO = False


def unlock(duration: float = RELAY_ACTIVE_SEC) -> None:
    def _pulse():
        from system.dashboard import update_and_publish

        update_and_publish(
            "door",
            "door.status",
            {"locked": False, "relay_active": True},
        )

        if HAS_GPIO:
            GPIO.output(RELAY_PIN, GPIO.HIGH)
            time.sleep(duration)
            GPIO.output(RELAY_PIN, GPIO.LOW)
        else:
            time.sleep(duration)

        update_and_publish(
            "door",
            "door.status",
            {"locked": True, "relay_active": False},
        )

    threading.Thread(target=_pulse, daemon=True).start()


def cleanup() -> None:
    if HAS_GPIO:
        GPIO.cleanup()
