import os

SCANNER_PORT = os.environ.get("SCANNER_PORT", "/dev/ttyS0")
SCANNER_BAUD = int(os.environ.get("SCANNER_BAUD", "57600"))
SCANNER_ADDRESS = int(os.environ.get("SCANNER_ADDRESS", str(0xFFFFFFFF)), 16)
SCANNER_PASSWORD = int(os.environ.get("SCANNER_PASSWORD", str(0x00000000)), 16)


FINGER_WAIT_TIMEOUT_SEC = float(os.environ.get("FINGER_WAIT_TIMEOUT_SEC", "30.0"))
LIFT_WAIT_SEC = float(os.environ.get("LIFT_WAIT_SEC", "1.5"))

RELAY_PIN = int(os.environ.get("RELAY_PIN", "17"))
RELAY_ACTIVE_SEC = float(os.environ.get("RELAY_ACTIVE_SEC", "3.0"))
