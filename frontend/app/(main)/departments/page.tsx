"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Icon } from "@iconify/react";
import PaginatedTable, {
  type Column,
} from "@/components/commons/paginated-table";
import { Department } from "@/types";
import {
  useDepartmentList,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from "@/hooks";

// ── Types ──────────────────────────────────────────────────────────────────────

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

const inputCls =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-white text-slate-800 placeholder:text-slate-400";

// ── Dialog Component ───────────────────────────────────────────────────────────

const DepartmentDialog = ({
  state,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onRequestEdit,
}: {
  state: DialogState;
  onClose: () => void;
  onCreate: (form: DeptForm) => Promise<void>;
  onUpdate: (uuid: string, form: DeptForm) => Promise<void>;
  onDelete: (uuid: string) => Promise<void>;
  onRequestEdit: (dept: Department) => void;
}) => {
  const { mode, dept } = state;
  const [form, setForm] = useState<DeptForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens/changes
  useEffect(() => {
    if (mode === "edit" && dept) {
      setForm({
        name: dept.name,
        description: dept.description ?? "",
      });
    } else if (mode === "create") {
      setForm(emptyForm);
    }
  }, [mode, dept]);

  if (!mode) return null;

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (mode === "edit" && dept?.internal_base_uuid) {
        await onUpdate(dept.internal_base_uuid, form);
      } else {
        await onCreate(form);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save department:", error);
      // You can add toast notification here later
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!dept?.internal_base_uuid) return;
    setSaving(true);
    try {
      await onDelete(dept.internal_base_uuid);
      onClose();
    } catch (error) {
      console.error("Failed to delete department:", error);
    } finally {
      setSaving(false);
    }
  };

  // Delete Confirmation Dialog
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
            This action cannot be undone.
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

  // Detail View
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
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  deptColors[dept.id % deptColors.length]
                }`}
              >
                {dept.name}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {dept.ref_code}
              </span>
            </div>

            {[
              { label: "Description", value: dept.description || "—" },
              {
                label: "Staff Members",
                value:
                  dept.staff_count != null
                    ? `${dept.staff_count} assigned`
                    : "—",
              },
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

  // Create / Edit Form
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

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function DepartmentsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialog, setDialog] = useState<DialogState>({ mode: null, dept: null });

  const params = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: search.trim() || undefined,
    }),
    [page, pageSize, search],
  );

  // Queries & Mutations — ALL at top level
  const { data, isLoading, isFetching } = useDepartmentList(params);

  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const departments: Department[] = data?.results ?? [];
  const total = data?.count ?? 0;

  const openCreate = () => setDialog({ mode: "create", dept: null });
  const openEdit = (dept: Department) => setDialog({ mode: "edit", dept });
  const openDelete = (dept: Department) => setDialog({ mode: "delete", dept });
  const openDetail = (dept: Department) => setDialog({ mode: "detail", dept });
  const closeDialog = () => setDialog({ mode: null, dept: null });

  const handleCreate = async (form: DeptForm) => {
    await createMutation.mutateAsync(form);
  };

  const handleUpdate = async (uuid: string, form: DeptForm) => {
    await updateMutation.mutateAsync({ uuid, data: form });
  };

  const handleDelete = async (uuid: string) => {
    await deleteMutation.mutateAsync(uuid);
  };

  const columns: Column<Department>[] = [
    {
      key: "name",
      header: "Department",
      render: (d) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${
              deptColors[d.id % deptColors.length]
            }`}
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
          <span className="text-sm text-slate-600">{d.staff_count ?? "—"}</span>
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
            {total} department{total !== 1 ? "s" : ""}
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
        data={departments}
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
        emptyIcon="hugeicons:building-04"
        emptyMessage="No departments found"
      />

      {/* Dialog */}
      <DepartmentDialog
        state={dialog}
        onClose={closeDialog}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onRequestEdit={openEdit}
      />
    </div>
  );
}
