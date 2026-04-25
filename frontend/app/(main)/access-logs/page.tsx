"use client";

import { useState, useMemo, useEffect } from "react";
import { Icon } from "@iconify/react";
import PaginatedTable, {
  type Column,
} from "@/components/commons/paginated-table";
import { AccessLog } from "@/types";
import { useAccessLogs } from "@/hooks";
import { formatTimestamp } from "@/utils";

const getInitials = (name: string) =>
  name === "Unknown"
    ? "?"
    : name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

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

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [granted, setGranted] = useState<"all" | "true" | "false">("all");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const params = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search,
      ordering: "-timestamp",
      ...(granted !== "all" && {
        result: granted === "true" ? "granted" : "denied",
      }),
      ...(dateFrom && { start_date: dateFrom }),
      ...(dateTo && { end_date: dateTo }),
    }),
    [page, pageSize, search, granted, dateFrom, dateTo],
  );

  const { data, isLoading, isFetching, refetch } = useAccessLogs(params);

  const logs: AccessLog[] = data?.results ?? [];
  const total = data?.count ?? 0;
  const totalGranted = data?.granted_count ?? 0;
  const totalDenied = data?.denied_count ?? 0;

  const handleGranted = (value: "all" | "true" | "false") => {
    setGranted(value);
    setPage(1);
  };

  const handleDateFrom = (value: string) => {
    setDateFrom(value);
    setPage(1);
  };

  const handleDateTo = (value: string) => {
    setDateTo(value);
    setPage(1);
  };

  const handleClear = () => {
    setSearchInput("");
    setSearch("");
    setGranted("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const columns: Column<AccessLog>[] = [
    {
      key: "staff_name",
      header: "Staff Member",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 bg-slate-100 text-slate-500">
            {getInitials(row.staff_name)}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{row.staff_name}</p>
            <p className="text-xs text-slate-400 font-mono">{row.staff_employee_id}</p>
          </div>
        </div>
      ),
    },

    {
      key: "result",
      header: "Result",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 w-fit border ${
              row.result === "granted"
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-red-50 text-red-600 border-red-100"
            }`}
          >
            <Icon
              icon={
                row.result === "granted"
                  ? "hugeicons:checkmark-circle-02"
                  : "hugeicons:cancel-circle"
              }
              className="text-sm"
            />
            {row.result === "granted" ? "Granted" : "Denied"}
          </span>

          {row.result === "denied" && row.deny_reason_display && (
            <span className="text-xs text-slate-400">{row.deny_reason_display}</span>
          )}
        </div>
      ),
    },

    {
      key: "confidence",
      header: "Confidence",
      render: (row) => (
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
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon
            icon="hugeicons:refresh"
            className={`text-base ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill
          icon="hugeicons:time-schedule"
          label="Total logs"
          value={total}
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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-400 text-slate-700"
          />
        </div>

        <select
          value={granted}
          onChange={(e) => handleGranted(e.target.value as "all" | "true" | "false")}
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
            onChange={(e) => handleDateFrom(e.target.value)}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none text-slate-700"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateTo(e.target.value)}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none text-slate-700"
          />
        </div>

        {(searchInput || granted !== "all" || dateFrom || dateTo) && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors"
          >
            <Icon icon="hugeicons:cancel-circle" className="text-base" />
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <PaginatedTable
        data={logs}
        columns={columns}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        loading={isLoading || isFetching}
        emptyIcon="hugeicons:time-schedule"
        emptyMessage="No logs match your filters"
      />
    </div>
  );
}