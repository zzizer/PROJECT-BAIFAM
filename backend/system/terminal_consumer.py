import asyncio
import fcntl
import json
import logging
import os
import pty
import pwd
import signal
import struct
import subprocess
import termios
import threading
import time

from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings


logger = logging.getLogger(__name__)

MAX_INPUT_BYTES = 4096
MIN_COLS = 20
MAX_COLS = 300
MIN_ROWS = 5
MAX_ROWS = 120


class TerminalConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]

        if not settings.ENABLE_WEB_TERMINAL:
            await self.close(code=4403)
            return

        if not user.is_authenticated or not user.is_staff:
            await self.close(code=4403)
            return

        self.master_fd = None
        self.process = None
        self.reader_thread = None
        self.idle_task = None
        self.last_activity = time.monotonic()
        self.loop = asyncio.get_running_loop()

        try:
            self._start_shell()
        except OSError:
            logger.exception(
                "Unable to start terminal session for user=%s",
                user.pk,
            )
            await self.close(code=4500)
            return

        await self.accept()
        self.idle_task = asyncio.create_task(self._watch_idle_timeout())

        logger.warning(
            "Web terminal session started user=%s email=%s channel=%s",
            user.pk,
            user.email,
            self.channel_name,
        )

    def _start_shell(self):
        master_fd, slave_fd = pty.openpty()
        account = pwd.getpwuid(os.getuid())
        shell = account.pw_shell or "/bin/bash"

        environment = {
            "HOME": account.pw_dir,
            "LOGNAME": account.pw_name,
            "USER": account.pw_name,
            "SHELL": shell,
            "TERM": "xterm-256color",
            "PATH": "/usr/local/bin:/usr/bin:/bin",
            "LANG": os.environ.get("LANG", "C.UTF-8"),
        }

        try:
            process = subprocess.Popen(
                [shell, "-l"],
                stdin=slave_fd,
                stdout=slave_fd,
                stderr=slave_fd,
                cwd=account.pw_dir,
                env=environment,
                close_fds=True,
                preexec_fn=os.setsid,
            )
        finally:
            os.close(slave_fd)

        self.master_fd = master_fd
        self.process = process
        self.reader_thread = threading.Thread(
            target=self._read_output,
            daemon=True,
        )
        self.reader_thread.start()

    def _read_output(self):
        while self.master_fd is not None:
            try:
                output = os.read(self.master_fd, 8192)
            except OSError:
                break

            if not output:
                break

            asyncio.run_coroutine_threadsafe(
                self.send(bytes_data=output),
                self.loop,
            )

        asyncio.run_coroutine_threadsafe(
            self.close(code=1000),
            self.loop,
        )

    async def receive(self, text_data=None, bytes_data=None):
        self.last_activity = time.monotonic()

        if bytes_data is not None:
            if len(bytes_data) > MAX_INPUT_BYTES:
                await self.close(code=4409)
                return

            if self.master_fd is not None:
                try:
                    os.write(self.master_fd, bytes_data)
                except OSError:
                    await self.close(code=1011)
            return

        if text_data is None:
            return

        try:
            message = json.loads(text_data)
        except json.JSONDecodeError:
            await self.close(code=4400)
            return

        if message.get("type") != "resize":
            await self.close(code=4400)
            return

        cols = max(
            MIN_COLS,
            min(int(message.get("cols", 80)), MAX_COLS),
        )
        rows = max(
            MIN_ROWS,
            min(int(message.get("rows", 24)), MAX_ROWS),
        )
        self._resize(cols, rows)

    def _resize(self, cols: int, rows: int):
        if self.master_fd is None:
            return

        size = struct.pack("HHHH", rows, cols, 0, 0)
        fcntl.ioctl(self.master_fd, termios.TIOCSWINSZ, size)

    async def _watch_idle_timeout(self):
        timeout = settings.WEB_TERMINAL_IDLE_TIMEOUT

        while True:
            await asyncio.sleep(15)

            if time.monotonic() - self.last_activity >= timeout:
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "session.expired",
                            "message": "Terminal closed due to inactivity.",
                        }
                    )
                )
                await self.close(code=4408)
                return

    async def disconnect(self, close_code):
        if self.idle_task:
            self.idle_task.cancel()

        process = self.process
        master_fd = self.master_fd
        self.process = None
        self.master_fd = None

        if master_fd is not None:
            try:
                os.close(master_fd)
            except OSError:
                pass

        if process and process.poll() is None:
            try:
                os.killpg(process.pid, signal.SIGTERM)
            except ProcessLookupError:
                pass

        user = self.scope.get("user")
        logger.warning(
            "Web terminal session ended user=%s channel=%s code=%s",
            getattr(user, "pk", None),
            self.channel_name,
            close_code,
        )
