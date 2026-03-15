"use client";

import React, { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import PaginatedTable, {
  type Column,
} from "@/components/commons/paginated-table";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Department {
  id: number;
  ref_code: string;
  name: string;
  description: string;
  staff_count: number;
  created_at: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const mockDepartments: Department[] = [
  {
    id: 1,
    ref_code: "DEP-0001",
    name: "IT",
    description: "Infrastructure, software and systems management.",
    staff_count: 5,
    created_at: "2024-01-10",
  },
  {
    id: 2,
    ref_code: "DEP-0002",
    name: "Operations",
    description: "Day-to-day operational management.",
    staff_count: 8,
    created_at: "2024-01-10",
  },
  {
    id: 3,
    ref_code: "DEP-0003",
    name: "Finance",
    description: "Accounts, payroll and financial reporting.",
    staff_count: 4,
    created_at: "2024-01-10",
  },
  {
    id: 4,
    ref_code: "DEP-0004",
    name: "HR",
    description: "Recruitment, welfare and staff records.",
    staff_count: 3,
    created_at: "2024-01-12",
  },
  {
    id: 5,
    ref_code: "DEP-0005",
    name: "Security",
    description: "Physical security and access management.",
    staff_count: 6,
    created_at: "2024-01-15",
  },
  {
    id: 6,
    ref_code: "DEP-0006",
    name: "Logistics",
    description: "Supply chain and distribution operations.",
    staff_count: 7,
    created_at: "2024-02-01",
  },
  {
    id: 7,
    ref_code: "DEP-0007",
    name: "Sales",
    description: "Client relations and revenue operations.",
    staff_count: 9,
    created_at: "2024-02-10",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const deptColors = [
  "bg-blue-50 text-blue-700 border-blue-100",
  "bg-emerald-50 text-emerald-700 border-emerald-100",
  "bg-violet-50 text-violet-700 border-violet-100",
  "bg-amber-50 text-amber-700 border-amber-100",
  "bg-rose-50 text-rose-700 border-rose-100",
  "bg-teal-50 text-teal-700 border-teal-100",
  "bg-orange-50 text-orange-700 border-orange-100",
];

// ── Dialog ─────────────────────────────────────────────────────────────────────

type DialogMode = "create" | "edit" | "delete" | "detail" | null;

interface DialogState {
  mode: DialogMode;
  dept: Department | null;
}

interface DeptForm {
  name: string;
  description: string;
}

const emptyForm: DeptForm = { name: "", description: "" };

const inputCls =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-white text-slate-800 placeholder:text-slate-400";

// ── Dialog component ───────────────────────────────────────────────────────────

const DepartmentDialog = ({
  state,
  onClose,
  onSave,
  onDelete,
  onRequestEdit,
}: {
  state: DialogState;
  onClose: () => void;
  onSave: (form: DeptForm, id?: number) => void;
  onDelete: (id: number) => void;
  onRequestEdit: (dept: Department) => void;
}) => {
  const { mode, dept } = state;
  const [form, setForm] = useState<DeptForm>(
    mode === "edit" && dept
      ? { name: dept.name, description: dept.description }
      : emptyForm,
  );
  const [saving, setSaving] = useState(false);

  if (!mode) return null;

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    onSave(form, dept?.id);
  };

  const handleDelete = async () => {
    if (!dept) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    onDelete(dept.id);
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
            Delete department?
          </h3>
          <p className="text-sm text-slate-500 mb-1">
            You are about to delete{" "}
            <span className="font-medium text-slate-700">{dept?.name}</span>.
          </p>
          <p className="text-xs text-slate-400 mb-5">
            Staff members in this department will have their department cleared.
            This cannot be undone.
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
  if (mode === "detail" && dept) {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Icon
                  icon="hugeicons:building-04"
                  className="text-sm text-slate-500"
                />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                Department Details
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
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${deptColors[dept.id % deptColors.length]}`}
              >
                {dept.name}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {dept.ref_code}
              </span>
            </div>
            {[
              { label: "Description", value: dept.description || "—" },
              { label: "Staff Members", value: `${dept.staff_count} assigned` },
              {
                label: "Created",
                value: new Date(dept.created_at).toLocaleDateString("en-UG", {
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
              onClick={() => onRequestEdit(dept)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-all"
            >
              <Icon icon="hugeicons:pencil-edit-02" className="text-base" />
              Edit Department
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
              {mode === "create" ? "Create Department" : "Edit Department"}
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
              Department Name <span className="text-red-400">*</span>
            </label>
            <input
              className={inputCls}
              placeholder='e.g. "Operations"'
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
              placeholder="What does this department do?"
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
                ? "Create Department"
                : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialog, setDialog] = useState<DialogState>({ mode: null, dept: null });

  const filtered = useMemo(
    () =>
      departments.filter(
        (d) =>
          !search ||
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.description.toLowerCase().includes(search.toLowerCase()),
      ),
    [departments, search],
  );

  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const openCreate = () => setDialog({ mode: "create", dept: null });
  const openEdit = (dept: Department) => setDialog({ mode: "edit", dept });
  const openDelete = (dept: Department) => setDialog({ mode: "delete", dept });
  const openDetail = (dept: Department) => setDialog({ mode: "detail", dept });
  const closeDialog = () => setDialog({ mode: null, dept: null });

  const handleSave = (form: DeptForm, id?: number) => {
    if (id) {
      setDepartments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...form } : d)),
      );
    } else {
      const newDept: Department = {
        id: Date.now(),
        ref_code: `DEP-${String(departments.length + 1).padStart(4, "0")}`,
        staff_count: 0,
        created_at: new Date().toISOString(),
        ...form,
      };
      setDepartments((prev) => [newDept, ...prev]);
      setPage(1);
    }
    closeDialog();
  };

  const handleDelete = (id: number) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    closeDialog();
  };

  const columns: Column<Department>[] = [
    {
      key: "name",
      header: "Department",
      render: (d) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${deptColors[d.id % deptColors.length]}`}
          >
            {d.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{d.name}</p>
            <p className="text-xs text-slate-400 font-mono">{d.ref_code}</p>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (d) => (
        <p className="text-sm text-slate-500 truncate max-w-xs">
          {d.description || (
            <span className="text-slate-300 italic">No description</span>
          )}
        </p>
      ),
    },
    {
      key: "staff_count",
      header: "Staff",
      render: (d) => (
        <div className="flex items-center gap-1.5">
          <Icon
            icon="hugeicons:user-group"
            className="text-sm text-slate-400"
          />
          <span className="text-sm text-slate-600">{d.staff_count}</span>
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (d) => (
        <span className="text-sm text-slate-400">
          {new Date(d.created_at).toLocaleDateString("en-UG", {
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
      render: (d) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => openDetail(d)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
            title="View details"
          >
            <Icon icon="hugeicons:eye" className="text-base" />
          </button>
          <button
            onClick={() => openEdit(d)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
            title="Edit"
          >
            <Icon icon="hugeicons:pencil-edit-02" className="text-base" />
          </button>
          <button
            onClick={() => openDelete(d)}
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
            Departments
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {departments.length} departments &middot;{" "}
            {departments.reduce((s, d) => s + d.staff_count, 0)} staff assigned
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-all"
        >
          <Icon icon="hugeicons:add-circle" className="text-base" />
          Add Department
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
          placeholder="Search departments…"
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
        emptyIcon="hugeicons:building-04"
        emptyMessage="No departments found"
      />

      {/* Dialog */}
      <DepartmentDialog
        state={dialog}
        onClose={closeDialog}
        onSave={handleSave}
        onDelete={handleDelete}
        onRequestEdit={openEdit}
      />
    </div>
  );
}
