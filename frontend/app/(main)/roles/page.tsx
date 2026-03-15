"use client";

import React, { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import PaginatedTable, {
  type Column,
} from "@/components/commons/paginated-table";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Role {
  id: number;
  ref_code: string;
  name: string;
  description: string;
  staff_count: number;
  created_at: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const mockRoles: Role[] = [
  {
    id: 1,
    ref_code: "ROL-0001",
    name: "Admin",
    description: "Full system access and configuration rights.",
    staff_count: 2,
    created_at: "2024-01-10",
  },
  {
    id: 2,
    ref_code: "ROL-0002",
    name: "Manager",
    description: "Manage staff and view reports.",
    staff_count: 4,
    created_at: "2024-01-10",
  },
  {
    id: 3,
    ref_code: "ROL-0003",
    name: "Employee",
    description: "Standard door access during working hours.",
    staff_count: 18,
    created_at: "2024-01-10",
  },
  {
    id: 4,
    ref_code: "ROL-0004",
    name: "Security",
    description: "24-hour door access for security personnel.",
    staff_count: 3,
    created_at: "2024-01-12",
  },
  {
    id: 5,
    ref_code: "ROL-0005",
    name: "Visitor",
    description: "Temporary, time-limited access.",
    staff_count: 1,
    created_at: "2024-02-05",
  },
  {
    id: 6,
    ref_code: "ROL-0006",
    name: "Contractor",
    description: "Project-based access with expiry.",
    staff_count: 5,
    created_at: "2024-03-01",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const roleColors = [
  "bg-violet-50 text-violet-700 border-violet-100",
  "bg-blue-50 text-blue-700 border-blue-100",
  "bg-slate-100 text-slate-600 border-slate-200",
  "bg-amber-50 text-amber-700 border-amber-100",
  "bg-teal-50 text-teal-700 border-teal-100",
  "bg-rose-50 text-rose-700 border-rose-100",
];

// ── Dialog ─────────────────────────────────────────────────────────────────────

type DialogMode = "create" | "edit" | "delete" | "detail" | null;

interface DialogState {
  mode: DialogMode;
  role: Role | null;
}

// ── Form fields ────────────────────────────────────────────────────────────────

interface RoleForm {
  name: string;
  description: string;
}

const emptyForm: RoleForm = { name: "", description: "" };

const inputCls =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-white text-slate-800 placeholder:text-slate-400";

// ── Dialog component ───────────────────────────────────────────────────────────

const RoleDialog = ({
  state,
  onClose,
  onSave,
  onDelete,
}: {
  state: DialogState;
  onClose: () => void;
  onSave: (form: RoleForm, id?: number) => void;
  onDelete: (id: number) => void;
}) => {
  const { mode, role } = state;
  const [form, setForm] = useState<RoleForm>(
    mode === "edit" && role
      ? { name: role.name, description: role.description }
      : emptyForm,
  );
  const [saving, setSaving] = useState(false);

  if (!mode) return null;

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    onSave(form, role?.id);
  };

  const handleDelete = async () => {
    if (!role) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    onDelete(role.id);
  };

  // ── Delete confirmation ──
  if (mode === "delete") {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-4">
            <Icon icon="hugeicons:delete-02" className="text-xl text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            Delete role?
          </h3>
          <p className="text-sm text-slate-500 mb-1">
            You are about to delete{" "}
            <span className="font-medium text-slate-700">{role?.name}</span>.
          </p>
          <p className="text-xs text-slate-400 mb-5">
            Staff members assigned this role will have their role cleared. This
            cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-60"
            >
              {saving ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Detail view ──
  if (mode === "detail" && role) {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Icon
                  icon="hugeicons:shield-user"
                  className="text-sm text-slate-500"
                />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                Role Details
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            >
              <Icon icon="hugeicons:cancel-01" className="text-base" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${roleColors[role.id % roleColors.length]}`}
              >
                {role.name}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {role.ref_code}
              </span>
            </div>
            {[
              { label: "Description", value: role.description || "—" },
              { label: "Staff Members", value: `${role.staff_count} assigned` },
              {
                label: "Created",
                value: new Date(role.created_at).toLocaleDateString("en-UG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0"
              >
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide shrink-0">
                  {label}
                </span>
                <span className="text-sm text-slate-700 text-right">
                  {value}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700"
            >
              Close
            </button>
            <button
              onClick={() =>
                onSave(
                  { name: role.name, description: role.description },
                  role.id,
                )
              }
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-all"
            >
              <Icon icon="hugeicons:pencil-edit-02" className="text-base" />
              Edit Role
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Create / Edit form ──
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Icon
                icon={
                  mode === "create"
                    ? "hugeicons:add-circle"
                    : "hugeicons:pencil-edit-02"
                }
                className="text-sm text-slate-500"
              />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              {mode === "create" ? "Create Role" : "Edit Role"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
          >
            <Icon icon="hugeicons:cancel-01" className="text-base" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Role Name <span className="text-red-400">*</span>
            </label>
            <input
              className={inputCls}
              placeholder='e.g. "Security"'
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Description
            </label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Describe what access this role grants…"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-all disabled:opacity-60"
          >
            {saving ? (
              <Icon
                icon="hugeicons:loading-03"
                className="animate-spin text-base"
              />
            ) : (
              <Icon
                icon={
                  mode === "create"
                    ? "hugeicons:add-circle"
                    : "hugeicons:floppy-disk"
                }
                className="text-base"
              />
            )}
            {saving
              ? "Saving…"
              : mode === "create"
                ? "Create Role"
                : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialog, setDialog] = useState<DialogState>({ mode: null, role: null });

  const filtered = useMemo(
    () =>
      roles.filter(
        (r) =>
          !search ||
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.description.toLowerCase().includes(search.toLowerCase()),
      ),
    [roles, search],
  );

  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const openCreate = () => setDialog({ mode: "create", role: null });
  const openEdit = (role: Role) => setDialog({ mode: "edit", role });
  const openDelete = (role: Role) => setDialog({ mode: "delete", role });
  const openDetail = (role: Role) => setDialog({ mode: "detail", role });
  const closeDialog = () => setDialog({ mode: null, role: null });

  const handleSave = (form: RoleForm, id?: number) => {
    if (id) {
      setRoles((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...form } : r)),
      );
    } else {
      const newRole: Role = {
        id: Date.now(),
        ref_code: `ROL-${String(roles.length + 1).padStart(4, "0")}`,
        staff_count: 0,
        created_at: new Date().toISOString(),
        ...form,
      };
      setRoles((prev) => [newRole, ...prev]);
      setPage(1);
    }
    closeDialog();
  };

  const handleDelete = (id: number) => {
    setRoles((prev) => prev.filter((r) => r.id !== id));
    closeDialog();
  };

  const columns: Column<Role>[] = [
    {
      key: "name",
      header: "Role",
      render: (r) => (
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${roleColors[r.id % roleColors.length]}`}
          >
            {r.name}
          </span>
          <span className="text-xs text-slate-400 font-mono hidden sm:block">
            {r.ref_code}
          </span>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (r) => (
        <p className="text-sm text-slate-500 truncate max-w-xs">
          {r.description || (
            <span className="text-slate-300 italic">No description</span>
          )}
        </p>
      ),
    },
    {
      key: "staff_count",
      header: "Staff",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <Icon
            icon="hugeicons:user-group"
            className="text-sm text-slate-400"
          />
          <span className="text-sm text-slate-600">{r.staff_count}</span>
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (r) => (
        <span className="text-sm text-slate-400">
          {new Date(r.created_at).toLocaleDateString("en-UG", {
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
      render: (r) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => openDetail(r)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
            title="View details"
          >
            <Icon icon="hugeicons:eye" className="text-base" />
          </button>
          <button
            onClick={() => openEdit(r)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
            title="Edit"
          >
            <Icon icon="hugeicons:pencil-edit-02" className="text-base" />
          </button>
          <button
            onClick={() => openDelete(r)}
            className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400"
            title="Delete"
          >
            <Icon icon="hugeicons:delete-02" className="text-base" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Roles
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {roles.length} roles &middot;{" "}
            {roles.reduce((s, r) => s + r.staff_count, 0)} staff assigned
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-all"
        >
          <Icon icon="hugeicons:add-circle" className="text-base" />
          Add Role
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Icon
          icon="hugeicons:search-01"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base"
        />
        <input
          type="text"
          placeholder="Search roles…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-400 text-slate-700"
        />
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
        emptyIcon="hugeicons:shield-user"
        emptyMessage="No roles found"
      />

      {/* Dialog */}
      <RoleDialog
        state={dialog}
        onClose={closeDialog}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
