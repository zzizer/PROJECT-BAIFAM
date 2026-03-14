"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import PaginatedTable, {
  type Column,
} from "@/components/commons/paginated-table";

// ── Types ──────────────────────────────────────────────────────────
interface Fingerprint {
  id: number;
  scanner_id: number;
  finger: string;
  finger_display: string;
  label: string;
  is_active: boolean;
  enrolled_at: string;
  staff_id: number;
  staff_name: string;
  staff_employee_id: string;
  staff_role: string;
}

// ── Mock data ──────────────────────────────────────────────────────
const mockFingerprints: Fingerprint[] = [
  {
    id: 1,
    scanner_id: 0,
    finger: "right_thumb",
    finger_display: "Right Thumb",
    label: "Primary",
    is_active: true,
    enrolled_at: "2024-01-10T09:00:00",
    staff_id: 1,
    staff_name: "Samuel Okello",
    staff_employee_id: "EMP-0001",
    staff_role: "admin",
  },
  {
    id: 2,
    scanner_id: 1,
    finger: "left_index",
    finger_display: "Left Index",
    label: "Secondary",
    is_active: true,
    enrolled_at: "2024-01-10T09:15:00",
    staff_id: 1,
    staff_name: "Samuel Okello",
    staff_employee_id: "EMP-0001",
    staff_role: "admin",
  },
  {
    id: 3,
    scanner_id: 2,
    finger: "right_thumb",
    finger_display: "Right Thumb",
    label: "Primary",
    is_active: true,
    enrolled_at: "2024-01-12T10:00:00",
    staff_id: 2,
    staff_name: "Grace Nakato",
    staff_employee_id: "EMP-0002",
    staff_role: "manager",
  },
  {
    id: 4,
    scanner_id: 3,
    finger: "right_thumb",
    finger_display: "Right Thumb",
    label: "Primary",
    is_active: true,
    enrolled_at: "2024-01-15T08:30:00",
    staff_id: 3,
    staff_name: "Brian Mutesasira",
    staff_employee_id: "EMP-0003",
    staff_role: "employee",
  },
  {
    id: 5,
    scanner_id: 4,
    finger: "left_thumb",
    finger_display: "Left Thumb",
    label: "Backup",
    is_active: true,
    enrolled_at: "2024-01-15T08:45:00",
    staff_id: 3,
    staff_name: "Brian Mutesasira",
    staff_employee_id: "EMP-0003",
    staff_role: "employee",
  },
  {
    id: 6,
    scanner_id: 5,
    finger: "right_index",
    finger_display: "Right Index",
    label: "Primary",
    is_active: true,
    enrolled_at: "2024-01-18T11:00:00",
    staff_id: 4,
    staff_name: "Alice Namutebi",
    staff_employee_id: "EMP-0004",
    staff_role: "employee",
  },
  {
    id: 7,
    scanner_id: 6,
    finger: "right_thumb",
    finger_display: "Right Thumb",
    label: "Primary",
    is_active: true,
    enrolled_at: "2024-02-01T07:45:00",
    staff_id: 5,
    staff_name: "David Ssemakula",
    staff_employee_id: "EMP-0005",
    staff_role: "security",
  },
  {
    id: 8,
    scanner_id: 7,
    finger: "left_thumb",
    finger_display: "Left Thumb",
    label: "Secondary",
    is_active: true,
    enrolled_at: "2024-02-01T07:55:00",
    staff_id: 5,
    staff_name: "David Ssemakula",
    staff_employee_id: "EMP-0005",
    staff_role: "security",
  },
  {
    id: 9,
    scanner_id: 8,
    finger: "right_middle",
    finger_display: "Right Middle",
    label: "Backup",
    is_active: true,
    enrolled_at: "2024-02-01T08:05:00",
    staff_id: 5,
    staff_name: "David Ssemakula",
    staff_employee_id: "EMP-0005",
    staff_role: "security",
  },
  {
    id: 10,
    scanner_id: 9,
    finger: "right_thumb",
    finger_display: "Right Thumb",
    label: "Primary",
    is_active: true,
    enrolled_at: "2024-02-05T09:30:00",
    staff_id: 6,
    staff_name: "Ruth Namukasa",
    staff_employee_id: "EMP-0006",
    staff_role: "employee",
  },
  {
    id: 11,
    scanner_id: 10,
    finger: "right_index",
    finger_display: "Right Index",
    label: "Primary",
    is_active: false,
    enrolled_at: "2024-02-10T10:00:00",
    staff_id: 7,
    staff_name: "Moses Kiggundu",
    staff_employee_id: "EMP-0007",
    staff_role: "visitor",
  },
  {
    id: 12,
    scanner_id: 11,
    finger: "right_thumb",
    finger_display: "Right Thumb",
    label: "Primary",
    is_active: true,
    enrolled_at: "2024-02-14T08:00:00",
    staff_id: 8,
    staff_name: "Esther Nalwoga",
    staff_employee_id: "EMP-0008",
    staff_role: "employee",
  },
  {
    id: 13,
    scanner_id: 12,
    finger: "left_index",
    finger_display: "Left Index",
    label: "Secondary",
    is_active: true,
    enrolled_at: "2024-02-14T08:10:00",
    staff_id: 8,
    staff_name: "Esther Nalwoga",
    staff_employee_id: "EMP-0008",
    staff_role: "employee",
  },
];

const SCANNER_CAPACITY = 128;

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

const fingerIcons: Record<string, string> = {
  right_thumb: "hugeicons:finger-print",
  right_index: "hugeicons:finger-print",
  right_middle: "hugeicons:finger-print",
  right_ring: "hugeicons:finger-print",
  right_little: "hugeicons:finger-print",
  left_thumb: "hugeicons:finger-print",
  left_index: "hugeicons:finger-print",
  left_middle: "hugeicons:finger-print",
  left_ring: "hugeicons:finger-print",
  left_little: "hugeicons:finger-print",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// ── Page ──────────────────────────────────────────────────────────
export default function FingerprintsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = mockFingerprints.filter((f) => {
    const matchSearch =
      !search ||
      f.staff_name.toLowerCase().includes(search.toLowerCase()) ||
      f.staff_employee_id.toLowerCase().includes(search.toLowerCase()) ||
      f.finger_display.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && f.is_active) ||
      (statusFilter === "inactive" && !f.is_active);
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const usedSlots = mockFingerprints.filter((f) => f.is_active).length;
  const usedPct = Math.round((usedSlots / SCANNER_CAPACITY) * 100);

  const columns: Column<Fingerprint>[] = [
    {
      key: "fingerprint",
      header: "Fingerprint",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <Icon
              icon={fingerIcons[row.finger] ?? "hugeicons:finger-print"}
              className="text-sm text-slate-500"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">
              {row.label || row.finger_display}
            </p>
            <p className="text-xs text-slate-400">{row.finger_display}</p>
          </div>
        </div>
      ),
    },
    {
      key: "staff",
      header: "Staff Member",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColors[row.staff_id % avatarColors.length]}`}
          >
            {getInitials(row.staff_name)}
          </div>
          <div>
            <Link
              href={`/staff/${row.staff_id}/detail`}
              className="text-sm font-medium text-slate-800 hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {row.staff_name}
            </Link>
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
      render: (row) => (
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleColors[row.staff_role] ?? "bg-slate-100 text-slate-500"}`}
        >
          {row.staff_role}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
            row.is_active
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-slate-100 text-slate-400 border-slate-200"
          }`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "enrolled_at",
      header: "Enrolled",
      render: (row) => (
        <span className="text-sm text-slate-500">
          {new Date(row.enrolled_at).toLocaleDateString("en-UG", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          onClick={() => setDeletingId(row.id)}
          className="p-1.5 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-lg transition-colors"
        >
          <Icon icon="hugeicons:delete-02" className="text-base" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Fingerprints
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {usedSlots} enrolled &middot; {SCANNER_CAPACITY - usedSlots} slots
            remaining
          </p>
        </div>
        <Link
          href="/fingerprints/enroll"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-all"
        >
          <Icon icon="hugeicons:finger-print" className="text-base" />
          Enroll Fingerprint
        </Link>
      </div>

      {/* Scanner capacity bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <Icon icon="hugeicons:cpu" className="text-lg text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-medium text-slate-700">
              Scanner Storage
            </p>
            <span className="text-xs text-slate-500 font-mono">
              {usedSlots} / {SCANNER_CAPACITY} slots
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usedPct > 80
                  ? "bg-red-400"
                  : usedPct > 60
                    ? "bg-amber-400"
                    : "bg-emerald-400"
              }`}
              style={{ width: `${usedPct}%` }}
            />
          </div>
        </div>
        <span
          className={`text-sm font-semibold shrink-0 ${
            usedPct > 80
              ? "text-red-600"
              : usedPct > 60
                ? "text-amber-600"
                : "text-emerald-600"
          }`}
        >
          {usedPct}%
        </span>
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
            placeholder="Search by staff name, ID or finger…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-400 text-slate-700"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none text-slate-700"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
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
        emptyIcon="hugeicons:finger-print"
        emptyMessage="No fingerprints found"
      />

      {/* Delete confirm modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <Icon
                icon="hugeicons:delete-02"
                className="text-xl text-red-500"
              />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">
              Delete fingerprint?
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              This permanently removes the template from the scanner hardware.
              The staff member will need to re-enroll this finger.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
