"use client";

import React, { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import PaginatedTable, {
  type Column,
} from "@/components/commons/paginated-table";

export interface StaffMember {
  id: number;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: "employee" | "manager" | "security" | "admin" | "visitor";
  department: string;
  is_active: boolean;
  fingerprint_count: number;
  has_access: boolean;
  created_at: string;
  locked_out_until?: string | null;
}

const mockStaff: StaffMember[] = [
  {
    id: 1,
    employee_id: "EMP-0001",
    full_name: "Samuel Okello",
    email: "samuel@co.ug",
    phone: "+256 700 100001",
    role: "admin",
    department: "IT",
    is_active: true,
    fingerprint_count: 2,
    has_access: true,
    created_at: "2024-01-10",
  },
  {
    id: 2,
    employee_id: "EMP-0002",
    full_name: "Grace Nakato",
    email: "grace@co.ug",
    phone: "+256 700 100002",
    role: "manager",
    department: "Operations",
    is_active: true,
    fingerprint_count: 1,
    has_access: true,
    created_at: "2024-01-12",
  },
  {
    id: 3,
    employee_id: "EMP-0003",
    full_name: "Brian Mutesasira",
    email: "brian@co.ug",
    phone: "+256 700 100003",
    role: "employee",
    department: "Finance",
    is_active: true,
    fingerprint_count: 2,
    has_access: true,
    created_at: "2024-01-15",
  },
  {
    id: 4,
    employee_id: "EMP-0004",
    full_name: "Alice Namutebi",
    email: "alice@co.ug",
    phone: "+256 700 100004",
    role: "employee",
    department: "HR",
    is_active: false,
    fingerprint_count: 1,
    has_access: false,
    created_at: "2024-01-18",
  },
  {
    id: 5,
    employee_id: "EMP-0005",
    full_name: "David Ssemakula",
    email: "david@co.ug",
    phone: "+256 700 100005",
    role: "security",
    department: "Security",
    is_active: true,
    fingerprint_count: 3,
    has_access: true,
    created_at: "2024-02-01",
  },
  {
    id: 6,
    employee_id: "EMP-0006",
    full_name: "Ruth Namukasa",
    email: "ruth@co.ug",
    phone: "+256 700 100006",
    role: "employee",
    department: "Finance",
    is_active: true,
    fingerprint_count: 1,
    has_access: true,
    created_at: "2024-02-05",
  },
  {
    id: 7,
    employee_id: "EMP-0007",
    full_name: "Moses Kiggundu",
    email: "moses@co.ug",
    phone: "+256 700 100007",
    role: "visitor",
    department: "—",
    is_active: true,
    fingerprint_count: 1,
    has_access: true,
    created_at: "2024-02-10",
    locked_out_until: "2024-12-31T10:00:00",
  },
  {
    id: 8,
    employee_id: "EMP-0008",
    full_name: "Esther Nalwoga",
    email: "esther@co.ug",
    phone: "+256 700 100008",
    role: "employee",
    department: "Operations",
    is_active: true,
    fingerprint_count: 2,
    has_access: true,
    created_at: "2024-02-14",
  },
];

const ROLES = ["all", "admin", "manager", "employee", "security", "visitor"];

const roleColors: Record<string, string> = {
  admin: "bg-violet-50 text-violet-700 border-violet-100",
  manager: "bg-blue-50 text-blue-700 border-blue-100",
  employee: "bg-slate-100 text-slate-600 border-slate-200",
  security: "bg-amber-50 text-amber-700 border-amber-100",
  visitor: "bg-teal-50 text-teal-700 border-teal-100",
};

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function StaffPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(
    () =>
      mockStaff.filter((s) => {
        const matchSearch =
          s.full_name.toLowerCase().includes(search.toLowerCase()) ||
          s.employee_id.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === "all" || s.role === roleFilter;
        const matchStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && s.is_active && !s.locked_out_until) ||
          (statusFilter === "inactive" && !s.is_active) ||
          (statusFilter === "locked" && !!s.locked_out_until);
        return matchSearch && matchRole && matchStatus;
      }),
    [search, roleFilter, statusFilter],
  );

  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const handleRole = (v: string) => {
    setRoleFilter(v);
    setPage(1);
  };
  const handleStatus = (v: string) => {
    setStatusFilter(v);
    setPage(1);
  };

  const columns: Column<StaffMember>[] = [
    {
      key: "staff",
      header: "Staff Member",
      render: (s) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColors[s.id % avatarColors.length]}`}
          >
            {getInitials(s.full_name)}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{s.full_name}</p>
            <p className="text-xs text-slate-400 font-mono">{s.employee_id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (s) => (
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${roleColors[s.role]}`}
        >
          {s.role}
        </span>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (s) => (
        <span className="text-sm text-slate-600">{s.department}</span>
      ),
    },
    {
      key: "fingerprints",
      header: "Fingerprints",
      render: (s) => (
        <div className="flex items-center gap-1.5">
          <Icon
            icon="hugeicons:finger-print"
            className="text-sm text-slate-400"
          />
          <span className="text-sm text-slate-600">{s.fingerprint_count}</span>
        </div>
      ),
    },
    {
      key: "access",
      header: "Access",
      render: (s) => (
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
            s.has_access
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
        >
          {s.has_access ? "Allowed" : "Revoked"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) =>
        s.locked_out_until ? (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
            Locked out
          </span>
        ) : (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
              s.is_active
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-slate-100 text-slate-400 border-slate-200"
            }`}
          >
            {s.is_active ? "Active" : "Inactive"}
          </span>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (s) => (
        <Link
          href={`/staff/${s.id}/detail`}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 inline-flex"
        >
          <Icon icon="hugeicons:arrow-right-01" className="text-base" />
        </Link>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Staff
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {mockStaff.filter((s) => s.is_active).length} active &middot;{" "}
            {mockStaff.length} total
          </p>
        </div>
        <Link
          href="/staff/add"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-all"
        >
          <Icon icon="hugeicons:user-add-01" className="text-base" />
          Add Staff
        </Link>
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
            placeholder="Search by name, ID or email…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-400 text-slate-700"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => handleRole(e.target.value)}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none text-slate-700"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r === "all"
                ? "All roles"
                : r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => handleStatus(e.target.value)}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none text-slate-700"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="locked">Locked out</option>
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
        emptyIcon="hugeicons:user-search"
        emptyMessage="No staff found matching your filters"
      />
    </div>
  );
}
