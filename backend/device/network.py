import os
import re
import subprocess
import tempfile
from contextlib import contextmanager
from uuid import uuid4

from django.core.cache import cache
from rest_framework.exceptions import APIException, NotFound, ValidationError


class NetworkUnavailable(APIException):
    status_code = 503
    default_detail = "Wi-Fi management is unavailable on this device."


class NetworkBusy(APIException):
    status_code = 409
    default_detail = "Another network operation is running. Please try again."


def nmcli(*args, wait=10):
    try:
        result = subprocess.run(
            ["/usr/bin/nmcli", "--colors", "no", "--wait", str(wait), *args],
            capture_output=True,
            text=True,
            timeout=wait + 5,
            env={**os.environ, "LC_ALL": "C"},
        )
    except FileNotFoundError:
        raise NetworkUnavailable("NetworkManager is not installed.") from None
    except subprocess.TimeoutExpired:
        raise NetworkUnavailable(
            "The operation timed out. Refresh status to check the result."
        ) from None
    except OSError:
        raise NetworkUnavailable() from None
    if result.returncode:
        # Do not expose raw command output or credentials through API errors.
        raise NetworkUnavailable(
            "NetworkManager could not complete the operation. Check the "
            "network credentials, Wi-Fi availability, and service permissions."
        )
    return result.stdout.rstrip("\n")


def rows(output):
    result = []
    for line in output.splitlines():
        fields, value, escaped = [], "", False
        for char in line:
            if escaped:
                value += char
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == ":":
                fields.append(value)
                value = ""
            else:
                value += char
        fields.append(value + ("\\" if escaped else ""))
        result.append(fields)
    return result


def table(fields, *args):
    return rows(nmcli("--terse", "--escape", "yes", "--fields", fields, *args))


def interface():
    devices = table("DEVICE,TYPE,STATE", "device", "status")
    preferred = os.environ.get("ACCESSPI_WIFI_INTERFACE")
    devices = [
        row
        for row in devices
        if row[1] == "wifi" and (not preferred or row[0] == preferred)
    ]
    if not devices:
        raise NetworkUnavailable("No Wi-Fi adapter is available.")
    devices.sort(key=lambda row: row[2] != "connected")
    name, _, state = devices[0]
    if state == "unmanaged":
        raise NetworkUnavailable("The Wi-Fi adapter is not managed by NetworkManager.")
    return name, state


def profiles():
    return [
        {"uuid": uuid, "name": name, "active": device not in ("", "--")}
        for uuid, name, kind, device in table(
            "UUID,NAME,TYPE,DEVICE", "connection", "show"
        )
        if kind == "802-11-wireless"
    ]


def wifi_profile(uuid):
    profile = next((item for item in profiles() if item["uuid"] == uuid), None)
    if profile is None:
        raise NotFound("Saved Wi-Fi network not found.")
    return profile


def access_points(ifname):
    networks = {}
    for ssid, bssid, signal, security in table(
        "SSID,BSSID,SIGNAL,SECURITY",
        "device",
        "wifi",
        "list",
        "ifname",
        ifname,
        "--rescan",
        "no",
    ):
        if not ssid:
            continue
        supported = security in ("", "--") or (
            "WPA" in security and "802.1X" not in security
        )
        item = {
            "ssid": ssid,
            "bssid": bssid,
            "signal": int(signal),
            "security": security or "--",
            "supported": supported,
        }
        key = (ssid, security)
        if key not in networks or item["signal"] > networks[key]["signal"]:
            networks[key] = item
    return sorted(networks.values(), key=lambda item: -item["signal"])


def snapshot():
    ifname, state = interface()
    known = profiles()
    for item in known:
        item["ssid"] = nmcli(
            "--escape",
            "no",
            "--get-values",
            "802-11-wireless.ssid",
            "connection",
            "show",
            "uuid",
            item["uuid"],
        )
    current_uuid = nmcli("--get-values", "GENERAL.CON-UUID", "device", "show", ifname)
    return {
        "interface": ifname,
        "state": state,
        "current": next((item for item in known if item["uuid"] == current_uuid), None),
        "known": known,
        "available": access_points(ifname),
    }


@contextmanager
def network_operation():
    # Shared Redis cache serializes mutations across backend workers.
    key = "device:network-operation"
    if not cache.add(key, True, timeout=300):
        raise NetworkBusy()
    try:
        yield
    finally:
        cache.delete(key)


def connect(data):
    ifname, _ = interface()
    uuid = str(data["uuid"]) if data.get("uuid") else None
    password = data.get("password", "")
    if uuid:
        wifi_profile(uuid)
        nmcli("connection", "up", "uuid", uuid, "ifname", ifname, wait=45)
        return uuid

    available = access_points(ifname)
    target = next((item for item in available if item["bssid"] == data["bssid"]), None)
    if not target:
        raise ValidationError({"detail": "Network is no longer available. Wait for the next live update."})
    if not target["supported"]:
        raise ValidationError({"detail": "Join enterprise and WEP networks on the Pi."})
    secured = target["security"] not in ("", "--")
    sae = "WPA3" in target["security"] and "WPA2" not in target["security"]
    if secured:
        valid = (
            1 <= len(password) <= 63
            if sae
            else 8 <= len(password) <= 63
            or bool(re.fullmatch(r"[0-9a-fA-F]{64}", password))
        )
        if not valid:
            raise ValidationError({"detail": "Enter a valid Wi-Fi password."})
    elif password:
        raise ValidationError({"detail": "This network does not require a password."})

    uuid = str(uuid4())
    args = [
        "connection",
        "add",
        "type",
        "wifi",
        "ifname",
        ifname,
        "con-name",
        target["ssid"],
        "ssid",
        target["ssid"],
        "connection.uuid",
        uuid,
        "connection.autoconnect",
        "no",
    ]
    if secured:
        args += ["wifi-sec.key-mgmt", "sae" if sae else "wpa-psk"]
    nmcli(*args)
    try:
        # Mode 0600; the password never appears in command arguments.
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8") as secret:
            if secured:
                secret.write("802-11-wireless-security.psk:" + password + "\n")
                secret.flush()
            nmcli(
                "connection",
                "up",
                "uuid",
                uuid,
                "ifname",
                ifname,
                "ap",
                target["bssid"],
                "passwd-file",
                secret.name,
                wait=45,
            )
        nmcli("connection", "modify", "uuid", uuid, "connection.autoconnect", "yes")
    except NetworkUnavailable:
        # Preserve a profile if activation succeeded but its response was lost.
        try:
            if not wifi_profile(uuid)["active"]:
                nmcli("connection", "delete", "uuid", uuid)
        except (NetworkUnavailable, NotFound):
            pass
        raise
    return uuid


def forget(uuid, disconnect):
    profile = wifi_profile(uuid)
    if profile["active"] and not disconnect:
        raise ValidationError(
            {"detail": "Confirm disconnection before forgetting the active network."}
        )
    if profile["active"]:
        nmcli("connection", "down", "uuid", uuid)
    nmcli("connection", "delete", "uuid", uuid)
