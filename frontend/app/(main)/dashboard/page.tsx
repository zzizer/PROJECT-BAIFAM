"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

// ── Types ──────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  accent: "green" | "red" | "blue" | "amber";
}

interface LogEntry {
  id: number;
  name: string;
  time: string;
  granted: boolean;
  reason?: string;
  initials: string;
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
const LiveDot = () => (
  <span className="relative flex h-2.5 w-2.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
  </span>
);

// ── Mock log data ──────────────────────────────────────────────────
const mockLogs: LogEntry[] = [
  {
    id: 1,
    name: "Samuel Okello",
    time: "09:42 AM",
    granted: true,
    initials: "SO",
  },
  {
    id: 2,
    name: "Unknown",
    time: "09:38 AM",
    granted: false,
    reason: "No match",
    initials: "?",
  },
  {
    id: 3,
    name: "Grace Nakato",
    time: "09:31 AM",
    granted: true,
    initials: "GN",
  },
  {
    id: 4,
    name: "Brian Mutesasira",
    time: "09:15 AM",
    granted: true,
    initials: "BM",
  },
  {
    id: 5,
    name: "Alice Namutebi",
    time: "08:58 AM",
    granted: false,
    reason: "Outside hours",
    initials: "AN",
  },
  {
    id: 6,
    name: "David Ssemakula",
    time: "08:47 AM",
    granted: true,
    initials: "DS",
  },
  {
    id: 7,
    name: "Unknown",
    time: "08:33 AM",
    granted: false,
    reason: "No match",
    initials: "?",
  },
  {
    id: 8,
    name: "Ruth Namukasa",
    time: "08:21 AM",
    granted: true,
    initials: "RN",
  },
];

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
  value: number;
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
}) => (
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
              value > 80
                ? "bg-red-400"
                : value > 60
                  ? "bg-amber-400"
                  : "bg-emerald-400"
            }`}
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 shrink-0">
          {value}
          {unit}
        </span>
      </div>
    </div>
  </div>
);

// ── Main Dashboard ─────────────────────────────────────────────────
export default function DashboardPage() {
  const [time, setTime] = useState(new Date());
  const [scannerOnline, setScannerOnline] = useState(true);
  const [doorLocked, setDoorLocked] = useState(true);

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

          <button
            onClick={() => setDoorLocked((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              doorLocked
                ? "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            <Icon
              icon={
                doorLocked ? "hugeicons:lock-password" : "hugeicons:lock-open"
              }
              className="text-base"
            />
            {doorLocked ? "Door Locked" : "Door Unlocked"}
          </button>
        </div>
      </div>

      {/* ── Device status banner ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <LiveDot />
          <span className="text-sm font-semibold text-slate-800">
            Main Entrance
          </span>
          <span className="text-xs text-slate-400 font-mono">
            accesspi.local
          </span>
        </div>

        <div className="w-px h-4 bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${scannerOnline ? "bg-emerald-500" : "bg-red-500"}`}
          />
          <span className="text-xs text-slate-500">
            Scanner {scannerOnline ? "connected" : "disconnected"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Icon icon="hugeicons:clock-01" className="text-sm text-slate-400" />
          <span className="text-xs text-slate-500">Uptime: 3d 4h 22m</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Icon
            icon="hugeicons:finger-print"
            className="text-sm text-slate-400"
          />
          <span className="text-xs text-slate-500">
            42 fingerprints enrolled
          </span>
        </div>

        <div className="ml-auto">
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full font-medium">
            All systems operational
          </span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Access Granted Today"
          value={24}
          icon="hugeicons:checkmark-circle-02"
          trend="12% vs yesterday"
          trendUp={true}
          accent="green"
        />
        <StatCard
          label="Access Denied Today"
          value={3}
          icon="hugeicons:cancel-circle"
          trend="2 fewer"
          trendUp={true}
          accent="red"
        />
        <StatCard
          label="Total Scans Today"
          value={27}
          icon="hugeicons:finger-print"
          accent="blue"
        />
        <StatCard
          label="Staff on Premises"
          value={8}
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
            <button className="text-xs text-primary hover:underline font-medium">
              View all logs →
            </button>
          </div>

          <div className="divide-y divide-slate-50">
            {mockLogs.map((log, i) => (
              <div
                key={log.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    log.granted
                      ? avatarColors[i % avatarColors.length]
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {log.initials}
                </div>

                {/* Name + reason */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {log.name}
                  </p>
                  {log.reason && (
                    <p className="text-xs text-red-400">{log.reason}</p>
                  )}
                </div>

                {/* Time */}
                <span className="text-xs text-slate-400 font-mono shrink-0">
                  {log.time}
                </span>

                {/* Badge */}
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                    log.granted
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-red-50 text-red-600 border border-red-100"
                  }`}
                >
                  {log.granted ? "Granted" : "Denied"}
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
              value={42}
              unit="%"
              icon="hugeicons:cpu"
              ok={true}
            />
            <HealthItem
              label="Memory"
              value={28}
              unit="%"
              icon="hugeicons:hard-drive"
              ok={true}
            />
            <HealthItem
              label="Disk"
              value={34}
              unit="%"
              icon="hugeicons:database-02"
              ok={true}
            />
            <HealthItem
              label="CPU Temp"
              value={51}
              unit="°C"
              icon="hugeicons:temperature"
              ok={true}
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
                  icon: "hugeicons:finger-print",
                  accent: "text-blue-600 bg-blue-50 border-blue-100",
                },
                {
                  label: "Add Staff",
                  icon: "hugeicons:user-add-01",
                  accent: "text-violet-600 bg-violet-50 border-violet-100",
                },
                {
                  label: "Export Logs",
                  icon: "hugeicons:download-02",
                  accent: "text-teal-600 bg-teal-50 border-teal-100",
                },
                {
                  label: "Settings",
                  icon: "hugeicons:setting-07",
                  accent: "text-slate-600 bg-slate-50 border-slate-200",
                },
              ].map((a) => (
                <button
                  key={a.label}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center hover:shadow-sm transition-all ${a.accent}`}
                >
                  <Icon icon={a.icon} className="text-xl" />
                  <span className="text-xs font-medium leading-tight">
                    {a.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
