from __future__ import annotations

import logging
import threading
from dataclasses import dataclass
from typing import Callable, Optional

from .lock import ScannerFileLock
from .scanner import FingerprintScanner, ScannerError

logger = logging.getLogger(__name__)

IDLE = "IDLE"
VERIFYING = "VERIFYING"
ENROLLING = "ENROLLING"
ERROR = "ERROR"


@dataclass(slots=True)
class VerifyResult:
    found: bool
    slot: Optional[int] = None
    confidence: int = 0
    error: Optional[str] = None


class FingerprintManager:
    def __init__(self):
        self.mode = IDLE
        self._scanner: Optional[FingerprintScanner] = None
        self._process_lock = threading.RLock()
        self._stop_event = threading.Event()

    def get_scanner(self) -> FingerprintScanner:
        if self._scanner is None or not self._scanner.connected:
            scanner = FingerprintScanner()
            scanner.connect()
            self._scanner = scanner
        return self._scanner

    def disconnect(self) -> None:
        with self._process_lock:
            if self._scanner:
                self._scanner.disconnect()
            self._scanner = None
            self.mode = IDLE

    def stop(self) -> None:
        self._stop_event.set()

    def should_stop(self) -> bool:
        return self._stop_event.is_set()

    def verify_once(self, wait_timeout: float = 0.8) -> VerifyResult:
        try:
            with ScannerFileLock(blocking=False):
                with self._process_lock:
                    self.mode = VERIFYING
                    scanner = self.get_scanner()

                    has_finger = scanner.wait_for_finger(timeout=wait_timeout)

                    if not has_finger:
                        return VerifyResult(found=False)

                    match = scanner.identify()
                    scanner.wait_for_lift(timeout=2)

                    if not match:
                        return VerifyResult(found=False)

                    slot, confidence = match
                    return VerifyResult(found=True, slot=slot, confidence=confidence)

        except BlockingIOError:
            return VerifyResult(found=False)

        except ScannerError as exc:
            self.mode = ERROR
            logger.exception("Fingerprint scanner error")
            return VerifyResult(found=False, error=str(exc))

        except Exception as exc:
            self.mode = ERROR
            logger.exception("Unexpected fingerprint scanner error")
            return VerifyResult(found=False, error=str(exc))

    def enroll(
        self,
        on_message: Optional[Callable[[str, str], None]] = None,
        first_timeout: float = 30,
        second_timeout: float = 30,
    ) -> int:
        def emit(kind: str, message: str) -> None:
            if on_message:
                on_message(kind, message)

        with ScannerFileLock(blocking=True):
            with self._process_lock:
                self.mode = ENROLLING
                scanner = self.get_scanner()

                emit("instruction", "Place your finger for first scan...")
                if not scanner.wait_for_finger(timeout=first_timeout):
                    raise ScannerError("No finger detected. Enrollment cancelled.")

                scanner.enroll()

                emit("instruction", "Lift your finger...")
                if not scanner.wait_for_lift(timeout=first_timeout):
                    raise ScannerError("Timeout waiting for lift.")

                emit("instruction", "Place the same finger again...")
                if not scanner.wait_for_finger(timeout=second_timeout):
                    raise ScannerError("No finger detected for second scan.")

                slot = scanner.capture_second_scan()
                scanner.wait_for_lift(timeout=2)

                self.mode = VERIFYING
                return slot


fingerprint_manager = FingerprintManager()
