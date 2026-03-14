"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";

// ── Types ──────────────────────────────────────────────────────────
interface AdminProfile {
  username: string;
  full_name: string;
  created_at: string;
}

// ── Mock ──────────────────────────────────────────────────────────
const mockProfile: AdminProfile = {
  username: "admin",
  full_name: "Samuel Okello",
  created_at: "2024-01-10T09:00:00",
};

// ── Helpers ────────────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-white text-slate-800 disabled:bg-slate-50 disabled:text-slate-400";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// ── Sub-components ─────────────────────────────────────────────────
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

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
      {label}
    </label>
    {children}
  </div>
);

const Toast = ({
  message,
  type,
}: {
  message: string;
  type: "success" | "error";
}) => (
  <div
    className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium z-50 transition-all ${
      type === "success"
        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
        : "bg-red-50 border-red-200 text-red-700"
    }`}
  >
    <Icon
      icon={
        type === "success"
          ? "hugeicons:checkmark-circle-02"
          : "hugeicons:alert-circle"
      }
      className="text-base shrink-0"
    />
    {message}
  </div>
);

// ── Page ──────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [profile, setProfile] = useState<AdminProfile>(mockProfile);
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Save profile ───────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profile.full_name.trim()) return;
    setSavingProfile(true);
    // PATCH /api/users/profile/
    await new Promise((r) => setTimeout(r, 800));
    setSavingProfile(false);
    showToast("Profile updated successfully.", "success");
  };

  // ── Change password ────────────────────────────────────────────
  const pwError = (() => {
    if (passwords.new_password && passwords.new_password.length < 8)
      return "Password must be at least 8 characters.";
    if (
      passwords.new_password &&
      passwords.confirm_password &&
      passwords.new_password !== passwords.confirm_password
    )
      return "Passwords do not match.";
    return null;
  })();

  const canSavePw =
    passwords.current_password &&
    passwords.new_password.length >= 8 &&
    passwords.new_password === passwords.confirm_password;

  const handleSavePw = async () => {
    if (!canSavePw) return;
    setSavingPw(true);
    // POST /api/users/change-password/
    await new Promise((r) => setTimeout(r, 900));
    setSavingPw(false);
    setPasswords({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
    showToast("Password changed successfully.", "success");
  };

  const PasswordInput = ({
    id,
    placeholder,
    value,
    onChange,
    show,
    onToggle,
  }: {
    id: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggle: () => void;
  }) => (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        className={`${inputCls} pr-10`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        <Icon
          icon={show ? "hugeicons:view-off-slash" : "hugeicons:view"}
          width={16}
          height={16}
        />
      </button>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          My Profile
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your account details and password
        </p>
      </div>

      {/* Avatar + identity */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold shrink-0">
          {getInitials(profile.full_name || profile.username)}
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">
            {profile.full_name || profile.username}
          </p>
          <p className="text-sm text-slate-500 mt-0.5 font-mono">
            @{profile.username}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Member since{" "}
            {new Date(profile.created_at).toLocaleDateString("en-UG", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="ml-auto">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
            Administrator
          </span>
        </div>
      </div>

      {/* Profile details */}
      <SectionCard title="Account Details" icon="hugeicons:user-03">
        <div className="space-y-4">
          <Field label="Full Name">
            <input
              className={inputCls}
              value={profile.full_name}
              onChange={(e) =>
                setProfile((p) => ({ ...p, full_name: e.target.value }))
              }
              placeholder="Your full name"
            />
          </Field>
          <Field label="Username">
            <input className={inputCls} value={profile.username} disabled />
          </Field>

          <div className="pt-1">
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile || !profile.full_name.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-all disabled:opacity-60"
            >
              {savingProfile ? (
                <Icon
                  icon="hugeicons:loading-03"
                  className="animate-spin text-base"
                />
              ) : (
                <Icon icon="hugeicons:floppy-disk" className="text-base" />
              )}
              {savingProfile ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Change password */}
      <SectionCard title="Change Password" icon="hugeicons:lock-password">
        <div className="space-y-4">
          <Field label="Current Password">
            <PasswordInput
              id="current"
              placeholder="Enter current password"
              value={passwords.current_password}
              onChange={(v) =>
                setPasswords((p) => ({ ...p, current_password: v }))
              }
              show={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
            />
          </Field>

          <Field label="New Password">
            <PasswordInput
              id="new"
              placeholder="At least 8 characters"
              value={passwords.new_password}
              onChange={(v) => setPasswords((p) => ({ ...p, new_password: v }))}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
            />
          </Field>

          <Field label="Confirm New Password">
            <PasswordInput
              id="confirm"
              placeholder="Repeat new password"
              value={passwords.confirm_password}
              onChange={(v) =>
                setPasswords((p) => ({ ...p, confirm_password: v }))
              }
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
            />
          </Field>

          {/* Inline error */}
          {pwError && (
            <div className="flex items-center gap-2 text-xs text-red-600">
              <Icon
                icon="hugeicons:alert-circle"
                className="text-sm shrink-0"
              />
              {pwError}
            </div>
          )}

          {/* Strength indicator */}
          {passwords.new_password.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => {
                  const strength = (() => {
                    let s = 0;
                    if (passwords.new_password.length >= 8) s++;
                    if (/[A-Z]/.test(passwords.new_password)) s++;
                    if (/[0-9]/.test(passwords.new_password)) s++;
                    if (/[^A-Za-z0-9]/.test(passwords.new_password)) s++;
                    return s;
                  })();
                  return (
                    <div
                      key={level}
                      className={`flex-1 h-1 rounded-full transition-colors ${
                        level <= strength
                          ? strength <= 1
                            ? "bg-red-400"
                            : strength <= 2
                              ? "bg-amber-400"
                              : strength <= 3
                                ? "bg-blue-400"
                                : "bg-emerald-400"
                          : "bg-slate-100"
                      }`}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-slate-400">
                {(() => {
                  let s = 0;
                  if (passwords.new_password.length >= 8) s++;
                  if (/[A-Z]/.test(passwords.new_password)) s++;
                  if (/[0-9]/.test(passwords.new_password)) s++;
                  if (/[^A-Za-z0-9]/.test(passwords.new_password)) s++;
                  return ["", "Weak", "Fair", "Good", "Strong"][s];
                })()}
              </p>
            </div>
          )}

          <div className="pt-1">
            <button
              onClick={handleSavePw}
              disabled={savingPw || !canSavePw}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-all disabled:opacity-60"
            >
              {savingPw ? (
                <Icon
                  icon="hugeicons:loading-03"
                  className="animate-spin text-base"
                />
              ) : (
                <Icon icon="hugeicons:lock-password" className="text-base" />
              )}
              {savingPw ? "Updating…" : "Update Password"}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Session info */}
      <SectionCard title="Session" icon="hugeicons:clock-01">
        <div className="space-y-3">
          {[
            { label: "Signed in as", value: profile.username },
            { label: "Role", value: "Administrator" },
            { label: "Session", value: "Active" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
            >
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                {label}
              </span>
              <span className="text-sm text-slate-700">{value}</span>
            </div>
          ))}

          <div className="pt-2">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
              <Icon icon="hugeicons:logout-square-01" className="text-base" />
              Sign Out
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
