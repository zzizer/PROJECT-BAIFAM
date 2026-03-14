"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const ROLES = ["employee", "manager", "security", "admin", "visitor"];
const DEPARTMENTS = ["IT", "Operations", "Finance", "HR", "Security"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const inputCls =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-white text-slate-800";

// Mock — replace with fetch(`/api/users/staff/${id}/`)
const mockStaff = {
  id: 1,
  employee_id: "EMP-0001",
  full_name: "Samuel Okello",
  email: "samuel@co.ug",
  phone: "+256 700 100001",
  role: "admin",
  department: "IT",
  is_active: true,
  notes: "Primary IT administrator.",
};

const mockPermission = {
  is_allowed: true,
  access_start_time: "08:00",
  access_end_time: "18:00",
  allowed_days: "0,1,2,3,4",
  valid_from: "",
  valid_until: "",
};

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

export default function StaffEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...mockStaff });
  const [perm, setPerm] = useState({ ...mockPermission });

  const allowedDays = perm.allowed_days
    ? perm.allowed_days.split(",").map(Number)
    : [];

  const toggleDay = (i: number) => {
    const next = allowedDays.includes(i)
      ? allowedDays.filter((d) => d !== i)
      : [...allowedDays, i].sort();
    setPerm((p) => ({ ...p, allowed_days: next.join(",") }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    router.push(`/staff/${id}/detail`);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/staff"
            className="hover:text-slate-800 transition-colors flex items-center gap-1"
          >
            <Icon icon="hugeicons:arrow-left-01" className="text-base" />
            Staff
          </Link>
          <Icon icon="hugeicons:arrow-right-01" className="text-xs" />
          <Link
            href={`/staff/${id}/detail`}
            className="hover:text-slate-800 transition-colors"
          >
            {form.full_name}
          </Link>
          <Icon icon="hugeicons:arrow-right-01" className="text-xs" />
          <span className="text-slate-800 font-medium">Edit</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/staff/${id}/detail`}
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

      {/* Personal info */}
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
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
            />
          </Field>
          <Field label="Role">
            <select
              className={inputCls}
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Department">
            <select
              className={inputCls}
              value={form.department}
              onChange={(e) =>
                setForm((p) => ({ ...p, department: e.target.value }))
              }
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
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
                placeholder="Optional notes…"
              />
            </Field>
          </div>
          <div className="sm:col-span-2 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-700">Active</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Inactive staff cannot access the door regardless of permissions
              </p>
            </div>
            <Toggle
              checked={form.is_active}
              onChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
            />
          </div>
        </div>
      </SectionCard>

      {/* Access permission */}
      <SectionCard title="Access Permission" icon="hugeicons:shield-key">
        <div className="space-y-5">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Access Allowed
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Master switch — overrides all schedule rules
              </p>
            </div>
            <Toggle
              checked={perm.is_allowed}
              onChange={(v) => setPerm((p) => ({ ...p, is_allowed: v }))}
            />
          </div>

          <div
            className={`space-y-5 ${!perm.is_allowed ? "opacity-40 pointer-events-none" : ""}`}
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

            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-2 gap-3">
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
