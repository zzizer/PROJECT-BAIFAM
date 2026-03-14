"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import PaginatedTable, { Column } from "@/components/commons/paginated-table";

// ── Types ──────────────────────────────────────────────────────────
interface APIKey {
  id: number;
  name: string;
  prefix: string;
  scopes: string[];
  active: boolean;
  expired: boolean;
  expires: string | null;
  lastUsed: string | null;
  created: string;
  calls: number;
}

// ── Constants ──────────────────────────────────────────────────────
const ALL_SCOPES = [
  { v: "read:logs", l: "Read logs", d: "GET /api/logs/" },
  { v: "write:logs", l: "Write logs", d: "POST /api/logs/" },
  { v: "read:staff", l: "Read staff", d: "GET /api/users/staff/" },
  { v: "write:staff", l: "Write staff", d: "POST/PUT /api/staff/" },
  { v: "delete:staff", l: "Delete staff", d: "DELETE /api/staff/:id" },
  { v: "read:status", l: "Read status", d: "GET /api/status/" },
  { v: "read:settings", l: "Read settings", d: "GET /api/settings/" },
  { v: "write:settings", l: "Write settings", d: "PUT /api/settings/" },
  {
    v: "read:fingerprints",
    l: "Read fingerprints",
    d: "GET /api/fingerprints/",
  },
  {
    v: "write:fingerprints",
    l: "Write fingerprints",
    d: "POST /api/fingerprints/",
  },
  { v: "read:visitors", l: "Read visitors", d: "GET /api/visitors/" },
  { v: "write:visitors", l: "Write visitors", d: "POST /api/visitors/" },
  { v: "read:devices", l: "Read devices", d: "GET /api/devices/" },
  { v: "write:devices", l: "Write devices", d: "PUT /api/devices/" },
  { v: "read:reports", l: "Read reports", d: "GET /api/reports/" },
  { v: "export:data", l: "Export data", d: "POST /api/export/" },
  { v: "admin:keys", l: "Admin keys", d: "Full API key mgmt" },
];

const SCOPE_COLORS = [
  "bg-blue-50 text-blue-800 border-blue-200",
  "bg-emerald-50 text-emerald-800 border-emerald-200",
  "bg-amber-50 text-amber-800 border-amber-200",
  "bg-violet-50 text-violet-800 border-violet-200",
  "bg-pink-50 text-pink-800 border-pink-200",
  "bg-red-50 text-red-800 border-red-200",
  "bg-green-50 text-green-800 border-green-200",
  "bg-orange-50 text-orange-800 border-orange-200",
  "bg-slate-100 text-slate-700 border-slate-200",
];

const scopeColor = (s: string) =>
  SCOPE_COLORS[ALL_SCOPES.findIndex((x) => x.v === s) % SCOPE_COLORS.length];

const MOCK_KEYS: APIKey[] = [
  {
    id: 1,
    name: "HR System Integration",
    prefix: "ak_3f9c2e",
    scopes: ["read:logs", "read:staff"],
    active: true,
    expired: false,
    expires: null,
    lastUsed: "2024-12-14T08:42:00",
    created: "2024-01-15T10:00:00",
    calls: 1420,
  },
  {
    id: 2,
    name: "CCTV Dashboard",
    prefix: "ak_7b1d4f",
    scopes: ["read:status", "read:logs", "read:devices"],
    active: true,
    expired: false,
    expires: "2025-06-01",
    lastUsed: "2024-12-13T16:20:00",
    created: "2024-02-01T09:00:00",
    calls: 8832,
  },
  {
    id: 3,
    name: "Payroll Export Script",
    prefix: "ak_9a5e8c",
    scopes: ["read:logs", "read:staff", "export:data"],
    active: false,
    expired: false,
    expires: null,
    lastUsed: "2024-11-30T12:00:00",
    created: "2024-03-10T08:30:00",
    calls: 301,
  },
  {
    id: 4,
    name: "Mobile Access App",
    prefix: "ak_2c8f1a",
    scopes: ["read:fingerprints", "read:visitors", "read:status"],
    active: true,
    expired: false,
    expires: "2025-12-31",
    lastUsed: "2024-12-14T07:00:00",
    created: "2024-04-22T11:00:00",
    calls: 22410,
  },
  {
    id: 5,
    name: "Audit Logger",
    prefix: "ak_5e3b7d",
    scopes: ["read:logs", "read:reports"],
    active: true,
    expired: false,
    expires: null,
    lastUsed: "2024-12-12T09:15:00",
    created: "2024-05-05T08:00:00",
    calls: 5670,
  },
  {
    id: 6,
    name: "Device Manager",
    prefix: "ak_1d9a4c",
    scopes: ["read:devices", "write:devices"],
    active: false,
    expired: true,
    expires: "2024-11-01",
    lastUsed: "2024-10-31T18:00:00",
    created: "2024-06-01T09:00:00",
    calls: 440,
  },
  {
    id: 7,
    name: "Visitor Kiosk",
    prefix: "ak_8b2e5f",
    scopes: ["write:visitors", "read:visitors"],
    active: true,
    expired: false,
    expires: null,
    lastUsed: "2024-12-14T10:00:00",
    created: "2024-07-10T10:00:00",
    calls: 3120,
  },
  {
    id: 8,
    name: "Settings Sync",
    prefix: "ak_4f7c1e",
    scopes: ["read:settings", "write:settings"],
    active: true,
    expired: false,
    expires: "2026-01-01",
    lastUsed: "2024-12-10T14:30:00",
    created: "2024-08-15T09:00:00",
    calls: 89,
  },
  {
    id: 9,
    name: "Fingerprint Enroller",
    prefix: "ak_6a3d9b",
    scopes: ["write:fingerprints", "read:fingerprints"],
    active: true,
    expired: false,
    expires: null,
    lastUsed: "2024-12-13T11:00:00",
    created: "2024-09-01T08:00:00",
    calls: 2200,
  },
  {
    id: 10,
    name: "Admin Console",
    prefix: "ak_0c5e2a",
    scopes: ["admin:keys", "read:settings", "write:settings"],
    active: true,
    expired: false,
    expires: null,
    lastUsed: "2024-12-14T09:30:00",
    created: "2024-10-01T08:00:00",
    calls: 512,
  },
  {
    id: 11,
    name: "Staff Portal",
    prefix: "ak_3e8a6f",
    scopes: ["read:staff", "write:staff"],
    active: false,
    expired: false,
    expires: null,
    lastUsed: "2024-12-01T12:00:00",
    created: "2024-11-01T09:00:00",
    calls: 980,
  },
  {
    id: 12,
    name: "Report Builder",
    prefix: "ak_7c1b4e",
    scopes: ["read:reports", "export:data", "read:logs"],
    active: true,
    expired: false,
    expires: "2025-03-31",
    lastUsed: "2024-12-11T16:00:00",
    created: "2024-11-15T10:00:00",
    calls: 267,
  },
];

// ── Helpers ────────────────────────────────────────────────────────
const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-UG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtRel = (iso: string | null) => {
  if (!iso) return "Never";
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  const h = Math.floor(m / 60);
  const dy = Math.floor(h / 24);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${dy}d ago`;
};

const genKey = () =>
  "ak_" +
  Array.from(
    { length: 32 },
    () =>
      "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)],
  ).join("");

// ── Scope Selector ─────────────────────────────────────────────────
const ScopeSelector = ({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (scopes: string[]) => void;
}) => {
  const toggle = (v: string) =>
    onChange(
      selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v],
    );

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {ALL_SCOPES.map((s) => (
        <label
          key={s.v}
          className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
            selected.includes(s.v)
              ? "border-primary bg-primary/5"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <input
            type="checkbox"
            checked={selected.includes(s.v)}
            onChange={() => toggle(s.v)}
            className="mt-0.5 accent-primary shrink-0"
          />
          <div>
            <div className="text-xs font-medium text-slate-700">{s.l}</div>
            <div className="text-[10px] text-slate-400 font-mono">{s.d}</div>
          </div>
        </label>
      ))}
    </div>
  );
};

// ── Create Modal ───────────────────────────────────────────────────
const CreateModal = ({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (key: APIKey, plainKey: string) => void;
}) => {
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["read:logs", "read:status"]);
  const [expires, setExpires] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || scopes.length === 0) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    const full = genKey();
    const newKey: APIKey = {
      id: Date.now(),
      name: name.trim(),
      prefix: full.slice(0, 10),
      scopes,
      active: true,
      expired: false,
      expires: expires || null,
      lastUsed: null,
      created: new Date().toISOString(),
      calls: 0,
    };
    setSaving(false);
    onCreate(newKey, full);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">
            Create API Key
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
          >
            <Icon icon="hugeicons:cancel-01" className="text-base" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block">
              Key Name <span className="text-red-400">*</span>
            </label>
            <input
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-white text-slate-800"
              placeholder='e.g. "HR System Integration"'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block">
              Scopes <span className="text-red-400">*</span>
            </label>
            <ScopeSelector selected={scopes} onChange={setScopes} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block">
              Expires At <span className="text-slate-300">(optional)</span>
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-white text-slate-800"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
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
            onClick={handleCreate}
            disabled={saving || !name.trim() || scopes.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Icon
                  icon="hugeicons:loading-03"
                  className="animate-spin text-base"
                />
                Creating…
              </>
            ) : (
              <>
                <Icon icon="hugeicons:add-circle" className="text-base" />
                Create Key
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Edit Modal ─────────────────────────────────────────────────────
const EditModal = ({
  apiKey,
  onClose,
  onSave,
}: {
  apiKey: APIKey;
  onClose: () => void;
  onSave: (
    id: number,
    name: string,
    scopes: string[],
    expires: string | null,
  ) => void;
}) => {
  const [name, setName] = useState(apiKey.name);
  const [scopes, setScopes] = useState<string[]>([...apiKey.scopes]);
  const [expires, setExpires] = useState(apiKey.expires || "");

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Edit API Key</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
          >
            <Icon icon="hugeicons:cancel-01" className="text-base" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block">
              Key Name
            </label>
            <input
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-white text-slate-800"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block">
              Scopes
            </label>
            <ScopeSelector selected={scopes} onChange={setScopes} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block">
              Expires At <span className="text-slate-300">(optional)</span>
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-white text-slate-800"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
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
            onClick={() =>
              onSave(apiKey.id, name.trim(), scopes, expires || null)
            }
            disabled={!name.trim() || scopes.length === 0}
            className="flex-1 px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Reveal Modal ───────────────────────────────────────────────────
const RevealModal = ({
  plainKey,
  onClose,
}: {
  plainKey: string;
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(plainKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-xl">
        <div className="p-5 text-center border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <Icon
              icon="hugeicons:checkmark-circle-02"
              className="text-2xl text-emerald-500"
            />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            API Key Created
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Copy this key now. It will <strong>never be shown again.</strong>
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-mono text-slate-800 break-all leading-relaxed">
              {plainKey}
            </p>
          </div>
          <button
            onClick={copy}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              copied
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-primary text-primary-foreground hover:bg-primary-hover"
            }`}
          >
            <Icon
              icon={
                copied ? "hugeicons:checkmark-circle-02" : "hugeicons:copy-01"
              }
              className="text-base"
            />
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <Icon
              icon="hugeicons:alert-02"
              className="text-amber-500 text-base shrink-0 mt-0.5"
            />
            <p className="text-xs text-amber-700">
              Store this key in a secure place such as a password manager or
              environment variable. You cannot retrieve it later.
            </p>
          </div>
        </div>
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700"
          >
            I've saved the key — close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Revoke Confirm Modal ───────────────────────────────────────────
const RevokeModal = ({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-xl">
      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-4">
        <Icon icon="hugeicons:delete-02" className="text-xl text-red-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">
        Revoke API key?
      </h3>
      <p className="text-sm text-slate-500 mb-5">
        Any system using this key will immediately lose access. This cannot be
        undone.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
        >
          Revoke
        </button>
      </div>
    </div>
  </div>
);

// ── Usage Sidebar ──────────────────────────────────────────────────
const UsageSidebar = ({ keys }: { keys: APIKey[] }) => {
  const maxCalls = Math.max(...keys.map((k) => k.calls), 1);
  const sorted = [...keys].sort((a, b) => b.calls - a.calls).slice(0, 8);
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">
            Usage (API calls)
          </p>
        </div>
        <div className="p-4 space-y-3">
          {sorted.map((k) => {
            const pct = Math.round((k.calls / maxCalls) * 100);
            return (
              <div key={k.id}>
                <div className="text-xs text-slate-700 mb-1 truncate font-medium">
                  {k.name}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct > 70 ? "bg-amber-500" : "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 tabular-nums w-12 text-right">
                    {k.calls.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">
            How to authenticate
          </p>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-500">
            Include your key in every request header:
          </p>
          <div className="bg-slate-900 rounded-xl p-3 overflow-x-auto">
            <pre className="text-xs text-slate-300 font-mono leading-relaxed">{`curl -H "X-API-Key: ak_••••••••" \\
     http://accesspi.local/api/logs/`}</pre>
          </div>
          <p className="text-xs text-slate-500">
            Scopes restrict what each key can access. A{" "}
            <code className="bg-slate-100 px-1 rounded text-slate-600 text-[10px]">
              read:logs
            </code>{" "}
            key cannot modify staff records.
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────
export default function APIKeyManager() {
  const [keys, setKeys] = useState<APIKey[]>(MOCK_KEYS);
  const [showCreate, setShowCreate] = useState(false);
  const [editKey, setEditKey] = useState<APIKey | null>(null);
  const [revealKey, setRevealKey] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // ── Handlers ──────────────────────────────────────────────────
  const handleCreate = (newKey: APIKey, plain: string) => {
    setKeys((prev) => [newKey, ...prev]);
    setShowCreate(false);
    setRevealKey(plain);
    setPage(1);
    // POST /api/api-keys/ { name, scopes, expires_at }
  };

  const handleEdit = (
    id: number,
    name: string,
    scopes: string[],
    expires: string | null,
  ) => {
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, name, scopes, expires } : k)),
    );
    setEditKey(null);
    // PATCH /api/api-keys/{id}/ { name, scopes, expires_at }
  };

  const handleToggle = (id: number) => {
    setKeys((prev) =>
      prev.map((k) =>
        k.id === id
          ? {
              ...k,
              active: !k.active,
              expired: k.expired && k.active ? false : k.expired,
            }
          : k,
      ),
    );
    // PATCH /api/api-keys/{id}/ { is_active: !current }
  };

  const handleRevoke = () => {
    if (revokeId === null) return;
    setKeys((prev) => prev.filter((k) => k.id !== revokeId));
    setRevokeId(null);
    // DELETE /api/api-keys/{revokeId}/
  };

  // ── Filtering ────────────────────────────────────────────────
  const filtered = keys.filter((k) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      k.name.toLowerCase().includes(q) ||
      k.prefix.includes(q) ||
      k.scopes.some((s) => s.includes(q));
    const matchS =
      filterStatus === "all" ||
      (filterStatus === "active" && k.active && !k.expired) ||
      (filterStatus === "inactive" && (!k.active || k.expired));
    return matchQ && matchS;
  });

  const safePage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / pageSize)),
  );
  const pageRows = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const activeCount = keys.filter((k) => k.active && !k.expired).length;
  const inactiveCount = keys.length - activeCount;

  // ── Column definitions ───────────────────────────────────────
  const columns: Column<APIKey>[] = [
    {
      key: "key",
      header: "Key",
      className: "w-48",
      render: (k) => (
        <div>
          <p className="text-sm font-medium text-slate-800 truncate max-w-[160px]">
            {k.name}
          </p>
          <code className="text-[10px] text-slate-400 font-mono">
            {k.prefix}••••••••••••
          </code>
        </div>
      ),
    },
    {
      key: "scopes",
      header: "Scopes",
      render: (k) => (
        <div className="flex flex-wrap gap-1">
          {k.scopes.map((s) => (
            <span
              key={s}
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${scopeColor(s)}`}
            >
              {s}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-24",
      render: (k) => (
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
            k.expired
              ? "bg-red-50 text-red-700 border-red-200"
              : k.active
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
        >
          {k.expired ? "Expired" : k.active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "lastUsed",
      header: "Last used",
      className: "w-28",
      render: (k) => (
        <span className="text-xs text-slate-400">{fmtRel(k.lastUsed)}</span>
      ),
    },
    {
      key: "expires",
      header: "Expires",
      className: "w-28",
      render: (k) => (
        <span className="text-xs text-slate-400">
          {k.expires ? fmtDate(k.expires) : "No expiry"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-44",
      render: (k) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setEditKey(k)}
            className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
          >
            Edit
          </button>
          <button
            onClick={() => handleToggle(k.id)}
            className={`px-2.5 py-1 text-xs font-medium border rounded-lg transition-colors ${
              k.active && !k.expired
                ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            {k.active && !k.expired ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => setRevokeId(k.id)}
            className="px-2.5 py-1 text-xs font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600"
          >
            Revoke
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* ── Main column ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                  API Keys
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Manage external integrations. Keys never expire unless you set
                  a date.
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-all"
              >
                <Icon icon="hugeicons:add-circle" className="text-base" />
                Create API Key
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Total keys",
                  value: keys.length,
                  icon: "hugeicons:key-01",
                  cls: "bg-slate-50 border-slate-200 text-slate-700",
                },
                {
                  label: "Active",
                  value: activeCount,
                  icon: "hugeicons:checkmark-circle-02",
                  cls: "bg-emerald-50 border-emerald-100 text-emerald-700",
                },
                {
                  label: "Inactive / expired",
                  value: inactiveCount,
                  icon: "hugeicons:cancel-circle",
                  cls: "bg-slate-50 border-slate-200 text-slate-500",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${s.cls}`}
                >
                  <Icon icon={s.icon} className="text-lg shrink-0" />
                  <div>
                    <p className="text-xl font-bold leading-none">{s.value}</p>
                    <p className="text-xs mt-0.5 opacity-75">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
              <Icon
                icon="hugeicons:information-circle"
                className="text-blue-500 text-lg shrink-0 mt-0.5"
              />
              <p className="text-sm text-blue-700">
                Pass your key in the{" "}
                <code className="bg-blue-100 px-1 rounded font-mono text-xs">
                  X-API-Key
                </code>{" "}
                header on every request. Each key has specific scopes — a key
                with{" "}
                <code className="bg-blue-100 px-1 rounded font-mono text-xs">
                  read:logs
                </code>{" "}
                can only read logs, not modify staff or settings.
              </p>
            </div>

            {/* Search + filter toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex-1 min-w-[200px] relative">
                <Icon
                  icon="hugeicons:search-01"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"
                />
                <input
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 bg-white text-slate-800"
                  placeholder="Search by name, prefix or scope…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 bg-white text-slate-800"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* ── PaginatedTable ──────────────────────────────────── */}
            <PaginatedTable<APIKey>
              data={pageRows}
              columns={columns}
              page={safePage}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(1);
              }}
              pageSizeOptions={[5, 8, 10, 25]}
              emptyIcon="hugeicons:key-01"
              emptyMessage="No API keys match your filters."
            />
          </div>

          {/* ── Sidebar ─────────────────────────────────────────── */}
          <div className="w-full lg:w-72 shrink-0">
            <UsageSidebar keys={keys} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
      {editKey && (
        <EditModal
          apiKey={editKey}
          onClose={() => setEditKey(null)}
          onSave={handleEdit}
        />
      )}
      {revealKey && (
        <RevealModal plainKey={revealKey} onClose={() => setRevealKey(null)} />
      )}
      {revokeId !== null && (
        <RevokeModal
          onCancel={() => setRevokeId(null)}
          onConfirm={handleRevoke}
        />
      )}
    </div>
  );
}
