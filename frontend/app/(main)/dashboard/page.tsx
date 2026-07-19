"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";

import { useDashboardSnapshot } from "@/hooks";
import { useDashboardLive } from "@/hooks/use-dashboard-live";

// ── Types ──────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  accent: "green" | "red" | "blue" | "amber";
}

// ── Helpers ────────────────────────────────────────────────────────
const accentClasses = {
  green: {
    bg: "bg-emerald-50",
    icon: "bg-emerald-100 text-emerald-600",
    text: "text-emerald-600",
    border: "border-emerald-100",
  },
  red: {
    bg: "bg-red-50",
    icon: "bg-red-100 text-red-600",
    text: "text-red-600",
    border: "border-red-100",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-100 text-blue-600",
    text: "text-blue-600",
    border: "border-blue-100",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "bg-amber-100 text-amber-600",
    text: "text-amber-600",
    border: "border-amber-100",
  },
};

// ── Stat Card ──────────────────────────────────────────────────────
const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendUp,
  accent,
}) => {
  const a = accentClasses[accent];
  return (
    <div
      className={`bg-white rounded-2xl border ${a.border} p-5 flex flex-col gap-4 hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.icon}`}
        >
          <Icon icon={icon} className="text-xl" />
        </div>
        {trend && (
          <span
            className={`text-xs font-medium flex items-center gap-1 ${
              trendUp ? "text-emerald-600" : "text-red-500"
            }`}
          >
            <Icon
              icon={
                trendUp
                  ? "hugeicons:arrow-up-right-01"
                  : "hugeicons:arrow-down-right-01"
              }
              className="text-sm"
            />
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 tracking-tight">
          {value}
        </p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
};

// ── Live dot ───────────────────────────────────────────────────────
const LiveDot = ({ live }: { live: boolean }) => (
  <span className="relative flex h-2.5 w-2.5">
    {live && (
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
    )}
    <span
      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
        live ? "bg-emerald-500" : "bg-slate-300"
      }`}
    />
  </span>
);

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
];

// ── System Health Row ──────────────────────────────────────────────
interface HealthItemProps {
  label: string;
  value: number | null | undefined;
  unit?: string;
  icon: string;
  ok: boolean;
}

const HealthItem: React.FC<HealthItemProps> = ({
  label,
  value,
  unit,
  icon,
  ok,
}) => {
  const percentage = value ?? 0;

  return (
  <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center ${ok ? "bg-slate-100 text-slate-500" : "bg-red-50 text-red-500"}`}
    >
      <Icon icon={icon} className="text-base" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              percentage > 80
                ? "bg-red-400"
                : percentage > 60
                  ? "bg-amber-400"
                  : "bg-emerald-400"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 shrink-0">
          {value == null ? "—" : `${value}${unit ?? ""}`}
        </span>
      </div>
    </div>
  </div>
  );
};

const initials = (name: string) =>
  name === "Unknown"
    ? "?"
    : name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

const formatUptime = (seconds?: number) => {
  if (!seconds) return "—";
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

// ── Main Dashboard ─────────────────────────────────────────────────
export default function DashboardPage() {
  const [time, setTime] = useState(new Date());
  const { data: dashboard, isLoading } = useDashboardSnapshot();
  const connectionState = useDashboardLive();
  const live = connectionState === "live";

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString("en-UG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateStr = time.toLocaleDateString("en-UG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-6 space-y-6 min-h-full">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{dateStr}</p>
        </div>

        {/* Live clock + door state */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-center">
            <p className="text-lg font-bold text-slate-800 font-mono tracking-widest">
              {timeStr}
            </p>
            <p className="text-xs text-slate-400">Local Time</p>
          </div>

          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              dashboard?.device.door_locked
                ? "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            <Icon
              icon={
                dashboard?.device.door_locked
                  ? "hugeicons:lock-password"
                  : "hugeicons:lock-open"
              }
              className="text-base"
            />
            {isLoading
              ? "Door Status —"
              : dashboard?.device.door_locked
                ? "Door Locked"
                : "Door Unlocked"}
          </div>
        </div>
      </div>

      {/* ── Device status banner ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <LiveDot live={live} />
          <span className="text-sm font-semibold text-slate-800">
            {dashboard?.device.name ?? "AccessPi"}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            accesspi.local
          </span>
        </div>

        <div className="w-px h-4 bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${
              dashboard?.device.scanner_connected
                ? "bg-emerald-500"
                : "bg-red-500"
            }`}
          />
          <span className="text-xs text-slate-500">
            Scanner{" "}
            {dashboard?.device.scanner_connected
              ? "connected"
              : "disconnected"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Icon icon="hugeicons:clock-01" className="text-sm text-slate-400" />
          <span className="text-xs text-slate-500">
            Uptime: {formatUptime(dashboard?.device.uptime_seconds)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Icon
            icon="hugeicons:finger-print"
            className="text-sm text-slate-400"
          />
          <span className="text-xs text-slate-500">
            {dashboard?.scanner?.used ?? "—"} fingerprints enrolled
          </span>
        </div>

        <div className="ml-auto">
          <span
            className={`text-xs border px-2.5 py-1 rounded-full font-medium ${
              live
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : connectionState === "offline"
                  ? "bg-red-50 text-red-700 border-red-100"
                  : "bg-amber-50 text-amber-700 border-amber-100"
            }`}
          >
            {live
              ? "Live"
              : connectionState === "offline"
                ? "Offline"
                : connectionState === "reconnecting"
                  ? "Reconnecting"
                  : "Connecting"}
          </span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Access Granted Today"
          value={dashboard?.today.granted ?? "—"}
          icon="hugeicons:checkmark-circle-02"
          accent="green"
        />
        <StatCard
          label="Access Denied Today"
          value={dashboard?.today.denied ?? "—"}
          icon="hugeicons:cancel-circle"
          accent="red"
        />
        <StatCard
          label="Total Scans Today"
          value={dashboard?.today.total ?? "—"}
          icon="hugeicons:finger-print"
          accent="blue"
        />
        <StatCard
          label="Staff Seen Today"
          value={dashboard?.today.staff_seen ?? "—"}
          icon="hugeicons:user-group"
          accent="amber"
        />
      </div>

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Access Log */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-800">
                Recent Access
              </h2>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                Live
              </span>
            </div>
            <Link
              href="/access-logs"
              className="text-xs text-primary hover:underline font-medium"
            >
              View all logs →
            </Link>
          </div>

          <div className="divide-y divide-slate-50">
            {dashboard?.recent_access.map((log, i) => (
              <div
                key={log.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    log.result === "granted"
                      ? avatarColors[i % avatarColors.length]
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {initials(log.staff_name)}
                </div>

                {/* Name + reason */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {log.staff_name}
                  </p>
                  {log.deny_reason_display && (
                    <p className="text-xs text-red-400">
                      {log.deny_reason_display}
                    </p>
                  )}
                </div>

                {/* Time */}
                <span className="text-xs text-slate-400 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString("en-UG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                {/* Badge */}
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                    log.result === "granted"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-red-50 text-red-600 border border-red-100"
                  }`}
                >
                  {log.result === "granted" ? "Granted" : "Denied"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* System health */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-1">
              System Health
            </h2>
            <p className="text-xs text-slate-400 mb-4">Live hardware metrics</p>
            <HealthItem
              label="CPU Usage"
              value={dashboard?.system?.cpu_percent}
              unit="%"
              icon="hugeicons:cpu"
              ok={(dashboard?.system?.cpu_percent ?? 0) <= 80}
            />
            <HealthItem
              label="Memory"
              value={dashboard?.system?.memory_percent}
              unit="%"
              icon="hugeicons:hard-drive"
              ok={(dashboard?.system?.memory_percent ?? 0) <= 80}
            />
            <HealthItem
              label="Disk"
              value={dashboard?.system?.disk_percent}
              unit="%"
              icon="hugeicons:database-02"
              ok={(dashboard?.system?.disk_percent ?? 0) <= 80}
            />
            <HealthItem
              label="CPU Temp"
              value={dashboard?.system?.cpu_temperature}
              unit="°C"
              icon="hugeicons:temperature"
              ok={(dashboard?.system?.cpu_temperature ?? 0) <= 80}
            />
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Enroll Finger",
                  href: "/fingerprints/enroll",
                  icon: "hugeicons:finger-print",
                  accent: "text-blue-600 bg-blue-50 border-blue-100",
                },
                {
                  label: "Add Staff",
                  href: "/staff/add",
                  icon: "hugeicons:user-add-01",
                  accent: "text-violet-600 bg-violet-50 border-violet-100",
                },
                {
                  label: "Export Logs",
                  href: "/access-logs",
                  icon: "hugeicons:download-02",
                  accent: "text-teal-600 bg-teal-50 border-teal-100",
                },
                {
                  label: "Settings",
                  href: "/settings",
                  icon: "hugeicons:setting-07",
                  accent: "text-slate-600 bg-slate-50 border-slate-200",
                },
              ].map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center hover:shadow-sm transition-all ${a.accent}`}
                >
                  <Icon icon={a.icon} className="text-xl" />
                  <span className="text-xs font-medium leading-tight">
                    {a.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
