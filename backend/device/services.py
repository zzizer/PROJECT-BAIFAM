import subprocess


RESTART_COMMAND = [
    "/usr/bin/sudo",
    "/usr/bin/systemd-run",
    "--on-active=2s",
    "--unit=baifam-reboot",
    "/usr/bin/systemctl",
    "reboot",
]


def schedule_device_restart():
    subprocess.run(
        RESTART_COMMAND,
        check=True,
        capture_output=True,
        timeout=5,
    )
