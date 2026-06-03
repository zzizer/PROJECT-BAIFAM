import fcntl
import os
from pathlib import Path

LOCK_FILE = Path(
    os.environ.get("SCANNER_LOCK_FILE", "/tmp/accesspi_fingerprint_scanner.lock")
)


class ScannerFileLock:

    def __init__(self, blocking: bool = True):
        self.blocking = blocking
        self._fh = None

    def __enter__(self):
        LOCK_FILE.parent.mkdir(parents=True, exist_ok=True)
        self._fh = open(LOCK_FILE, "w")

        flags = fcntl.LOCK_EX

        if not self.blocking:
            flags |= fcntl.LOCK_NB

        try:
            fcntl.flock(self._fh.fileno(), flags)
        except BlockingIOError:
            self._fh.close()
            self._fh = None
            raise

        self._fh.write(str(os.getpid()))
        self._fh.flush()
        return self

    def __exit__(self, exc_type, exc, tb):
        if self._fh:
            fcntl.flock(self._fh.fileno(), fcntl.LOCK_UN)
            self._fh.close()
            self._fh = None
