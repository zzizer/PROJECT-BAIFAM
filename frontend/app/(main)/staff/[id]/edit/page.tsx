"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useStaffDetail,
  useUpdateStaff,
  useRoleList,
  useDepartmentList,
} from "@/hooks";
import { toast } from "sonner";
const inputCls =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-white text-slate-800";

const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-primary" : "bg-slate-200"}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
    />
  </button>
);

const SectionCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
        <Icon icon={icon} className="text-sm text-slate-500" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function StaffEditPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params?.id as string;

  const updateStaff = useUpdateStaff();

  // Fetch current staff data
  const { data: staff, isLoading } = useStaffDetail(staffId);

  // Fetch roles and departments for dropdowns
  const { data: rolesData } = useRoleList({ page_size: 100 });
  const { data: departmentsData } = useDepartmentList({ page_size: 100 });

  const roles = rolesData?.results ?? [];
  const departments = departmentsData?.results ?? [];

  // Form state
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    role_uuid: "",
    department_uuid: "",
    is_active: true,
    notes: "",
  });

  const [perm, setPerm] = useState({
    is_allowed: true,
    access_start_time: "08:00",
    access_end_time: "18:00",
    allowed_days: "0,1,2,3,4",
    valid_from: "",
    valid_until: "",
  });

  const [saving, setSaving] = useState(false);

  // Populate form when staff data loads
  useEffect(() => {
    if (staff) {
      setForm({
        full_name: staff.full_name,
        email: staff.email || "",
        phone_number: staff.phone_number || "",
        role_uuid: staff.role?.internal_base_uuid || "",
        department_uuid: staff.department?.internal_base_uuid || "",
        is_active: staff.is_active,
        notes: staff.notes || "",
      });

      const access = staff.access_config || {};
      setPerm({
        is_allowed: access.is_allowed ?? true,
        access_start_time: access.access_start_time || "08:00",
        access_end_time: access.access_end_time || "18:00",
        allowed_days: access.allowed_days || "0,1,2,3,4",
        valid_from: access.valid_from || "",
        valid_until: access.valid_until || "",
      });
    }
  }, [staff]);

  const allowedDays = perm.allowed_days
    ? perm.allowed_days.split(",").map(Number)
    : [];

  const toggleDay = (i: number) => {
    const next = allowedDays.includes(i)
      ? allowedDays.filter((d) => d !== i)
      : [...allowedDays, i].sort((a, b) => a - b);
    setPerm((p) => ({ ...p, allowed_days: next.join(",") }));
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) return;

    setSaving(true);

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim() || undefined,
      phone_number: form.phone_number.trim() || undefined,
      role_uuid: form.role_uuid || undefined,
      department_uuid: form.department_uuid || undefined,
      is_active: form.is_active,
      notes: form.notes.trim() || undefined,
      access_permission: {
        is_allowed: perm.is_allowed,
        access_start_time: perm.access_start_time || null,
        access_end_time: perm.access_end_time || null,
        allowed_days: perm.allowed_days,
        valid_from: perm.valid_from || null,
        valid_until: perm.valid_until || null,
      },
    };

    try {
      await updateStaff.mutateAsync({
        uuid: staffId,
        data: payload,
      });

      toast.success("Staff updated successfully!");
      router.push(`/staff/${staffId}/detail`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update staff. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !staff) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Loading staff data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/staff"
            className="hover:text-slate-800 flex items-center gap-1"
          >
            <Icon icon="hugeicons:arrow-left-01" className="text-base" />
            Staff
          </Link>
          <Icon icon="hugeicons:arrow-right-01" className="text-xs" />
          <Link
            href={`/staff/${staffId}/detail`}
            className="hover:text-slate-800"
          >
            {staff.full_name}
          </Link>
          <Icon icon="hugeicons:arrow-right-01" className="text-xs" />
          <span className="text-slate-800 font-medium">Edit</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/staff/${staffId}`}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || !form.full_name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-all disabled:opacity-60"
          >
            {saving ? (
              <Icon
                icon="hugeicons:loading-03"
                className="animate-spin text-base"
              />
            ) : (
              <Icon icon="hugeicons:floppy-disk" className="text-base" />
            )}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Personal Information */}
      <SectionCard title="Personal Information" icon="hugeicons:user-03">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Full Name" required>
              <input
                className={inputCls}
                value={form.full_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, full_name: e.target.value }))
                }
                placeholder="e.g. Samuel Okello"
              />
            </Field>
          </div>

          <Field label="Email Address">
            <input
              className={inputCls}
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
            />
          </Field>

          <Field label="Phone Number">
            <input
              className={inputCls}
              value={form.phone_number}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone_number: e.target.value }))
              }
            />
          </Field>

          <Field label="Role">
            <select
              className={inputCls}
              value={form.role_uuid}
              onChange={(e) =>
                setForm((p) => ({ ...p, role_uuid: e.target.value }))
              }
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option
                  key={role.internal_base_uuid}
                  value={role.internal_base_uuid}
                >
                  {role.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Department">
            <select
              className={inputCls}
              value={form.department_uuid}
              onChange={(e) =>
                setForm((p) => ({ ...p, department_uuid: e.target.value }))
              }
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option
                  key={dept.internal_base_uuid}
                  value={dept.internal_base_uuid}
                >
                  {dept.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea
                className={`${inputCls} resize-none`}
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Optional notes about this staff member…"
              />
            </Field>
          </div>

          <div className="sm:col-span-2 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Active Status
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Inactive staff cannot access the door
              </p>
            </div>
            <Toggle
              checked={form.is_active}
              onChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
            />
          </div>
        </div>
      </SectionCard>

      {/* Access Permission */}
      <SectionCard title="Access Permission" icon="hugeicons:shield-key">
        <div className="space-y-5">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Access Allowed
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Master switch — overrides all rules
              </p>
            </div>
            <Toggle
              checked={perm.is_allowed}
              onChange={(v) => setPerm((p) => ({ ...p, is_allowed: v }))}
            />
          </div>

          <div
            className={!perm.is_allowed ? "opacity-40 pointer-events-none" : ""}
          >
            <Field label="Allowed Days">
              <div className="flex gap-1.5 flex-wrap mt-1">
                {DAYS.map((day, i) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`w-10 h-10 rounded-lg text-xs font-medium border transition-all ${
                      allowedDays.includes(i)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <Field label="Access From">
                <input
                  type="time"
                  className={inputCls}
                  value={perm.access_start_time}
                  onChange={(e) =>
                    setPerm((p) => ({
                      ...p,
                      access_start_time: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Access Until">
                <input
                  type="time"
                  className={inputCls}
                  value={perm.access_end_time}
                  onChange={(e) =>
                    setPerm((p) => ({ ...p, access_end_time: e.target.value }))
                  }
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Field label="Valid From">
                <input
                  type="date"
                  className={inputCls}
                  value={perm.valid_from}
                  onChange={(e) =>
                    setPerm((p) => ({ ...p, valid_from: e.target.value }))
                  }
                />
              </Field>
              <Field label="Valid Until">
                <input
                  type="date"
                  className={inputCls}
                  value={perm.valid_until}
                  onChange={(e) =>
                    setPerm((p) => ({ ...p, valid_until: e.target.value }))
                  }
                />
              </Field>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
