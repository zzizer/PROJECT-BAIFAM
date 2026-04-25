"use client";

import React, { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import PaginatedTable, {
  type Column,
} from "@/components/commons/paginated-table";
import { useStaffList } from "@/hooks";
import type { Staff } from "@/types";

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

const roleColors: Record<string, string> = {
  admin: "bg-violet-50 text-violet-700 border-violet-100",
  manager: "bg-blue-50 text-blue-700 border-blue-100",
  employee: "bg-slate-100 text-slate-600 border-slate-200",
  security: "bg-amber-50 text-amber-700 border-amber-100",
  visitor: "bg-teal-50 text-teal-700 border-teal-100",
};

export default function StaffPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const params = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: search.trim() || undefined,
      role: roleFilter || undefined,
    }),
    [page, pageSize, search, roleFilter],
  );

  const { data, isLoading, isFetching } = useStaffList(params);

  const staffList: Staff[] = data?.results ?? [];
  const total = data?.count ?? 0;

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const columns: Column<Staff>[] = [
    {
      key: "staff",
      header: "Staff Member",
      render: (s) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
              avatarColors[s.id % avatarColors.length]
            }`}
          >
            {getInitials(s.full_name)}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{s.full_name}</p>
            <p className="text-xs text-slate-400 font-mono">
              {s.ref_code || `STF-${s.id.toString().padStart(4, "0")}`}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (s) => {
        const roleName = s.role?.name || "—";
        return <span className="text-sm text-slate-700">{roleName}</span>;
      },
    },
    {
      key: "department",
      header: "Department",
      render: (s) => (
        <span className="text-sm text-slate-600">
          {s.department?.name || "—"}
        </span>
      ),
    },
    {
      key: "fingerprints",
      header: "Fingerprints",
      render: (s) => {
        // Safe length check
        const count = Array.isArray(s.fingerprints) ? s.fingerprints.length : 0;
        return (
          <div className="flex items-center gap-1.5">
            <Icon
              icon="hugeicons:finger-print"
              className="text-sm text-slate-400"
            />
            <span className="text-sm text-slate-600">{count}</span>
          </div>
        );
      },
    },
    {
      key: "access",
      header: "Access",
      render: (s) => {
        const hasAccess =
          s.access_permission?.is_allowed ??
          s.access_config?.is_allowed ??
          true;

        return (
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
              hasAccess
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}
          >
            {hasAccess ? "Allowed" : "Revoked"}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (s) => (
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
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
          href={`/staff/${s.internal_base_uuid}/detail`}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 inline-flex"
          title="View details"
        >
          <Icon icon="hugeicons:arrow-right-01" className="text-base" />
        </Link>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Staff
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} staff members</p>
        </div>
        <Link
          href="/staff/add"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-all"
        >
          <Icon icon="hugeicons:user-add-01" className="text-base" />
          Add Staff
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-72">
          <Icon
            icon="hugeicons:search-01"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base"
          />
          <input
            type="text"
            placeholder="Search by name, ref code or email…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-400 text-slate-700"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => handleRoleFilter(e.target.value)}
          className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none text-slate-700 min-w-40"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="employee">Employee</option>
          <option value="security">Security</option>
          <option value="visitor">Visitor</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none text-slate-700"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <PaginatedTable
        data={staffList}
        columns={columns}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        loading={isLoading || isFetching}
        emptyIcon="hugeicons:user-search"
        emptyMessage="No staff members found"
      />
    </div>
  );
}
