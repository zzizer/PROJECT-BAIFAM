"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Fingerprint {
  id: number;
  scanner_id: number;
  finger: string;
  label: string;
  enrolled_at: string;
}

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
];

const roleColors: Record<string, string> = {
  admin: "bg-violet-50 text-violet-700 border-violet-100",
  manager: "bg-blue-50 text-blue-700 border-blue-100",
  employee: "bg-slate-100 text-slate-600 border-slate-200",
  security: "bg-amber-50 text-amber-700 border-amber-100",
  visitor: "bg-teal-50 text-teal-700 border-teal-100",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  fingerprint_count: 2,
  has_access: true,
  notes: "Primary IT administrator. Has full access rights.",
  created_at: "2024-01-10",
  locked_out_until: null,
};

const mockPermission = {
  is_allowed: true,
  access_start_time: "08:00",
  access_end_time: "18:00",
  allowed_days: "0,1,2,3,4",
  valid_from: null,
  valid_until: null,
};

const mockFingerprints: Fingerprint[] = [
  {
    id: 1,
    scanner_id: 0,
    finger: "right_thumb",
    label: "Primary",
    enrolled_at: "2024-01-10",
  },
  {
    id: 2,
    scanner_id: 1,
    finger: "left_index",
    label: "Secondary",
    enrolled_at: "2024-01-11",
  },
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const fingerLabel = (f: string) =>
  f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide shrink-0">
      {label}
    </span>
    <span className="text-sm text-slate-800 text-right">{value}</span>
  </div>
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

export default function StaffDetailPage() {
  const params = useParams();
  const id = params?.id;
  const staff = mockStaff; // replace: const staff = await fetchStaff(id)
  const perm = mockPermission;
  const fps = mockFingerprints;

  const allowedDays = perm.allowed_days
    ? perm.allowed_days.split(",").map(Number)
    : [];

  const [deletingFp, setDeletingFp] = useState<number | null>(null);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
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
          <span className="text-slate-800 font-medium">{staff.full_name}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/staff/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700"
          >
            <Icon icon="hugeicons:pencil-edit-02" className="text-base" />
            Edit
          </Link>
          <Link
            href={`/fingerprints/enroll?staff=${id}`}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-all"
          >
            <Icon icon="hugeicons:finger-print" className="text-base" />
            Enroll Finger
          </Link>
        </div>
      </div>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4 flex-wrap">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 ${avatarColors[staff.id % avatarColors.length]}`}
        >
          {getInitials(staff.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-800">
              {staff.full_name}
            </h2>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${roleColors[staff.role]}`}
            >
              {staff.role}
            </span>
            {staff.locked_out_until ? (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                Locked out
              </span>
            ) : (
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${staff.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"}`}
              >
                {staff.is_active ? "Active" : "Inactive"}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1 font-mono">
            {staff.employee_id}
          </p>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {[
              { icon: "hugeicons:mail-01", label: staff.email },
              { icon: "hugeicons:call", label: staff.phone },
              { icon: "hugeicons:building-04", label: staff.department },
              {
                icon: "hugeicons:finger-print",
                label: `${staff.fingerprint_count} fingerprints`,
              },
            ].map((item) => (
              <span
                key={item.label}
                className="flex items-center gap-1 text-xs text-slate-400"
              >
                <Icon icon={item.icon} className="text-sm" />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal info */}
        <SectionCard title="Personal Information" icon="hugeicons:user-03">
          <InfoRow label="Full Name" value={staff.full_name} />
          <InfoRow label="Email" value={staff.email} />
          <InfoRow label="Phone" value={staff.phone} />
          <InfoRow
            label="Role"
            value={
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${roleColors[staff.role]}`}
              >
                {staff.role}
              </span>
            }
          />
          <InfoRow label="Department" value={staff.department} />
          <InfoRow label="Member Since" value={staff.created_at} />
          {staff.notes && <InfoRow label="Notes" value={staff.notes} />}
        </SectionCard>

        {/* Access permission */}
        <SectionCard title="Access Permission" icon="hugeicons:shield-key">
          <InfoRow
            label="Access"
            value={
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${perm.is_allowed ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}
              >
                {perm.is_allowed ? "Allowed" : "Revoked"}
              </span>
            }
          />
          <InfoRow
            label="Allowed Days"
            value={
              <div className="flex gap-1 flex-wrap justify-end">
                {DAYS.map((d, i) => (
                  <span
                    key={d}
                    className={`w-8 h-8 rounded-lg text-xs font-medium flex items-center justify-center border ${
                      allowedDays.includes(i)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-slate-100 text-slate-400 border-slate-200"
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>
            }
          />
          <InfoRow
            label="Time Window"
            value={`${perm.access_start_time} — ${perm.access_end_time}`}
          />
          <InfoRow
            label="Valid From"
            value={perm.valid_from ?? "No restriction"}
          />
          <InfoRow
            label="Valid Until"
            value={perm.valid_until ?? "No restriction"}
          />
        </SectionCard>
      </div>

      {/* Fingerprints */}
      <SectionCard title="Enrolled Fingerprints" icon="hugeicons:finger-print">
        {fps.length === 0 ? (
          <div className="text-center py-10">
            <Icon
              icon="hugeicons:finger-print"
              className="text-4xl text-slate-200 mx-auto mb-3"
            />
            <p className="text-sm text-slate-400">
              No fingerprints enrolled yet
            </p>
            <Link
              href={`/fingerprints/enroll?staff=${id}`}
              className="mt-3 text-sm text-primary hover:underline font-medium inline-block"
            >
              Enroll first fingerprint →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fps.map((fp) => (
              <div
                key={fp.id}
                className="flex items-center gap-3 p-3.5 border border-slate-200 rounded-xl bg-slate-50"
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <Icon
                    icon="hugeicons:finger-print"
                    className="text-base text-slate-500"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {fp.label || fingerLabel(fp.finger)}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {fingerLabel(fp.finger)} · Slot {fp.scanner_id}
                  </p>
                </div>
                <button
                  onClick={() => setDeletingFp(fp.id)}
                  className="p-1.5 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-lg transition-colors shrink-0"
                >
                  <Icon icon="hugeicons:delete-02" className="text-base" />
                </button>
              </div>
            ))}
            <Link
              href={`/fingerprints/enroll?staff=${id}`}
              className="flex items-center justify-center gap-2 p-3.5 border border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-primary hover:text-primary transition-colors"
            >
              <Icon icon="hugeicons:add-circle" className="text-base" />
              <span className="text-sm">Enroll another</span>
            </Link>
          </div>
        )}
      </SectionCard>

      {/* Delete fingerprint confirm */}
      {deletingFp !== null && (
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
              This removes the template from the scanner permanently. The staff
              member will need to re-enroll.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingFp(null)}
                className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => setDeletingFp(null)}
                className="flex-1 px-4 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">Danger Zone</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-600">Remove this staff member</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Permanently deletes the staff record and all enrolled
              fingerprints.
            </p>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors shrink-0">
            Delete Staff
          </button>
        </div>
      </div>
    </div>
  );
}
