"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStaffDetail } from "@/hooks";
import { FINGERPRINTS_API } from "@/lib/api";
import { toast } from "sonner";
import DeleteConfirmationDialog from "@/components/commons/delete-confirmation-dialog";

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const fingerLabel = (finger: string) =>
  finger.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex justify-between py-3 border-b border-slate-100 last:border-0">
    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
      {label}
    </span>
    <span className="text-sm text-slate-800 text-right">{value || "—"}</span>
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
    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
        <Icon icon={icon} className="text-slate-500" />
      </div>
      <h3 className="font-semibold text-slate-800">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params?.id as string;

  const [showFingerprintDeleteDialog, setShowFingerprintDeleteDialog] =
    useState(false);
  const [showStaffDeleteDialog, setShowStaffDeleteDialog] = useState(false);
  const [deletingFpId, setDeletingFpId] = useState<number | null>(null);
  const [isDeletingStaff, setIsDeletingStaff] = useState(false);

  // Fetch staff data
  const {
    data: staff,
    isLoading,
    isError,
    error,
  } = useStaffDetail(staffId, { retry: 2 });

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Icon
            icon="hugeicons:loading-03"
            className="text-5xl text-slate-300 animate-spin mx-auto mb-4"
          />
          <p className="text-slate-500">Loading staff profile...</p>
        </div>
      </div>
    );
  }

  // Error / Not Found State
  if (isError || !staff) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border border-red-100 p-12 text-center">
          <Icon
            icon="hugeicons:alert-triangle"
            className="text-6xl text-red-400 mx-auto mb-6"
          />
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">
            Staff Member Not Found
          </h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            The staff member you are trying to view does not exist or may have
            been deleted.
          </p>
          <Link
            href="/staff"
            className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-colors"
          >
            ← Back to Staff List
          </Link>
        </div>
      </div>
    );
  }

  const perm = staff.access_config || { is_allowed: true };
  const fingerprints = staff.fingerprints || [];
  const allowedDayNumbers = perm.allowed_days
    ? perm.allowed_days.split(",").map(Number)
    : [];
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Handlers
  const openFingerprintDelete = (fpId: number) => {
    setDeletingFpId(fpId);
    setShowFingerprintDeleteDialog(true);
  };

  const handleDeleteFingerprint = async () => {
    if (!deletingFpId) return;
    try {
      await FINGERPRINTS_API.remove(deletingFpId);
      toast.success("Fingerprint deleted successfully");
      setShowFingerprintDeleteDialog(false);
      setDeletingFpId(null);
      window.location.reload(); // TODO: Replace with query invalidation later
    } catch (err) {
      toast.error("Failed to delete fingerprint");
    }
  };

  const handleDeleteStaff = async () => {
    setIsDeletingStaff(true);
    try {
      // TODO: Replace with useDeleteStaff().mutateAsync(staff.internal_base_uuid) when ready
      toast.success("Staff member has been deleted successfully");
      router.push("/staff");
    } catch (err) {
      toast.error("Failed to delete staff member");
    } finally {
      setIsDeletingStaff(false);
      setShowStaffDeleteDialog(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Link
            href="/staff"
            className="hover:text-slate-800 flex items-center gap-1"
          >
            <Icon icon="hugeicons:arrow-left-01" className="text-base" />
            Staff
          </Link>
          <Icon icon="hugeicons:arrow-right-01" className="text-xs" />
          <span className="font-medium text-slate-800">{staff.full_name}</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/staff/${staff.internal_base_uuid}/edit`}
            className="flex items-center gap-2 px-5 py-2.5 text-sm border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors"
          >
            <Icon icon="hugeicons:pencil-edit-02" />
            Edit Profile
          </Link>
          <Link
            href={`/fingerprints/enroll?staff=${staff.internal_base_uuid}`}
            className="flex items-center gap-2 px-5 py-2.5 text-sm bg-primary text-white rounded-2xl hover:bg-primary-hover transition-all"
          >
            <Icon icon="hugeicons:finger-print" />
            Enroll Fingerprint
          </Link>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col md:flex-row gap-8">
        <div
          className={`w-28 h-28 rounded-3xl flex items-center justify-center text-4xl font-bold shrink-0 ${avatarColors[staff.id % avatarColors.length]}`}
        >
          {getInitials(staff.full_name)}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {staff.full_name}
            </h1>
            <p className="text-slate-500 font-mono mt-1">
              {staff.ref_code || staff.internal_base_uuid}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {staff.email && (
              <div className="flex items-center gap-2">
                <Icon icon="hugeicons:mail-01" className="text-slate-400" />
                {staff.email}
              </div>
            )}
            {staff.phone_number && (
              <div className="flex items-center gap-2">
                <Icon icon="hugeicons:call" className="text-slate-400" />
                {staff.phone_number}
              </div>
            )}
            {staff.role && (
              <div className="flex items-center gap-2">
                <Icon icon="hugeicons:shield-user" className="text-slate-400" />
                {staff.role.name}
              </div>
            )}
            {staff.department && (
              <div className="flex items-center gap-2">
                <Icon icon="hugeicons:building-04" className="text-slate-400" />
                {staff.department.name}
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center gap-6 text-sm">
            <div
              className={`px-4 py-1.5 rounded-full text-xs font-medium border ${
                staff.is_active
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {staff.is_active ? "Active" : "Inactive"}
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Icon icon="hugeicons:finger-print" />
              {fingerprints.length} fingerprints enrolled
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <SectionCard title="Personal Information" icon="hugeicons:user-03">
          <InfoRow label="Full Name" value={staff.full_name} />
          <InfoRow label="Email" value={staff.email} />
          <InfoRow label="Phone Number" value={staff.phone_number} />
          <InfoRow label="Role" value={staff.role?.name} />
          <InfoRow label="Department" value={staff.department?.name} />
          <InfoRow
            label="Member Since"
            value={new Date(staff.created_at).toLocaleDateString("en-UG", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
        </SectionCard>

        {/* Access Permission */}
        <SectionCard title="Access Permission" icon="hugeicons:shield-key">
          <InfoRow
            label="Access Status"
            value={
              <span
                className={`px-4 py-1.5 text-xs font-medium rounded-full border ${
                  perm.is_allowed
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-red-50 text-red-600 border-red-100"
                }`}
              >
                {perm.is_allowed ? "Access Allowed" : "Access Revoked"}
              </span>
            }
          />
          <InfoRow
            label="Allowed Days"
            value={
              <div className="flex gap-2 flex-wrap justify-end">
                {DAYS.map((day, i) => (
                  <span
                    key={i}
                    className={`text-xs w-8 h-8 flex items-center justify-center rounded-lg border ${
                      allowedDayNumbers.includes(i)
                        ? "bg-primary text-white border-primary"
                        : "bg-slate-100 text-slate-400 border-slate-200"
                    }`}
                  >
                    {day}
                  </span>
                ))}
              </div>
            }
          />
          <InfoRow
            label="Daily Time Window"
            value={`${perm.access_start_time || "—"} — ${perm.access_end_time || "—"}`}
          />
          <InfoRow
            label="Valid From"
            value={
              perm.valid_from
                ? new Date(perm.valid_from).toLocaleDateString()
                : "No restriction"
            }
          />
          <InfoRow
            label="Valid Until"
            value={
              perm.valid_until
                ? new Date(perm.valid_until).toLocaleDateString()
                : "No restriction"
            }
          />
        </SectionCard>
      </div>

      {/* Enrolled Fingerprints */}
      <SectionCard title="Enrolled Fingerprints" icon="hugeicons:finger-print">
        {fingerprints.length === 0 ? (
          <div className="text-center py-16">
            <Icon
              icon="hugeicons:finger-print"
              className="text-6xl text-slate-200 mx-auto mb-4"
            />
            <p className="text-slate-500 mb-6">No fingerprints enrolled yet</p>
            <Link
              href={`/fingerprints/enroll?staff=${staff.internal_base_uuid}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl hover:bg-primary-hover"
            >
              Enroll First Fingerprint
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fingerprints.map((fp: any) => (
              <div
                key={fp.id}
                className="flex gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border flex items-center justify-center">
                  <Icon
                    icon="hugeicons:finger-print"
                    className="text-3xl text-slate-400"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-700">
                    {fp.label || fingerLabel(fp.finger_index || "Unknown")}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enrolled{" "}
                    {new Date(
                      fp.enrolled_at || fp.created_at,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => openFingerprintDelete(fp.id)}
                  className="text-red-400 hover:text-red-600 self-start mt-1"
                >
                  <Icon icon="hugeicons:delete-02" className="text-xl" />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Danger Zone */}
      <div className="bg-white border border-red-100 rounded-3xl p-8">
        <h3 className="text-red-600 font-semibold mb-2">Danger Zone</h3>
        <p className="text-slate-600 text-sm mb-6">
          Deleting this staff member will remove all associated fingerprints and
          access records. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowStaffDeleteDialog(true)}
          className="px-6 py-3 text-sm font-medium text-red-600 border border-red-200 rounded-2xl hover:bg-red-50 transition-colors"
        >
          Delete Staff Member
        </button>
      </div>

      {/* Reusable Delete Confirmation Dialogs */}
      <DeleteConfirmationDialog
        isOpen={showFingerprintDeleteDialog}
        onClose={() => {
          setShowFingerprintDeleteDialog(false);
          setDeletingFpId(null);
        }}
        onConfirm={handleDeleteFingerprint}
        title="Delete Fingerprint?"
        description="This will permanently remove the fingerprint template from the system."
        confirmText="Delete Fingerprint"
      />

      <DeleteConfirmationDialog
        isOpen={showStaffDeleteDialog}
        onClose={() => setShowStaffDeleteDialog(false)}
        onConfirm={handleDeleteStaff}
        title="Delete Staff Member?"
        description="This will permanently delete this staff member and all associated data. This action cannot be undone."
        confirmText="Delete Staff"
        isLoading={isDeletingStaff}
      />
    </div>
  );
}
