"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  STAFF_API,
  ROLES_API,
  DEPARTMENTS_API,
  FINGERPRINTS_API,
  LOGS_API,
  DEVICE_SETTINGS_API,
  SCOPES_API,
  API_KEYS_API,
  API_KEY_LOGS_API,
} from "@/lib/api";
import type {
  Staff,
  CreateStaffPayload,
  UpdateStaffPayload,
  Role,
  CreateRolePayload,
  UpdateRolePayload,
  Department,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  Fingerprint,
  EnrollFingerprintPayload,
  AccessLog,
  DeviceSettings,
  UpdateDeviceSettingsPayload,
  Scope,
  APIKey,
  CreateAPIKeyPayload,
  UpdateAPIKeyPayload,
  APIKeyRequestLog,
  PaginationParams,
  PaginatedResponse,
} from "@/types";

// ── Query Keys ─────────────────────────────────────────────────────────────────

export const QK = {
  staff: {
    all: () => ["staff"] as const,
    list: (p?: PaginationParams) => ["staff", "list", p] as const,
    detail: (id: number) => ["staff", id] as const,
  },
  roles: {
    all: () => ["roles"] as const,
    list: (p?: PaginationParams) => ["roles", "list", p] as const,
  },
  departments: {
    all: () => ["departments"] as const,
    list: (p?: PaginationParams) => ["departments", "list", p] as const,
  },
  fingerprints: {
    all: () => ["fingerprints"] as const,
    list: (p?: PaginationParams) => ["fingerprints", "list", p] as const,
    byStaff: (staffId: number) => ["fingerprints", "staff", staffId] as const,
  },
  logs: {
    all: () => ["logs"] as const,
    list: (p?: PaginationParams) => ["logs", "list", p] as const,
  },
  device: {
    settings: () => ["device", "settings"] as const,
  },
  scopes: {
    all: () => ["scopes"] as const,
  },
  apiKeys: {
    all: () => ["api-keys"] as const,
    list: (p?: PaginationParams & { status?: string }) =>
      ["api-keys", "list", p] as const,
    detail: (uuid: string) => ["api-keys", uuid] as const,
  },
  apiKeyLogs: {
    all: () => ["api-key-logs"] as const,
    list: (p?: PaginationParams & { api_key?: string; method?: string }) =>
      ["api-key-logs", "list", p] as const,
  },
} as const;

// ── Staff ──────────────────────────────────────────────────────────────────────

export function useStaffList(params?: PaginationParams) {
  return useQuery({
    queryKey: QK.staff.list(params),
    queryFn: () => STAFF_API.getAll(params),
  });
}

export function useStaffDetail(
  id: number,
  options?: Partial<UseQueryOptions<Staff>>,
) {
  return useQuery({
    queryKey: QK.staff.detail(id),
    queryFn: () => STAFF_API.getOne(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffPayload) => STAFF_API.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.staff.all() }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: UpdateStaffPayload }) =>
      STAFF_API.update(uuid, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.staff.all() }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => STAFF_API.remove(uuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.staff.all() }),
  });
}

// ── Roles ──────────────────────────────────────────────────────────────────────

export function useRoleList(params?: PaginationParams) {
  return useQuery({
    queryKey: QK.roles.list(params),
    queryFn: () => ROLES_API.getAll(params),
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRolePayload) => ROLES_API.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.roles.all() }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: UpdateRolePayload }) =>
      ROLES_API.update(uuid, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.roles.all() }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => ROLES_API.remove(uuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.roles.all() }),
  });
}

// ── Departments ────────────────────────────────────────────────────────────────

export function useDepartmentList(params?: PaginationParams) {
  return useQuery({
    queryKey: QK.departments.list(params),
    queryFn: () => DEPARTMENTS_API.getAll(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDepartmentPayload) => DEPARTMENTS_API.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.departments.all() }),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      uuid,
      data,
    }: {
      uuid: string;
      data: UpdateDepartmentPayload;
    }) => DEPARTMENTS_API.update(uuid, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.departments.all() }),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => DEPARTMENTS_API.remove(uuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.departments.all() }),
  });
}

// ── Fingerprints ───────────────────────────────────────────────────────────────

export function useFingerprintList(params?: PaginationParams) {
  return useQuery({
    queryKey: QK.fingerprints.list(params),
    queryFn: () => FINGERPRINTS_API.getAll(params),
  });
}

export function useFingerprintsByStaff(staffId: number) {
  return useQuery({
    queryKey: QK.fingerprints.byStaff(staffId),
    queryFn: () => FINGERPRINTS_API.getAll({ staff_id: staffId }),
    enabled: !!staffId,
  });
}

export function useEnrollFingerprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EnrollFingerprintPayload) =>
      FINGERPRINTS_API.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.fingerprints.all() }),
  });
}

export function useDeleteFingerprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => FINGERPRINTS_API.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.fingerprints.all() }),
  });
}

export function useVerifyFingerprint() {
  return useMutation({
    mutationFn: (id: number) => FINGERPRINTS_API.action(id, "verify"),
  });
}

// ── Access Logs ────────────────────────────────────────────────────────────────

export function useAccessLogs(params?: PaginationParams) {
  return useQuery({
    queryKey: QK.logs.list(params),
    queryFn: () => LOGS_API.getAll(params),
  });
}

export function useAccessLogDetail(id: number) {
  return useQuery({
    queryKey: [...QK.logs.all(), id],
    queryFn: () => LOGS_API.getOne(id),
    enabled: !!id,
  });
}

// ── Device Settings ────────────────────────────────────────────────────────────

export function useDeviceSettings() {
  return useQuery({
    queryKey: QK.device.settings(),
    queryFn: () => DEVICE_SETTINGS_API.get(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateDeviceSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateDeviceSettingsPayload) =>
      DEVICE_SETTINGS_API.update(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.device.settings() }),
  });
}

// ── Scopes ─────────────────────────────────────────────────────────────────────

export function useScopes() {
  return useQuery<PaginatedResponse<Scope>>({
    queryKey: QK.scopes.all(),
    queryFn: () => SCOPES_API.getAll(),
    staleTime: 1000 * 60 * 10,
  });
}

// ── API Keys ───────────────────────────────────────────────────────────────────

export function useAPIKeyList(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: QK.apiKeys.list(params),
    queryFn: () => API_KEYS_API.getAll(params),
  });
}

export function useAPIKeyDetail(uuid: string) {
  return useQuery<APIKey>({
    queryKey: QK.apiKeys.detail(uuid),
    queryFn: () => API_KEYS_API.getOne(uuid),
    enabled: !!uuid,
  });
}

export function useCreateAPIKey() {
  const qc = useQueryClient();
  return useMutation<APIKey, Error, CreateAPIKeyPayload>({
    mutationFn: (data) => API_KEYS_API.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.apiKeys.all() }),
  });
}

export function useUpdateAPIKey() {
  const qc = useQueryClient();
  return useMutation<APIKey, Error, { uuid: string; data: UpdateAPIKeyPayload }>(
    {
      mutationFn: ({ uuid, data }) => API_KEYS_API.update(uuid, data),
      onSuccess: (_res, { uuid }) => {
        qc.invalidateQueries({ queryKey: QK.apiKeys.all() });
        qc.invalidateQueries({ queryKey: QK.apiKeys.detail(uuid) });
      },
    },
  );
}

export function useToggleAPIKey() {
  const qc = useQueryClient();
  return useMutation<APIKey, Error, string>({
    mutationFn: (uuid) => API_KEYS_API.toggle(uuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.apiKeys.all() }),
  });
}

export function useRevokeAPIKey() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (uuid) => API_KEYS_API.revoke(uuid).then(() => {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.apiKeys.all() }),
  });
}

// ── API Key Request Logs ───────────────────────────────────────────────────────

export function useAPIKeyLogs(
  params?: PaginationParams & { api_key?: string; method?: string },
) {
  return useQuery({
    queryKey: QK.apiKeyLogs.list(params),
    queryFn: () => API_KEY_LOGS_API.getAll(params),
  });
}