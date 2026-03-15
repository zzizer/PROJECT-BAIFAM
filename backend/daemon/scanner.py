import time
from pyfingerprint.pyfingerprint import (
    PyFingerprint,
    FINGERPRINT_CHARBUFFER1,
    FINGERPRINT_CHARBUFFER2,
)
from .config import (
    SCANNER_PORT,
    SCANNER_BAUD,
    SCANNER_ADDRESS,
    SCANNER_PASSWORD,
    LIFT_WAIT_SEC,
    FINGER_WAIT_TIMEOUT_SEC,
)


class ScannerError(Exception):
    """Raised when the hardware does something unexpected."""


class FingerprintScanner:
    def __init__(self):
        self._f: PyFingerprint | None = None

    def connect(self):
        try:
            self._f = PyFingerprint(
                SCANNER_PORT, SCANNER_BAUD, SCANNER_ADDRESS, SCANNER_PASSWORD
            )

            if not self._f.verifyPassword():
                raise ScannerError("Wrong fingerprint sensor password.")

        except Exception as e:
            self._f = None
            raise ScannerError(f"Failed to connect to fingerprint sensor: {e}")

    def disconnect(self):
        self._f = None

    @property
    def connected(self) -> bool:
        return self._f is not None

    def _require_connection(self):
        if not self._f:
            raise ScannerError("Scanner not connected.")

    def wait_for_finger(self, timeout: float = FINGER_WAIT_TIMEOUT_SEC) -> bool:
        self._require_connection()
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if self._f.readImage():
                return True
            time.sleep(0.1)
        return False

    def wait_for_lift(self, timeout: float = FINGER_WAIT_TIMEOUT_SEC) -> None:
        self._require_connection()
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if not self._f.readImage():
                time.sleep(LIFT_WAIT_SEC)
                return
            time.sleep(0.1)

    def enroll(self) -> int:
        self._require_connection()

        self._f.convertImage(FINGERPRINT_CHARBUFFER1)

        result = self._f.searchTemplate()
        existing_slot = result[0]

        if existing_slot >= 0:
            raise ScannerError(
                f"This finger is already enrolled at slot {existing_slot}. "
                "Delete it first."
            )

        return None

    def capture_second_scan(self) -> int:
        self._require_connection()

        self._f.convertImage(FINGERPRINT_CHARBUFFER2)

        if self._f.compareCharacteristics() == 0:
            raise ScannerError("Fingers do not match. Please try again.")

        self._f.createTemplate()
        slot = self._f.storeTemplate()

        return slot

    def identify(self) -> tuple[int, int] | None:
        self._require_connection()

        self._f.convertImage(FINGERPRINT_CHARBUFFER1)

        result = self._f.searchTemplate()

        slot, confidence = result[0], result[1]

        if slot == -1:
            return None

        return slot, confidence

    def delete_template(self, slot: int) -> None:
        self._require_connection()

        if not self._f.deleteTemplate(slot):
            raise ScannerError(f"Failed to delete template at slot {slot}.")

    def template_count(self) -> int:
        self._require_connection()
        return self._f.getTemplateCount()

    def template_capacity(self) -> int:
        self._require_connection()
        return self._f.getStorageCapacity()
