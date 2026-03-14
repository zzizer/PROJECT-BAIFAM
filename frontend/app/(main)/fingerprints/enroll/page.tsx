"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────
type EnrollStep =
  | "idle"
  | "scanning_first"
  | "lift"
  | "scanning_second"
  | "done"
  | "error";

interface StaffOption {
  id: number;
  employee_id: string;
  full_name: string;
  role: string;
  fingerprint_count: number;
}

const FINGER_OPTIONS = [
  { value: "right_thumb", label: "Right Thumb" },
  { value: "right_index", label: "Right Index" },
  { value: "right_middle", label: "Right Middle" },
  { value: "right_ring", label: "Right Ring" },
  { value: "right_little", label: "Right Little" },
  { value: "left_thumb", label: "Left Thumb" },
  { value: "left_index", label: "Left Index" },
  { value: "left_middle", label: "Left Middle" },
  { value: "left_ring", label: "Left Ring" },
  { value: "left_little", label: "Left Little" },
];

const mockStaff: StaffOption[] = [
  {
    id: 1,
    employee_id: "EMP-0001",
    full_name: "Samuel Okello",
    role: "admin",
    fingerprint_count: 2,
  },
  {
    id: 2,
    employee_id: "EMP-0002",
    full_name: "Grace Nakato",
    role: "manager",
    fingerprint_count: 1,
  },
  {
    id: 3,
    employee_id: "EMP-0003",
    full_name: "Brian Mutesasira",
    role: "employee",
    fingerprint_count: 2,
  },
  {
    id: 4,
    employee_id: "EMP-0004",
    full_name: "Alice Namutebi",
    role: "employee",
    fingerprint_count: 1,
  },
  {
    id: 5,
    employee_id: "EMP-0005",
    full_name: "David Ssemakula",
    role: "security",
    fingerprint_count: 3,
  },
  {
    id: 6,
    employee_id: "EMP-0006",
    full_name: "Ruth Namukasa",
    role: "employee",
    fingerprint_count: 1,
  },
  {
    id: 7,
    employee_id: "EMP-0007",
    full_name: "Moses Kiggundu",
    role: "visitor",
    fingerprint_count: 1,
  },
  {
    id: 8,
    employee_id: "EMP-0008",
    full_name: "Esther Nalwoga",
    role: "employee",
    fingerprint_count: 2,
  },
];

const stepMessages: Record<
  EnrollStep,
  { icon: string; title: string; description: string; color: string }
> = {
  idle: {
    icon: "hugeicons:finger-print",
    title: "Ready to enroll",
    description: "Select a staff member and finger, then press Start.",
    color: "text-slate-400",
  },
  scanning_first: {
    icon: "hugeicons:finger-print",
    title: "Place finger on scanner",
    description: "Hold your finger firmly on the scanner and keep it still.",
    color: "text-blue-500",
  },
  lift: {
    icon: "hugeicons:hand-pointing-up",
    title: "First scan captured — lift finger",
    description: "Remove your finger from the scanner.",
    color: "text-amber-500",
  },
  scanning_second: {
    icon: "hugeicons:finger-print",
    title: "Place the same finger again",
    description: "Place the same finger on the scanner to confirm.",
    color: "text-blue-500",
  },
  done: {
    icon: "hugeicons:checkmark-circle-02",
    title: "Fingerprint enrolled!",
    description:
      "The fingerprint has been saved to the scanner and linked to the staff member.",
    color: "text-emerald-500",
  },
  error: {
    icon: "hugeicons:alert-circle",
    title: "Enrollment failed",
    description: "The scans did not match. Please try again.",
    color: "text-red-500",
  },
};

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

// ── Scanner visualiser ─────────────────────────────────────────────
const ScannerVisual = ({ step }: { step: EnrollStep }) => {
  const isScanning = step === "scanning_first" || step === "scanning_second";
  const isDone = step === "done";
  const isError = step === "error";
  const isLift = step === "lift";

  return (
    <div className="flex flex-col items-center justify-center py-10 select-none">
      <div
        className={`relative w-36 h-36 rounded-3xl border-2 flex items-center justify-center transition-all duration-500 ${
          isScanning
            ? "border-blue-300 bg-blue-50"
            : isDone
              ? "border-emerald-300 bg-emerald-50"
              : isError
                ? "border-red-300 bg-red-50"
                : isLift
                  ? "border-amber-300 bg-amber-50"
                  : "border-slate-200 bg-slate-50"
        }`}
      >
        {/* Pulse ring — only while scanning */}
        {isScanning && (
          <>
            <span className="absolute inset-0 rounded-3xl border-2 border-blue-300 animate-ping opacity-40" />
            <span className="absolute inset-[-8px] rounded-[28px] border border-blue-200 animate-pulse opacity-30" />
          </>
        )}

        <Icon
          icon={stepMessages[step].icon}
          className={`text-6xl transition-all duration-300 ${stepMessages[step].color}`}
        />
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-2 mt-6">
        {(
          ["scanning_first", "lift", "scanning_second", "done"] as EnrollStep[]
        ).map((s, i) => {
          const steps: EnrollStep[] = [
            "scanning_first",
            "lift",
            "scanning_second",
            "done",
          ];
          const currentIdx = steps.indexOf(step);
          const active = i <= currentIdx && step !== "idle" && step !== "error";
          return (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                active ? "w-6 bg-primary" : "w-1.5 bg-slate-200"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────
export default function EnrollPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedStaffId = searchParams?.get("staff");

  const [staffId, setStaffId] = useState<number | "">(
    preselectedStaffId ? Number(preselectedStaffId) : "",
  );
  const [finger, setFinger] = useState("right_thumb");
  const [label, setLabel] = useState("");
  const [step, setStep] = useState<EnrollStep>("idle");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedStaff = mockStaff.find((s) => s.id === staffId);
  const isRunning = step !== "idle" && step !== "done" && step !== "error";
  const inputCls =
    "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-white text-slate-800 disabled:bg-slate-50 disabled:text-slate-400";

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const simulateEnrollment = () => {
    // In production: POST /api/fingerprints/enroll/ → get session id
    // Then open a WebSocket to /ws/enroll/{session_id}/ and listen for steps
    // Here we simulate the flow with timeouts

    setStep("scanning_first");

    timerRef.current = setTimeout(() => {
      setStep("lift");

      timerRef.current = setTimeout(() => {
        setStep("scanning_second");

        timerRef.current = setTimeout(() => {
          // 90% success rate in simulation
          if (Math.random() > 0.1) {
            setStep("done");
          } else {
            setStep("error");
          }
        }, 2500);
      }, 1500);
    }, 2500);
  };

  const handleStart = () => {
    if (!staffId || isRunning) return;
    simulateEnrollment();
  };

  const handleReset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep("idle");
  };

  const handleCancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (selectedStaff) {
      router.push(`/staff/${staffId}/detail`);
    } else {
      router.push("/fingerprints");
    }
  };

  const msg = stepMessages[step];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          href="/fingerprints"
          className="hover:text-slate-800 transition-colors flex items-center gap-1"
        >
          <Icon icon="hugeicons:arrow-left-01" className="text-base" />
          Fingerprints
        </Link>
        <Icon icon="hugeicons:arrow-right-01" className="text-xs" />
        <span className="text-slate-800 font-medium">Enroll Fingerprint</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left — configuration */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                <Icon
                  icon="hugeicons:user-03"
                  className="text-sm text-slate-500"
                />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                Enrollment Details
              </h3>
            </div>
            <div className="p-5 space-y-4">
              {/* Staff selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Staff Member <span className="text-red-400">*</span>
                </label>
                <select
                  className={inputCls}
                  value={staffId}
                  onChange={(e) =>
                    setStaffId(e.target.value ? Number(e.target.value) : "")
                  }
                  disabled={isRunning}
                >
                  <option value="">Select staff member…</option>
                  {mockStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected staff preview */}
              {selectedStaff && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColors[selectedStaff.id % avatarColors.length]}`}
                  >
                    {getInitials(selectedStaff.full_name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedStaff.full_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {selectedStaff.fingerprint_count} fingerprint
                      {selectedStaff.fingerprint_count !== 1 ? "s" : ""} already
                      enrolled
                    </p>
                  </div>
                </div>
              )}

              {/* Finger */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Finger <span className="text-red-400">*</span>
                </label>
                <select
                  className={inputCls}
                  value={finger}
                  onChange={(e) => setFinger(e.target.value)}
                  disabled={isRunning}
                >
                  {FINGER_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Label */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Label <span className="text-slate-300">(optional)</span>
                </label>
                <input
                  className={inputCls}
                  placeholder='e.g. "Primary", "Backup"'
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  disabled={isRunning}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {step === "idle" || step === "error" ? (
              <button
                onClick={handleStart}
                disabled={!staffId}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon icon="hugeicons:finger-print" className="text-base" />
                {step === "error" ? "Try Again" : "Start Enrollment"}
              </button>
            ) : step === "done" ? (
              <>
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-all"
                >
                  <Icon icon="hugeicons:add-circle" className="text-base" />
                  Enroll Another
                </button>
                {selectedStaff && (
                  <Link
                    href={`/staff/${staffId}/detail`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Icon icon="hugeicons:user-03" className="text-base" />
                    View Staff Profile
                  </Link>
                )}
              </>
            ) : (
              <button
                onClick={handleCancel}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Icon icon="hugeicons:cancel-circle" className="text-base" />
                Cancel
              </button>
            )}

            {step === "idle" && (
              <button
                onClick={handleCancel}
                className="w-full px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 transition-colors text-center"
              >
                Go back
              </button>
            )}
          </div>
        </div>

        {/* Right — scanner feedback */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
              <Icon icon="hugeicons:cpu" className="text-sm text-slate-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Scanner</h3>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-400">Connected</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-5 pb-6">
            <ScannerVisual step={step} />

            <div className="text-center mt-2 space-y-1.5 px-4">
              <p className={`text-base font-semibold ${msg.color}`}>
                {msg.title}
              </p>
              <p className="text-sm text-slate-500 leading-relaxed">
                {msg.description}
              </p>
            </div>

            {/* Step labels */}
            {step !== "idle" && (
              <div className="mt-6 w-full space-y-2">
                {[
                  { key: "scanning_first", label: "First scan" },
                  { key: "scanning_second", label: "Second scan" },
                  { key: "done", label: "Saved" },
                ].map(({ key, label: stepLabel }) => {
                  const order: EnrollStep[] = [
                    "scanning_first",
                    "lift",
                    "scanning_second",
                    "done",
                  ];
                  const stepIdx = order.indexOf(step as EnrollStep);
                  const targetIdx = order.indexOf(key as EnrollStep);
                  const done = stepIdx > targetIdx || step === "done";
                  const active =
                    step === key ||
                    (key === "scanning_first" && step === "lift");

                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        active
                          ? "bg-blue-50 border border-blue-100"
                          : done
                            ? "bg-emerald-50 border border-emerald-100"
                            : "bg-slate-50 border border-slate-100"
                      }`}
                    >
                      <Icon
                        icon={
                          done
                            ? "hugeicons:checkmark-circle-02"
                            : active
                              ? "hugeicons:loading-03"
                              : "hugeicons:circle"
                        }
                        className={`text-base shrink-0 ${
                          done
                            ? "text-emerald-500"
                            : active
                              ? "text-blue-500 animate-spin"
                              : "text-slate-300"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          done
                            ? "text-emerald-700"
                            : active
                              ? "text-blue-700"
                              : "text-slate-400"
                        }`}
                      >
                        {stepLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
