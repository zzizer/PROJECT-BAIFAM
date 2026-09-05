"use client";

import { useState } from "react";
import { useNetworksLive } from "@/hooks/use-networks-live";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NETWORKS_API,
  type AvailableNetwork,
  type ConnectPayload,
  type KnownNetwork,
} from "@/lib/networks-api";

function errorMessage(error: unknown) {
  if (isAxiosError<{ detail?: unknown }>(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (!error.response) {
      return "The Pi could not be reached. The result is unconfirmed. "
        + "Reconnect to the Pi to receive its latest status.";
    }
  }
  return "The operation failed. Check the live status and try again.";
}

export default function NetworksPage() {
  const networks = useNetworksLive();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<AvailableNetwork | null>(null);
  const [password, setPassword] = useState("");
  const [targetUuid, setTargetUuid] = useState<string | null>(null);
  const data = networks.data;
  const confirmed = networks.status === "live" && targetUuid
    && data?.current?.uuid === targetUuid;
  const disabled = busy || networks.status !== "live" || !data;

  async function connect(payload: ConnectPayload, name: string) {
    setBusy(true);
    setTargetUuid(null);
    setMessage("Connecting to " + name + "…");
    setPassword("");
    setSelected(null);
    try {
      const result = await NETWORKS_API.connect(payload);
      setTargetUuid(result.uuid);
      setMessage("Connection request completed. Checking the current connection…");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function forget(item: KnownNetwork) {
    if (!window.confirm(
      'Forget "' + item.name + '" and remove its saved credentials? '
      + "If this network is connected, the Pi will disconnect and this page may lose access.",
    )) return;
    setBusy(true);
    setTargetUuid(null);
    setMessage("Forgetting " + item.name + "…");
    try {
      await NETWORKS_API.forget(item.uuid);
      setMessage("Saved network forgotten.");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Networks</h1>
          <p className="text-sm text-muted-foreground">Manage the Raspberry Pi’s Wi-Fi.</p>
        </div>
        <span className="text-sm text-muted-foreground" role="status">
          {networks.status === "live" ? "Live updates" : networks.status}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        Switching or forgetting the connected network may interrupt access to the Pi.
        You may need to join its new network and reopen the Pi’s address.
      </p>
      <div role="status" aria-live="polite" className="text-sm">
        {confirmed ? "Connected to " + data?.current?.name + "." : message}
      </div>
      {!data && networks.status === "connecting" && <p>Loading networks…</p>}
      {networks.error && (
        <p role="alert" className="text-sm text-destructive">
          {networks.error} {data && "The displayed information is last known status."}
        </p>
      )}

      {data && (
        <>
          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-2 font-semibold">Current connection</h2>
            <p>{data.current?.name ?? "No active Wi-Fi connection"}</p>
            <p className="text-sm text-muted-foreground">{data.interface} · {data.state}</p>
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-3 font-semibold">Available networks</h2>
            {!data.available.length
              && <p className="text-sm">No nearby networks currently reported by the device.</p>}
            <ul className="max-h-[min(24rem,50vh)] overflow-y-auto overscroll-contain divide-y pr-2"
              tabIndex={0} aria-label="Available networks">
              {data.available.map((item) => {
                const saved = data.known.find(
                  (known) => known.ssid === item.ssid && known.active,
                ) ?? data.known.find((known) => known.ssid === item.ssid);
                return (
                <li key={item.bssid} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="break-all">{item.ssid}</p>
                    <p className="text-sm text-muted-foreground">
                      Signal {item.signal}% · {item.security === "--" ? "Open" : item.security}
                      {saved && " · Saved"}
                      {!saved && !item.supported && " · Configure this network on the Pi"}
                    </p>
                  </div>
                  <Button variant="outline"
                    disabled={disabled || Boolean(saved?.active) || (!saved && !item.supported)}
                    onClick={() => {
                      if (saved) {
                        void connect({ uuid: saved.uuid }, saved.name);
                      } else {
                        setPassword("");
                        setSelected(item);
                      }
                    }}>
                    {saved?.active ? "Connected" : saved ? "Connect" : "Join"}
                  </Button>
                </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-3 font-semibold">Known networks</h2>
            {!data.known.length && <p className="text-sm">No saved Wi-Fi networks.</p>}
            <ul className="max-h-[min(24rem,50vh)] overflow-y-auto overscroll-contain divide-y pr-2"
              tabIndex={0} aria-label="Known networks">
              {data.known.map((item) => (
                <li key={item.uuid} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="break-all">{item.name}{item.active ? " · Connected" : ""}</span>
                  <div className="flex gap-2">
                    {!item.active && data.available.some(
                      (available) => available.ssid === item.ssid,
                    ) && (
                      <Button variant="outline" disabled={disabled}
                        onClick={() => void connect({ uuid: item.uuid }, item.name)}>
                        Connect
                      </Button>
                    )}
                    <Button variant="destructive" disabled={disabled}
                      onClick={() => void forget(item)}>Forget</Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {selected && (
        <form className="space-y-3 rounded-xl border bg-card p-5"
          onSubmit={(event) => {
            event.preventDefault();
            void connect({ bssid: selected.bssid, password }, selected.ssid);
          }}>
          <h2 className="font-semibold">Join {selected.ssid}</h2>
          {selected.security !== "--" && (
            <div className="space-y-2">
              <label htmlFor="wifi-password">Wi-Fi password</label>
              <Input id="wifi-password" type="password" autoComplete="new-password"
                autoFocus required maxLength={64} value={password}
                onChange={(event) => setPassword(event.target.value)} />
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={disabled}>Connect</Button>
            <Button type="button" variant="outline" disabled={busy}
              onClick={() => { setSelected(null); setPassword(""); }}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}
