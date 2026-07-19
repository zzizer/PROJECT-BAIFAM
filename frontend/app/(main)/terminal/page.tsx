"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

import { useAppSelector } from "@/store/hooks";

type ConnectionState = "disconnected" | "connecting" | "connected";

function buildTerminalUrl(token: string): string {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  const serverUrl = apiUrl.replace(/\/api\/?$/, "");

  return `${serverUrl.replace(
    /^http/,
    "ws",
  )}/ws/terminal/?token=${encodeURIComponent(token)}`;
}

export default function TerminalPage() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [message, setMessage] = useState(
    "Select Connect to open a terminal session.",
  );

  const sendSize = useCallback(() => {
    const socket = socketRef.current;
    const terminal = terminalRef.current;

    if (socket?.readyState !== WebSocket.OPEN || !terminal) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "resize",
        cols: terminal.cols,
        rows: terminal.rows,
      }),
    );
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const terminal = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily:
        '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
      fontSize: 14,
      scrollback: 5000,
      theme: {
        background: "#0a0a0a",
        foreground: "#f8fafc",
        cursor: "#22c55e",
        selectionBackground: "#334155",
      },
    });
    const fitAddon = new FitAddon();

    terminal.loadAddon(fitAddon);
    terminal.open(container);
    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    const fit = () => {
      fitAddon.fit();
      sendSize();
    };

    fit();
    terminal.writeln(
      "\x1b[90mAccessPi terminal ready. Select Connect.\x1b[0m",
    );

    const inputSubscription = terminal.onData((data) => {
      const socket = socketRef.current;
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(new TextEncoder().encode(data));
      }
    });

    const resizeObserver = new ResizeObserver(fit);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      inputSubscription.dispose();
      socketRef.current?.close();
      socketRef.current = null;
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [sendSize]);

  const connect = () => {
    if (!accessToken || connectionState !== "disconnected") {
      return;
    }

    const terminal = terminalRef.current;
    const socket = new WebSocket(buildTerminalUrl(accessToken));

    socket.binaryType = "arraybuffer";
    socketRef.current = socket;
    setConnectionState("connecting");
    setMessage("Connecting to the Raspberry Pi...");

    socket.onopen = () => {
      setConnectionState("connected");
      setMessage("Connected");
      terminal?.clear();
      terminal?.focus();
      sendSize();
    };

    socket.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        terminal?.write(new Uint8Array(event.data));
        return;
      }

      if (event.data instanceof Blob) {
        void event.data.arrayBuffer().then((data) => {
          terminal?.write(new Uint8Array(data));
        });
      }
    };

    socket.onerror = () => {
      setMessage("The terminal connection failed.");
    };

    socket.onclose = (event) => {
      socketRef.current = null;
      setConnectionState("disconnected");

      if (event.code === 4403) {
        setMessage(
          "Terminal access is disabled or authentication failed.",
        );
      } else if (event.code === 4408) {
        setMessage("Session closed after being idle.");
      } else {
        setMessage("Terminal disconnected.");
      }

      terminal?.writeln(
        "\r\n\x1b[90m[Terminal session closed]\x1b[0m",
      );
    };
  };

  const disconnect = () => {
    socketRef.current?.close(1000, "User disconnected");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Terminal</h1>
          <p className="mt-1 text-sm text-slate-500">
            Open a shell session on the AccessPi device.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                connectionState === "connected"
                  ? "bg-emerald-500"
                  : connectionState === "connecting"
                    ? "animate-pulse bg-amber-500"
                    : "bg-slate-300"
              }`}
            />
            {message}
          </span>

          {connectionState === "disconnected" ? (
            <button
              type="button"
              onClick={connect}
              disabled={!accessToken}
              className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon icon="hugeicons:connect" />
              Connect
            </button>
          ) : (
            <button
              type="button"
              onClick={disconnect}
              className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Icon icon="hugeicons:cancel-circle" />
              Disconnect
            </button>
          )}
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-neutral-950 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="ml-2 text-xs text-slate-400">AccessPi shell</span>
        </div>
        <div
          ref={containerRef}
          className="h-[calc(100vh-310px)] min-h-[440px] p-3"
        />
      </section>
    </div>
  );
}
