"use client";

import React, { useState, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import PaginatedTable, { Column } from "@/components/commons/paginated-table";
import {
  useAPIKeyList,
  useCreateAPIKey,
  useUpdateAPIKey,
  useToggleAPIKey,
  useRevokeAPIKey,
  useScopes,
} from "@/hooks";
import type {
  APIKey,
  APIKeyScopeFlat,
  Scope,
  CreateAPIKeyPayload,
  UpdateAPIKeyPayload,
} from "@/types";

// ── Helpers ────────────────────────────────────────────────────────

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

const scopeColor = (value: string, all: Scope[]) =>
  SCOPE_COLORS[all.findIndex((x) => x.value === value) % SCOPE_COLORS.length] ??
  SCOPE_COLORS[0];

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

// ── Scope Selector ─────────────────────────────────────────────────

const SCOPES_PAGE_SIZE = 10;

const ScopeSelector = ({
  all,
  selected,
  onChange,
}: {
  all: Scope[];
  selected: string[];
  onChange: (uuids: string[]) => void;
}) => {
  const [visibleCount, setVisibleCount] = useState(SCOPES_PAGE_SIZE);
  const containerRef = useRef<HTMLDivElement>(null);

  const scopes = Array.isArray(all) ? all : [];
  const visible = scopes.slice(0, visibleCount);
  const allIds = scopes.map((s) => s.internal_base_uuid);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.includes(id));
  const someSelected =
    !allSelected && allIds.some((id) => selected.includes(id));

  const toggle = (id: string) =>
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );

  const toggleAll = () => onChange(allSelected ? [] : allIds);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
      setVisibleCount((c) => Math.min(c + SCOPES_PAGE_SIZE, scopes.length));
    }
  }, [scopes.length]);

  const selectAllRef = useCallback(
    (el: HTMLInputElement | null) => {
      if (el) el.indeterminate = someSelected;
    },
    [someSelected],
  );

  return (
    <div className="space-y-2">
      {/* Select all row */}
      <div className="flex items-center justify-between px-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            ref={selectAllRef}
            checked={allSelected}
            onChange={toggleAll}
            className="accent-primary"
          />
          <span className="text-xs font-semibold text-slate-600">
            {allSelected ? "Deselect all" : "Select all"}
          </span>
        </label>
        <span className="text-[10px] text-slate-400 tabular-nums">
          {selected.length} / {scopes.length} selected
        </span>
      </div>

      {/* Scrollable grid */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-0.5"
      >
        {visible.map((s) => {
          const id = s.internal_base_uuid;
          const checked = selected.includes(id);
          return (
            <label
              key={id}
              className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                checked
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(id)}
                className="mt-0.5 accent-primary shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-700 truncate">
                  {s.label}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  {s.description}
                </div>
              </div>
            </label>
          );
        })}

        {visibleCount < scopes.length && (
          <div className="col-span-2 flex items-center justify-center py-2 gap-1.5 text-xs text-slate-400">
            <Icon
              icon="hugeicons:loading-03"
              className="animate-spin text-sm"
            />
            Scroll for more…
          </div>
        )}
      </div>
    </div>
  );
};

// ── Create Modal ───────────────────────────────────────────────────

const CreateModal = ({
  allScopes,
  onClose,
  onCreated,
}: {
  allScopes: Scope[];
  onClose: () => void;
  onCreated: (key: APIKey) => void;
}) => {
  const [name, setName] = useState("");
  const [scopeUuids, setScopeUuids] = useState<string[]>([]);
  const [expires, setExpires] = useState("");
  const createMutation = useCreateAPIKey();

  const handleCreate = async () => {
    const validUuids = scopeUuids.filter(Boolean);
    if (!name.trim() || validUuids.length === 0) return;
    const payload: CreateAPIKeyPayload = {
      name: name.trim(),
      scope_uuids: validUuids,
      expires_at: expires ? new Date(expires).toISOString() : null,
    };
    createMutation.mutate(payload, {
      onSuccess: (data) => onCreated(data),
    });
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
          {createMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              Failed to create key. Please try again.
            </div>
          )}

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
            <ScopeSelector
              all={allScopes}
              selected={scopeUuids}
              onChange={setScopeUuids}
            />
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
            disabled={
              createMutation.isPending ||
              !name.trim() ||
              scopeUuids.filter(Boolean).length === 0
            }
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50"
          >
            {createMutation.isPending ? (
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
  allScopes,
  onClose,
}: {
  apiKey: APIKey;
  allScopes: Scope[];
  onClose: () => void;
}) => {
  const [name, setName] = useState(apiKey.name);
  const currentUuids = apiKey.scopes
    .map((s: APIKeyScopeFlat) => s.internal_base_uuid ?? s.uuid)
    .filter(Boolean) as string[];
  const [scopeUuids, setScopeUuids] = useState<string[]>(currentUuids);
  const [expires, setExpires] = useState(
    apiKey.expires_at ? apiKey.expires_at.split("T")[0] : "",
  );
  const updateMutation = useUpdateAPIKey(apiKey.internal_base_uuid);

  const handleSave = () => {
    const validUuids = scopeUuids.filter(Boolean);
    if (!name.trim() || validUuids.length === 0) return;
    const payload: UpdateAPIKeyPayload = {
      name: name.trim(),
      scope_uuids: validUuids,
      expires_at: expires ? new Date(expires).toISOString() : null,
    };
    updateMutation.mutate(payload, { onSuccess: onClose });
  };

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
          {updateMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              Failed to save changes. Please try again.
            </div>
          )}

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
            <ScopeSelector
              all={allScopes}
              selected={scopeUuids}
              onChange={setScopeUuids}
            />
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
            onClick={handleSave}
            disabled={
              updateMutation.isPending ||
              !name.trim() ||
              scopeUuids.filter(Boolean).length === 0
            }
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <>
                <Icon
                  icon="hugeicons:loading-03"
                  className="animate-spin text-base"
                />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
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
  loading,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
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
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
        >
          {loading ? (
            <>
              <Icon
                icon="hugeicons:loading-03"
                className="animate-spin text-base"
              />
              Revoking…
            </>
          ) : (
            "Revoke"
          )}
        </button>
      </div>
    </div>
  </div>
);

// ── Usage Sidebar ──────────────────────────────────────────────────

const UsageSidebar = ({ keys }: { keys: APIKey[] }) => {
  const maxCalls = Math.max(...keys.map((k) => k.request_log_count), 1);
  const sorted = [...keys]
    .sort((a, b) => b.request_log_count - a.request_log_count)
    .slice(0, 8);
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">
            Usage (API calls)
          </p>
        </div>
        <div className="p-4 space-y-3">
          {sorted.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">
              No keys yet
            </p>
          ) : (
            sorted.map((k) => {
              const pct = Math.round((k.request_log_count / maxCalls) * 100);
              return (
                <div key={k.internal_base_uuid}>
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
                      {k.request_log_count.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
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
  const [showCreate, setShowCreate] = useState(false);
  const [editKey, setEditKey] = useState<APIKey | null>(null);
  const [revealKey, setRevealKey] = useState<string | null>(null);
  const [revokeUuid, setRevokeUuid] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const { data: scopesData, isLoading: scopesLoading } = useScopes();
  const allScopes: Scope[] = scopesData?.results ?? [];

  const { data, isLoading } = useAPIKeyList({
    page,
    page_size: pageSize,
    search: search || undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
  });

  const toggleMutation = useToggleAPIKey();
  const revokeMutation = useRevokeAPIKey();

  const keys: APIKey[] = data?.results ?? [];
  const total = data?.count ?? 0;

  const activeCount = keys.filter((k) => k.is_active && !k.is_expired).length;
  const inactiveCount = keys.length - activeCount;

  const handleCreated = (newKey: APIKey) => {
    setShowCreate(false);
    if (newKey.plaintext_key) setRevealKey(newKey.plaintext_key);
    setPage(1);
  };

  const handleRevoke = () => {
    if (!revokeUuid) return;
    revokeMutation.mutate(revokeUuid, {
      onSuccess: () => setRevokeUuid(null),
    });
  };

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
          {k.scopes.map((s: APIKeyScopeFlat) => (
            <span
              key={s.internal_base_uuid ?? s.uuid}
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${scopeColor(s.value, allScopes)}`}
            >
              {s.value}
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
            k.is_expired
              ? "bg-red-50 text-red-700 border-red-200"
              : k.is_active
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
        >
          {k.is_expired ? "Expired" : k.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "lastUsed",
      header: "Last used",
      className: "w-28",
      render: (k) => (
        <span className="text-xs text-slate-400">{fmtRel(k.last_used_at)}</span>
      ),
    },
    {
      key: "expires",
      header: "Expires",
      className: "w-28",
      render: (k) => (
        <span className="text-xs text-slate-400">
          {k.expires_at ? fmtDate(k.expires_at) : "No expiry"}
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
            onClick={() => toggleMutation.mutate(k.internal_base_uuid)}
            disabled={toggleMutation.isPending}
            className={`px-2.5 py-1 text-xs font-medium border rounded-lg transition-colors disabled:opacity-50 ${
              k.is_active && !k.is_expired
                ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            {k.is_active && !k.is_expired ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => setRevokeUuid(k.internal_base_uuid)}
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
          {/* ── Main column ──────────────────────────────────────── */}
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
                disabled={scopesLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-all disabled:opacity-50"
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
                  value: total,
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
                  placeholder="Search by name…"
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

            {/* Table */}
            <PaginatedTable<APIKey>
              data={keys}
              columns={columns}
              page={page}
              pageSize={pageSize}
              total={total}
              loading={isLoading}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(1);
              }}
              pageSizeOptions={[5, 8, 10, 25]}
              emptyIcon="hugeicons:key-01"
              emptyMessage="No API keys match your filters."
            />
          </div>

          {/* ── Sidebar ──────────────────────────────────────────── */}
          <div className="w-full lg:w-72 shrink-0">
            <UsageSidebar keys={keys} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateModal
          allScopes={allScopes}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
      {editKey && (
        <EditModal
          apiKey={editKey}
          allScopes={allScopes}
          onClose={() => setEditKey(null)}
        />
      )}
      {revealKey && (
        <RevealModal plainKey={revealKey} onClose={() => setRevealKey(null)} />
      )}
      {revokeUuid !== null && (
        <RevokeModal
          onCancel={() => setRevokeUuid(null)}
          onConfirm={handleRevoke}
          loading={revokeMutation.isPending}
        />
      )}
    </div>
  );
}
