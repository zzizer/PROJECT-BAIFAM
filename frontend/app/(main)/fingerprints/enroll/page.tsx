"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useStaffList, useStaffDetail } from "@/hooks";
import { FINGERPRINTS_API } from "@/lib/api";
import type { Staff } from "@/types";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────
type EnrollStep =
  | "idle"
  | "scanning_first"
  | "lift"
  | "scanning_second"
  | "done"
  | "error";

interface WSMessage {
  type: "status" | "instruction" | "success" | "error";
  message: string;
  slot?: number;
  staff_base_uuid?: string;
}

// ── Constants ──────────────────────────────────────────────────────
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
    description: "Something went wrong. Please try again.",
    color: "text-red-500",
  },
};

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

function buildWsUrl(token: string): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  const httpBase = apiUrl.replace(/\/api\/?$/, "");
  const wsBase = httpBase.replace(/^http/, "ws");
  return `${wsBase}/ws/scanner/?token=${encodeURIComponent(token)}`;
}

// ── Scanner Visual ─────────────────────────────────────────────────
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

      {/* Progress dots */}
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

// ── Staff Search Dropdown ──────────────────────────────────────────
interface StaffDropdownProps {
  value: string;
  onChange: (uuid: string) => void;
  disabled: boolean;
  inputCls: string;
}

const StaffDropdown = ({
  value,
  onChange,
  disabled,
  inputCls,
}: StaffDropdownProps) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching } = useStaffList({
    page,
    page_size: 20,
    search: search.trim() || undefined,
  });

  const [allStaff, setAllStaff] = useState<Staff[]>([]);

  // Reset accumulated list when search changes
  useEffect(() => {
    setAllStaff([]);
    setPage(1);
  }, [search]);

  // Accumulate pages
  useEffect(() => {
    if (data?.results) {
      setAllStaff((prev) =>
        page === 1 ? data.results : [...prev, ...data.results],
      );
    }
  }, [data?.results, page]);

  const hasMore = data?.next !== null && data?.next !== undefined;

  const handleScroll = useCallback(() => {
    if (!listRef.current || isFetching || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop <= clientHeight + 60) {
      setPage((p) => p + 1);
    }
  }, [isFetching, hasMore]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = allStaff.find((s) => s.internal_base_uuid === value);

  // If we have a preselected value but it's not in current page, fetch it separately
  const { data: preselectedStaff } = useStaffDetail(
    value && !selected ? value : "",
    { enabled: !!(value && !selected && !open) },
  );

  const displayStaff = selected ?? preselectedStaff ?? null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`${inputCls} flex items-center justify-between gap-2 text-left`}
      >
        {displayStaff ? (
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                avatarColors[displayStaff.id % avatarColors.length]
              }`}
            >
              {getInitials(displayStaff.full_name)}
            </div>
            <span className="truncate text-slate-800">
              {displayStaff.full_name}
            </span>
            <span className="text-slate-400 font-mono text-xs shrink-0">
              {displayStaff.ref_code}
            </span>
          </div>
        ) : (
          <span className="text-slate-400">Select staff member…</span>
        )}
        <Icon
          icon="hugeicons:arrow-down-01"
          className={`text-slate-400 text-sm shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Icon
                icon="hugeicons:search-01"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
              />
              <input
                autoFocus
                type="text"
                placeholder="Search staff…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-slate-700"
              />
            </div>
          </div>

          {/* List */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="max-h-56 overflow-y-auto"
          >
            {isLoading && page === 1 ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Icon
                  icon="hugeicons:loading-03"
                  className="animate-spin text-lg mr-2"
                />
                <span className="text-sm">Loading...</span>
              </div>
            ) : allStaff.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No staff found
              </div>
            ) : (
              allStaff.map((s) => (
                <button
                  key={s.internal_base_uuid}
                  type="button"
                  onClick={() => {
                    onChange(s.internal_base_uuid);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left ${
                    s.internal_base_uuid === value ? "bg-slate-50" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                      avatarColors[s.id % avatarColors.length]
                    }`}
                  >
                    {getInitials(s.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {s.full_name}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      {s.ref_code}
                    </p>
                  </div>
                  {s.internal_base_uuid === value && (
                    <Icon
                      icon="hugeicons:checkmark-circle-02"
                      className="text-primary text-base shrink-0"
                    />
                  )}
                </button>
              ))
            )}

            {isFetching && page > 1 && (
              <div className="flex items-center justify-center py-3 text-slate-400">
                <Icon
                  icon="hugeicons:loading-03"
                  className="animate-spin text-sm mr-1.5"
                />
                <span className="text-xs">Loading more…</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────
export default function EnrollPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Query param is the staff's internal_base_uuid
  const preselectedUuid = searchParams?.get("staff") ?? "";

  const [staffUuid, setStaffUuid] = useState<string>(preselectedUuid);
  const [finger, setFinger] = useState("right_thumb");
  const [label, setLabel] = useState("");
  const [step, setStep] = useState<EnrollStep>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [slot, setSlot] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  const { data: selectedStaff } = useStaffDetail(staffUuid, {
    enabled: !!staffUuid,
  });

  const isRunning = step !== "idle" && step !== "done" && step !== "error";
  const inputCls =
    "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-white text-slate-800 disabled:bg-slate-50 disabled:text-slate-400";

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const createFingerprintRecord = async (
    slotNumber: number,
    staffBaseUuid: string,
  ) => {
    setIsSaving(true);
    try {
      await FINGERPRINTS_API.create({
        staff: staffBaseUuid,
        finger_index: finger,
        slot: slotNumber,
        ...(label.trim() ? { label: label.trim() } : {}),
      });
      toast.success("Fingerprint saved successfully");
    } catch (err) {
      toast.error("Fingerprint enrolled on scanner but failed to save record");
      console.error("Failed to save fingerprint record:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const connectWebSocket = useCallback(() => {
    if (!staffUuid) return;

    // Simplified version - no token for now
    const wsUrl = buildWsUrl("ABC123"); // or modify buildWsUrl temporarily

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected");

      ws.send(
        JSON.stringify({
          command: "start_enroll",
          staff_base_uuid: staffUuid,
          finger_type: finger,
          label: label.trim() || null,
        }),
      );
    };

    ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        console.log("Received from server:", data);

        switch (data.type) {
          case "instruction": {
            const msg = data.message.toLowerCase();
            if (msg.includes("first")) setStep("scanning_first");
            else if (msg.includes("lift")) setStep("lift");
            else if (msg.includes("same") || msg.includes("again"))
              setStep("scanning_second");
            break;
          }

          case "success": {
            const resolvedSlot = data.slot ?? null;
            setStep("done");
            setSlot(resolvedSlot);

            if (resolvedSlot !== null) {
              createFingerprintRecord(
                resolvedSlot,
                data.staff_base_uuid ?? staffUuid,
              );
            }
            break;
          }

          case "error":
            setStep("error");
            setErrorMessage(data.message);
            break;
        }
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    };

    ws.onerror = () => {
      setStep("error");
      setErrorMessage("Connection error with scanner.");
    };

    ws.onclose = () => {
      wsRef.current = null;
    };
  }, [staffUuid, finger, label]);

  const handleStart = () => {
    if (!staffUuid || isRunning) return;
    setStep("scanning_first");
    setErrorMessage("");
    setSlot(null);
    connectWebSocket();
  };

  const handleReset = () => {
    wsRef.current?.close();
    wsRef.current = null;
    setStep("idle");
    setErrorMessage("");
    setSlot(null);
  };

  const handleCancel = () => {
    wsRef.current?.close();
    if (staffUuid) {
      router.push(`/staff/${staffUuid}/detail`);
    } else {
      router.push("/fingerprints");
    }
  };

  const msg = stepMessages[step];
  const fingerprintCount = Array.isArray(selectedStaff?.fingerprints)
    ? selectedStaff.fingerprints.length
    : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
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
        {/* ── Left — configuration ── */}
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
                <StaffDropdown
                  value={staffUuid}
                  onChange={setStaffUuid}
                  disabled={isRunning}
                  inputCls={inputCls}
                />
              </div>

              {/* Selected staff preview */}
              {selectedStaff && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                      avatarColors[selectedStaff.id % avatarColors.length]
                    }`}
                  >
                    {getInitials(selectedStaff.full_name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedStaff.full_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {fingerprintCount} fingerprint
                      {fingerprintCount !== 1 ? "s" : ""} already enrolled
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
                disabled={!staffUuid}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon icon="hugeicons:finger-print" className="text-base" />
                {step === "error" ? "Try Again" : "Start Enrollment"}
              </button>
            ) : step === "done" ? (
              <>
                <button
                  onClick={handleReset}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-all disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <Icon
                        icon="hugeicons:loading-03"
                        className="text-base animate-spin"
                      />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Icon icon="hugeicons:add-circle" className="text-base" />
                      Enroll Another
                    </>
                  )}
                </button>
                {selectedStaff && (
                  <Link
                    href={`/staff/${staffUuid}/detail`}
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

        {/* ── Right — scanner feedback ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
              <Icon icon="hugeicons:cpu" className="text-sm text-slate-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Scanner</h3>
            <div className="ml-auto flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRunning
                    ? "bg-blue-500 animate-pulse"
                    : step === "error"
                      ? "bg-red-500"
                      : "bg-emerald-500"
                }`}
              />
              <span className="text-xs text-slate-400">
                {isRunning ? "Working…" : step === "error" ? "Error" : "Ready"}
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-5 pb-6">
            <ScannerVisual step={step} />

            <div className="text-center mt-2 space-y-1.5 px-4">
              <p className={`text-base font-semibold ${msg.color}`}>
                {msg.title}
              </p>
              <p className="text-sm text-slate-500 leading-relaxed">
                {step === "error"
                  ? errorMessage || msg.description
                  : msg.description}
              </p>
              {step === "done" && slot !== null && (
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Scanner slot: {slot}
                </p>
              )}
            </div>

            {/* Step progress rows */}
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
