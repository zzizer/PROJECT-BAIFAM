import logging
import threading
import time

from .config import BUZZER_FREQUENCY_HZ, BUZZER_PIN


logger = logging.getLogger(__name__)

try:
    import RPi.GPIO as GPIO

    GPIO.setmode(GPIO.BCM)
    GPIO.setup(BUZZER_PIN, GPIO.OUT, initial=GPIO.LOW)
    HAS_GPIO = True
except (ImportError, RuntimeError) as exc:
    HAS_GPIO = False
    logger.warning("Buzzer GPIO unavailable: %s", exc)


_buzzer_lock = threading.Lock()


def _play(pattern: tuple[tuple[float, float], ...], volume: int) -> None:
    if not HAS_GPIO:
        return

    duty_cycle = max(0, min(int(volume), 100))

    if duty_cycle == 0:
        return

    def _worker() -> None:
        with _buzzer_lock:
            pwm = GPIO.PWM(BUZZER_PIN, BUZZER_FREQUENCY_HZ)

            try:
                pwm.start(0)

                for duration, pause in pattern:
                    pwm.ChangeDutyCycle(duty_cycle)
                    time.sleep(duration)
                    pwm.ChangeDutyCycle(0)

                    if pause:
                        time.sleep(pause)
            finally:
                pwm.stop()
                GPIO.output(BUZZER_PIN, GPIO.LOW)

    threading.Thread(target=_worker, daemon=True).start()


def beep_accepted(volume: int) -> None:
    _play(((0.15, 0.0),), volume)


def beep_rejected(volume: int) -> None:
    _play(
        (
            (0.12, 0.10),
            (0.12, 0.10),
            (0.12, 0.0),
        ),
        volume,
    )


def cleanup() -> None:
    if HAS_GPIO:
        GPIO.output(BUZZER_PIN, GPIO.LOW)
        GPIO.cleanup(BUZZER_PIN)
