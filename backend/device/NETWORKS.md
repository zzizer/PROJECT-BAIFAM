# Wi-Fi management

Wi-Fi management requires NetworkManager to manage the Pi's Wi-Fi adapter.
The backend calls /usr/bin/nmcli; it does not change Netplan renderers or install
system packages. Configure ACCESSPI_WIFI_INTERFACE in the backend environment
when a specific adapter must be used. Otherwise a connected Wi-Fi adapter is
preferred, followed by the first detected Wi-Fi adapter.

Install the backend requirements, including dbus-next, before restarting Daphne.
The service account must be able to subscribe to NetworkManager signals on the
system D-Bus and control and modify/delete NetworkManager connection profiles. Configure
these permissions on the Pi through Polkit; do not run Django as root.
Relevant actions are org.freedesktop.NetworkManager.network-control and
org.freedesktop.NetworkManager.settings.modify.system.

The authenticated /ws/networks/ WebSocket sends an initial networks.snapshot
and subsequent snapshots when NetworkManager emits D-Bus change signals.
Signal bursts are coalesced and identical snapshots are suppressed. There is
no timed snapshot polling, scan endpoint, or forced Wi-Fi scan. Available
networks reflect the access points discovered by NetworkManager itself.
A networks.error event marks previous data as stale. Reconnecting establishes
a new subscription and sends a fresh initial snapshot.

POST /api/device/networks/connect/ accepts a saved profile uuid or a bssid and
optional password. DELETE /api/device/networks/{uuid}/ forgets a Wi-Fi profile;
disconnect=true is required when active. API keys need read:settings for the
socket and write:settings for mutations. Existing session authentication and
WebSocket origin validation apply. Socket resources are released on disconnect.
The frontend only retries the socket; it does not poll HTTP network endpoints.

Joining new networks supports open and WPA personal networks. Enterprise and
WEP networks must first be configured on the Pi. New profiles use DHCP.
Passwords are supplied through a temporary mode-0600 file, removed after
activation, and managed by NetworkManager rather than Django models.
No migrations are required.

Connection operations can outlast an HTTP connection. The frontend must not
treat a lost response as proof of failure or automatically repeat a mutation.
Use the Pi's reachable address to refresh status after switching networks.
If its IP changes, reopen the application using the new address or its local
hostname. Forgetting an active network can also interrupt the browser.

Before deployment, verify real scans, saved-password reuse after a reboot,
incorrect-password handling, switching between two networks, and forgetting
both inactive and active profiles on the Pi. Also verify the backend service
account's permissions. Host-only tests do not validate the Wi-Fi hardware.
