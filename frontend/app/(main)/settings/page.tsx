"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";

// ── Types ──────────────────────────────────────────────────────────
interface Settings {
  device_name: string;
  device_location: string;
  timezone: string;
  unlock_duration_sec: number;
  require_2finger_confirm: boolean;
  allow_unknown_finger_log: boolean;
  buzzer_enabled: boolean;
  buzzer_volume: number;
  lockout_duration_mins: number;
  max_failed_attempts: number;
  max_duration_before_sleep_if_idle: number;
}

interface DeviceInfo {
  serial_number: string;
  device_model: string;
  hardware_version: string;
  firmware_version: string;
}

// ── Mock data ──────────────────────────────────────────────────────
const initialSettings: Settings = {
  device_name: "BAIFAM Device",
  device_location: "Main Entrance",
  timezone: "Africa/Kampala",
  unlock_duration_sec: 3,
  require_2finger_confirm: false,
  allow_unknown_finger_log: false,
  buzzer_enabled: true,
  buzzer_volume: 80,
  lockout_duration_mins: 10,
  max_failed_attempts: 5,
  max_duration_before_sleep_if_idle: 5,
};

const deviceInfo: DeviceInfo = {
  serial_number: "APi-2024-0001",
  device_model: "AccessPi Pro",
  hardware_version: "v1.2.0",
  firmware_version: "v2.4.1",
};

const TIMEZONES = [
  "UTC",
  "Africa/Kampala",
  "Africa/Nairobi",
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Kolkata",
];

// ── Sub-components ─────────────────────────────────────────────────

const SectionHeader = ({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-3 mb-5">
    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
      <Icon icon={icon} className="text-lg text-slate-600" />
    </div>
    <div>
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <p className="text-xs text-slate-400 mt-0.5">{description}</p>
    </div>
  </div>
);

const FieldRow = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start justify-between gap-6 py-3.5 border-b border-slate-100 last:border-0">
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
    <div className="shrink-0 w-64">{children}</div>
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
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
      checked ? "bg-primary" : "bg-slate-200"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const NumberInput = ({
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  suffix?: string;
}) => (
  <div className="flex items-center gap-2">
    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors text-sm"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) =>
          onChange(Math.min(max, Math.max(min, Number(e.target.value))))
        }
        className="w-14 text-center text-sm font-medium text-slate-800 border-x border-slate-200 py-1.5 focus:outline-none bg-white"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors text-sm"
      >
        +
      </button>
    </div>
    {suffix && <span className="text-xs text-slate-400">{suffix}</span>}
  </div>
);

const SliderInput = ({
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  suffix?: string;
}) => (
  <div className="flex items-center gap-3">
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="flex-1 h-1.5 accent-primary cursor-pointer"
    />
    <span className="text-sm font-medium text-slate-700 w-12 text-right">
      {value}
      {suffix}
    </span>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm font-medium text-slate-800 font-mono">
      {value}
    </span>
  </div>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6">
    {children}
  </div>
);

// ── Main Page ──────────────────────────────────────────────────────
export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSaved(false);
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Replace with: await fetch('/api/settings/', { method: 'PATCH', body: JSON.stringify(settings) })
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure your AccessPi device
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-all disabled:opacity-60"
        >
          {saving ? (
            <>
              <Icon
                icon="hugeicons:loading-03"
                className="text-base animate-spin"
              />
              Saving…
            </>
          ) : saved ? (
            <>
              <Icon
                icon="hugeicons:checkmark-circle-02"
                className="text-base"
              />
              Saved
            </>
          ) : (
            <>
              <Icon icon="hugeicons:floppy-disk" className="text-base" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* ── Device Identity ── */}
      <Card>
        <SectionHeader
          icon="hugeicons:building-04"
          title="Device Identity"
          description="Name and location of this access control unit"
        />
        <FieldRow label="Device Name" hint="Shown in the UI and API responses">
          <input
            type="text"
            value={settings.device_name}
            onChange={(e) => update("device_name", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-white text-slate-800"
            placeholder="e.g. Main Entrance"
          />
        </FieldRow>
        <FieldRow label="Location" hint="Physical location of this device">
          <input
            type="text"
            value={settings.device_location}
            onChange={(e) => update("device_location", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-white text-slate-800"
            placeholder="e.g. Ground Floor, Block A"
          />
        </FieldRow>
        <FieldRow
          label="Timezone"
          hint="Affects schedule evaluation and log timestamps"
        >
          <select
            value={settings.timezone}
            onChange={(e) => update("timezone", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-white text-slate-800"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </FieldRow>
      </Card>

      {/* ── Door & Hardware ── */}
      <Card>
        <SectionHeader
          icon="hugeicons:lock-password"
          title="Door & Hardware"
          description="Relay, buzzer and scanner behaviour"
        />
        <FieldRow
          label="Unlock Duration"
          hint="How long the relay stays open after a successful scan"
        >
          <NumberInput
            value={settings.unlock_duration_sec}
            onChange={(v) => update("unlock_duration_sec", v)}
            min={1}
            max={30}
            suffix="seconds"
          />
        </FieldRow>
        <FieldRow label="Buzzer" hint="Audio feedback on every scan result">
          <Toggle
            checked={settings.buzzer_enabled}
            onChange={(v) => update("buzzer_enabled", v)}
          />
        </FieldRow>
        <FieldRow
          label="Buzzer Volume"
          hint="PWM duty cycle — only applies when buzzer is enabled"
        >
          <div
            className={
              settings.buzzer_enabled ? "" : "opacity-40 pointer-events-none"
            }
          >
            <SliderInput
              value={settings.buzzer_volume}
              onChange={(v) => update("buzzer_volume", v)}
              min={0}
              max={100}
              suffix="%"
            />
          </div>
        </FieldRow>
        <FieldRow
          label="Sleep After Idle"
          hint="Minutes of inactivity before the scanner enters low-power mode"
        >
          <NumberInput
            value={settings.max_duration_before_sleep_if_idle}
            onChange={(v) => update("max_duration_before_sleep_if_idle", v)}
            min={1}
            max={5}
            suffix="minutes"
          />
        </FieldRow>
      </Card>

      {/* ── Access & Security ── */}
      <Card>
        <SectionHeader
          icon="hugeicons:shield-key"
          title="Access & Security"
          description="Lockout rules and access control behaviour"
        />
        <FieldRow
          label="Max Failed Attempts"
          hint="Consecutive denied scans before a staff member is locked out"
        >
          <NumberInput
            value={settings.max_failed_attempts}
            onChange={(v) => update("max_failed_attempts", v)}
            min={1}
            max={20}
            suffix="attempts"
          />
        </FieldRow>
        <FieldRow
          label="Lockout Duration"
          hint="How long a staff member stays locked out after too many failures"
        >
          <NumberInput
            value={settings.lockout_duration_mins}
            onChange={(v) => update("lockout_duration_mins", v)}
            min={1}
            max={30}
            suffix="minutes"
          />
        </FieldRow>
        <FieldRow
          label="Log Unknown Fingers"
          hint="Record scan attempts that don't match any enrolled fingerprint"
        >
          <Toggle
            checked={settings.allow_unknown_finger_log}
            onChange={(v) => update("allow_unknown_finger_log", v)}
          />
        </FieldRow>
        <FieldRow
          label="2-Finger Confirmation"
          hint="Sensitive actions (delete fingerprint, deactivate staff) require operator fingerprint scan"
        >
          <Toggle
            checked={settings.require_2finger_confirm}
            onChange={(v) => update("require_2finger_confirm", v)}
          />
        </FieldRow>
      </Card>

      {/* ── Device Info — read only ── */}
      <Card>
        <SectionHeader
          icon="hugeicons:information-circle"
          title="Device Information"
          description="Hardware identifiers — read only, set at manufacture"
        />
        <InfoRow label="Serial Number" value={deviceInfo.serial_number} />
        <InfoRow label="Device Model" value={deviceInfo.device_model} />
        <InfoRow label="Hardware Version" value={deviceInfo.hardware_version} />
        <InfoRow label="Firmware Version" value={deviceInfo.firmware_version} />
      </Card>

      {/* ── Danger Zone ── */}
      <div className="bg-white rounded-2xl border border-red-100 p-6">
        <SectionHeader
          icon="hugeicons:alert-02"
          title="Danger Zone"
          description="Irreversible actions — proceed with caution"
        />
        <div className="flex items-center justify-between py-3 border-b border-red-50">
          <div>
            <p className="text-sm font-medium text-slate-700">
              Reset to Factory Defaults
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Restores all settings above to their original values. Does not
              affect enrolled fingerprints or staff.
            </p>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors shrink-0 ml-6">
            Reset Settings
          </button>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-slate-700">Restart Device</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Reboots the Raspberry Pi. All services restart automatically.
            </p>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors shrink-0 ml-6">
            Restart
          </button>
        </div>
      </div>
    </div>
  );
}
