"use client";

import React, { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import PaginatedTable, {
  type Column,
} from "@/components/commons/paginated-table";

// ── Types ──────────────────────────────────────────────────────────
interface LogEntry {
  id: number;
  staff_name: string;
  staff_employee_id: string;
  staff_role: string;
  scanner_id: number | null;
  confidence: number;
  granted: boolean;
  deny_reason: string;
  deny_reason_display: string;
  timestamp: string;
}

// ── Mock data ──────────────────────────────────────────────────────
function generateMockLogs(): LogEntry[] {
  const names = [
    { name: "Samuel Okello", id: "EMP-0001", role: "admin" },
    { name: "Grace Nakato", id: "EMP-0002", role: "manager" },
    { name: "Brian Mutesasira", id: "EMP-0003", role: "employee" },
    { name: "Alice Namutebi", id: "EMP-0004", role: "employee" },
    { name: "David Ssemakula", id: "EMP-0005", role: "security" },
    { name: "Ruth Namukasa", id: "EMP-0006", role: "employee" },
    { name: "Unknown", id: "—", role: "—" },
  ];

  const reasons = [
    { deny_reason: "", display: "Granted", granted: true },
    {
      deny_reason: "no_fingerprint_match",
      display: "No Fingerprint Match",
      granted: false,
    },
    {
      deny_reason: "outside_allowed_hours",
      display: "Outside Allowed Hours",
      granted: false,
    },
    {
      deny_reason: "access_revoked",
      display: "Access Revoked",
      granted: false,
    },
    { deny_reason: "locked_out", display: "Locked Out", granted: false },
    {
      deny_reason: "outside_allowed_days",
      display: "Outside Allowed Days",
      granted: false,
    },
  ];

  return Array.from({ length: 120 }, (_, i) => {
    const person = names[i % names.length];
    const result = reasons[i % reasons.length];
    const date = new Date(2024, 11, 14, 8 + (i % 10), (i * 7) % 60);
    const isUnknown = person.name === "Unknown";

    return {
      id: i + 1,
      staff_name: person.name,
      staff_employee_id: person.id,
      staff_role: person.role,
      scanner_id: isUnknown ? null : i % 10,
      confidence: isUnknown ? 0 : 70 + (i % 30),
      granted: result.granted,
      deny_reason: result.deny_reason,
      deny_reason_display: result.display,
      timestamp: date.toISOString(),
    };
  });
}

const ALL_LOGS = generateMockLogs();

// ── Helpers ────────────────────────────────────────────────────────
const getInitials = (name: string) =>
  name === "Unknown"
    ? "?"
    : name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
];

const roleColors: Record<string, string> = {
  admin: "bg-violet-50 text-violet-700",
  manager: "bg-blue-50 text-blue-700",
  employee: "bg-slate-100 text-slate-600",
  security: "bg-amber-50 text-amber-700",
  visitor: "bg-teal-50 text-teal-700",
};

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-UG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-UG", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
}

// ── Stat pill ─────────────────────────────────────────────────────
const StatPill = ({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) => (
  <div
    className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${color}`}
  >
    <Icon icon={icon} className="text-lg shrink-0" />
    <div>
      <p className="text-xl font-bold leading-none">{value}</p>
      <p className="text-xs mt-0.5 opacity-75">{label}</p>
    </div>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────
export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [granted, setGranted] = useState<"all" | "true" | "false">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Filter
  const filtered = useMemo(() => {
    return ALL_LOGS.filter((l) => {
      const matchSearch =
        !search ||
        l.staff_name.toLowerCase().includes(search.toLowerCase()) ||
        l.staff_employee_id.toLowerCase().includes(search.toLowerCase());
      const matchGranted =
        granted === "all" ||
        (granted === "true" && l.granted) ||
        (granted === "false" && !l.granted);
      const matchFrom =
        !dateFrom || new Date(l.timestamp) >= new Date(dateFrom);
      const matchTo =
        !dateTo || new Date(l.timestamp) <= new Date(dateTo + "T23:59:59");
      return matchSearch && matchGranted && matchFrom && matchTo;
    });
  }, [search, granted, dateFrom, dateTo]);

  // Paginate
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const totalGranted = filtered.filter((l) => l.granted).length;
  const totalDenied = filtered.length - totalGranted;

  // Reset to page 1 when filters change
  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const handleGranted = (v: "all" | "true" | "false") => {
    setGranted(v);
    setPage(1);
  };
  const handleFrom = (v: string) => {
    setDateFrom(v);
    setPage(1);
  };
  const handleTo = (v: string) => {
    setDateTo(v);
    setPage(1);
  };

  // Export CSV
  const handleExport = () => {
    const rows = [
      [
        "ID",
        "Timestamp",
        "Staff Name",
        "Employee ID",
        "Role",
        "Confidence",
        "Granted",
        "Reason",
      ],
      ...filtered.map((l) => [
        l.id,
        l.timestamp,
        l.staff_name,
        l.staff_employee_id,
        l.staff_role,
        l.confidence,
        l.granted ? "Yes" : "No",
        l.deny_reason_display,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `access_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Columns
  const columns: Column<LogEntry>[] = [
    {
      key: "staff",
      header: "Staff Member",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
              row.granted
                ? avatarColors[row.id % avatarColors.length]
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {getInitials(row.staff_name)}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">
              {row.staff_name}
            </p>
            <p className="text-xs text-slate-400 font-mono">
              {row.staff_employee_id}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) =>
        row.staff_role === "—" ? (
          <span className="text-xs text-slate-400">—</span>
        ) : (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleColors[row.staff_role] ?? "bg-slate-100 text-slate-500"}`}
          >
            {row.staff_role}
          </span>
        ),
    },
    {
      key: "result",
      header: "Result",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 w-fit border ${
              row.granted
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-red-50 text-red-600 border-red-100"
            }`}
          >
            <Icon
              icon={
                row.granted
                  ? "hugeicons:checkmark-circle-02"
                  : "hugeicons:cancel-circle"
              }
              className="text-sm"
            />
            {row.granted ? "Granted" : "Denied"}
          </span>
          {!row.granted && row.deny_reason_display && (
            <span className="text-xs text-slate-400">
              {row.deny_reason_display}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "confidence",
      header: "Confidence",
      render: (row) =>
        row.confidence > 0 ? (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  row.confidence >= 80
                    ? "bg-emerald-400"
                    : row.confidence >= 60
                      ? "bg-amber-400"
                      : "bg-red-400"
                }`}
                style={{ width: `${row.confidence}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">{row.confidence}%</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: "timestamp",
      header: "Timestamp",
      render: (row) => {
        const { date, time } = formatTimestamp(row.timestamp);
        return (
          <div>
            <p className="text-sm text-slate-700">{time}</p>
            <p className="text-xs text-slate-400">{date}</p>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Access Logs
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Complete record of every scan attempt
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Icon icon="hugeicons:download-02" className="text-base" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill
          icon="hugeicons:time-schedule"
          label="Total logs"
          value={filtered.length}
          color="bg-slate-50 border-slate-200 text-slate-700"
        />
        <StatPill
          icon="hugeicons:checkmark-circle-02"
          label="Granted"
          value={totalGranted}
          color="bg-emerald-50 border-emerald-100 text-emerald-700"
        />
        <StatPill
          icon="hugeicons:cancel-circle"
          label="Denied"
          value={totalDenied}
          color="bg-red-50 border-red-100 text-red-600"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Icon
            icon="hugeicons:search-01"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base"
          />
          <input
            type="text"
            placeholder="Search by name or employee ID…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-400 text-slate-700"
          />
        </div>

        <select
          value={granted}
          onChange={(e) =>
            handleGranted(e.target.value as "all" | "true" | "false")
          }
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none text-slate-700"
        >
          <option value="all">All results</option>
          <option value="true">Granted only</option>
          <option value="false">Denied only</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleFrom(e.target.value)}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none text-slate-700"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleTo(e.target.value)}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none text-slate-700"
          />
        </div>

        {(search || granted !== "all" || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setSearch("");
              setGranted("all");
              setDateFrom("");
              setDateTo("");
              setPage(1);
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors"
          >
            <Icon icon="hugeicons:cancel-circle" className="text-base" />
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <PaginatedTable
        data={paginated}
        columns={columns}
        page={page}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        emptyIcon="hugeicons:time-schedule"
        emptyMessage="No logs match your filters"
      />
    </div>
  );
}
