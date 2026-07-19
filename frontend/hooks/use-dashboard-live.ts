"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { QK } from "@/hooks";
import { useAppSelector } from "@/store/hooks";
import type {
  AccessLog,
  DashboardConnectionState,
  DashboardSnapshot,
  DashboardSocketEvent,
  DashboardSystemMetrics,
  FingerprintMetadata,
} from "@/types";

const RETRY_DELAYS = [1_000, 2_000, 4_000, 8_000, 15_000, 30_000];

function buildDashboardWsUrl(token: string): string {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  const httpBase = apiUrl.replace(/\/api\/?$/, "");
  return `${httpBase.replace(/^http/, "ws")}/ws/dashboard/?token=${encodeURIComponent(token)}`;
}

export function useDashboardLive(): DashboardConnectionState {
  const queryClient = useQueryClient();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [connectionState, setConnectionState] =
    useState<DashboardConnectionState>("connecting");

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let retryAttempt = 0;
    let stopped = false;

    const updateSnapshot = (
      updater: (current: DashboardSnapshot) => DashboardSnapshot,
    ) => {
      queryClient.setQueryData<DashboardSnapshot>(
        QK.dashboard.snapshot(),
        (current) => (current ? updater(current) : current),
      );
    };

    const handleEvent = (event: DashboardSocketEvent) => {
      if (event.type === "connection.ready") return;

      updateSnapshot((current) => {
        const data = event.data ?? {};

        switch (event.type) {
          case "system.metrics": {
            const system = data as unknown as DashboardSystemMetrics;
            return {
              ...current,
              generated_at: event.timestamp,
              system,
              device: {
                ...current.device,
                uptime_seconds: system.uptime_seconds,
              },
            };
          }

          case "scanner.status":
            return {
              ...current,
              generated_at: event.timestamp,
              device: {
                ...current.device,
                scanner_connected: Boolean(data.connected),
              },
            };

          case "scanner.storage":
            return {
              ...current,
              generated_at: event.timestamp,
              scanner: data as unknown as FingerprintMetadata["storage"],
            };

          case "door.status":
            return {
              ...current,
              generated_at: event.timestamp,
              device: {
                ...current.device,
                door_locked: Boolean(data.locked),
              },
            };

          case "access.recorded": {
            const accessLog = data as unknown as AccessLog;
            const granted = accessLog.result === "granted";

            return {
              ...current,
              generated_at: event.timestamp,
              today: {
                ...current.today,
                granted: current.today.granted + (granted ? 1 : 0),
                denied: current.today.denied + (granted ? 0 : 1),
                total: current.today.total + 1,
              },
              recent_access: [
                accessLog,
                ...current.recent_access.filter(
                  (item) => item.id !== accessLog.id,
                ),
              ].slice(0, 10),
            };
          }

          default:
            return current;
        }
      });
    };

    const connect = () => {
      if (stopped) return;

      setConnectionState(
        retryAttempt === 0 ? "connecting" : "reconnecting",
      );

      socket = new WebSocket(buildDashboardWsUrl(accessToken));

      socket.onopen = () => {
        retryAttempt = 0;
        setConnectionState("live");
        void queryClient.invalidateQueries({
          queryKey: QK.dashboard.snapshot(),
        });
      };

      socket.onmessage = (message) => {
        try {
          handleEvent(JSON.parse(message.data) as DashboardSocketEvent);
        } catch {
          // Ignore malformed or unknown socket payloads.
        }
      };

      socket.onerror = () => socket?.close();

      socket.onclose = (event) => {
        if (stopped) return;

        if (event.code === 4401) {
          setConnectionState("offline");
          return;
        }

        setConnectionState("reconnecting");
        const delay =
          RETRY_DELAYS[Math.min(retryAttempt, RETRY_DELAYS.length - 1)];
        retryAttempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [accessToken, queryClient]);

  return accessToken ? connectionState : "offline";
}
