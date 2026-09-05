"use client";

import { useEffect, useState } from "react";
import { AUTH_API } from "@/lib/api";
import type { NetworkSnapshot } from "@/lib/networks-api";

type LiveState = {
  data: NetworkSnapshot | null;
  status: "connecting" | "live" | "reconnecting" | "offline";
  error: string;
};

export function useNetworksLive(): LiveState {
  const [state, setState] = useState<LiveState>({
    data: null,
    status: "connecting",
    error: "",
  });

  useEffect(() => {
    let stopped = false;
    let socket: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const api = new URL(
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
      window.location.origin,
    );
    api.protocol = api.protocol === "https:" ? "wss:" : "ws:";
    api.pathname = "/ws/networks/";
    api.search = "";
    api.hash = "";

    function connect() {
      if (stopped) return;
      socket = new WebSocket(api);
      socket.onmessage = (message) => {
        if (stopped) return;
        try {
          const event = JSON.parse(message.data);
          if (event.type === "networks.snapshot") {
            attempts = 0;
            setState({ data: event.data, status: "live", error: "" });
          } else if (event.type === "networks.error") {
            setState((previous) => ({
              ...previous, status: "offline", error: event.detail,
            }));
          }
        } catch {
          // Ignore malformed messages; a valid snapshot establishes live status.
        }
      };
      socket.onerror = () => socket?.close();
      socket.onclose = async (event) => {
        if (stopped) return;
        setState((previous) => ({
          ...previous,
          status: "reconnecting",
          error: "Live updates interrupted. Reconnecting to the Pi…",
        }));
        if (event.code === 4403) {
          setState((previous) => ({
            ...previous, status: "offline", error: "Network access is not permitted.",
          }));
          return;
        }
        if (event.code === 4401) {
          try {
            await AUTH_API.refresh();
          } catch {
            if (!stopped) setState((previous) => ({
              ...previous, status: "offline", error: "Sign in again to view networks.",
            }));
            return;
          }
        }
        if (!stopped) {
          const delay = Math.min(1_000 * 2 ** Math.min(attempts++, 5), 30_000);
          timer = setTimeout(connect, delay);
        }
      };
    }

    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      socket?.close();
    };
  }, []);

  return state;
}
