import { buildQuery } from "@/utils";
import apiClient from "./api-client";
import { createResourceAPI } from "./create-resource-api";
import type {
  LoginPayload,
  LoginResponse,
  RefreshTokenResponse,
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
  AccessRule,
  CreateAccessRulePayload,
  AccessSchedule,
  DeviceSettings,
  UpdateDeviceSettingsPayload,
  PaginatedResponse,
  PaginationParams,
  Scope,
  APIKey,
  CreateAPIKeyPayload,
  UpdateAPIKeyPayload,
  APIKeyRequestLog,
} from "@/types";

// ── Auth ───────────────────────────────────────────────────────────────────────
export const AUTH_API = {
  login: (data: LoginPayload) =>
    apiClient.post<LoginResponse>("/user/login/", data).then((r) => r.data),

  refresh: (refresh: string) =>
    apiClient
      .post<RefreshTokenResponse>("/user/refresh/", { refresh })
      .then((r) => r.data),

  logout: (refresh: string) => apiClient.post("/user/logout/", { refresh }),
};

// ── Staff ──────────────────────────────────────────────────────────────────────
export const STAFF_API = createResourceAPI<
  Staff,
  CreateStaffPayload,
  UpdateStaffPayload
>("/staff");

// ── Roles ──────────────────────────────────────────────────────────────────────
export const ROLES_API = createResourceAPI<
  Role,
  CreateRolePayload,
  UpdateRolePayload
>("/staff/roles");

// ── Departments ────────────────────────────────────────────────────────────────
export const DEPARTMENTS_API = createResourceAPI<
  Department,
  CreateDepartmentPayload,
  UpdateDepartmentPayload
>("/staff/departments");

// ── Fingerprints ───────────────────────────────────────────────────────────────
export const FINGERPRINTS_API = createResourceAPI<
  Fingerprint,
  EnrollFingerprintPayload
>("/fingerprints");

// ── Access Logs ────────────────────────────────────────────────────────────────
export const LOGS_API = createResourceAPI<AccessLog>(
  "/fingerprints/access-logs",
);

// ── Access Rules ───────────────────────────────────────────────────────────────
export const ACCESS_RULES_API = createResourceAPI<
  AccessRule,
  CreateAccessRulePayload
>("/permissions/rules");

// ── Schedules ──────────────────────────────────────────────────────────────────
export const SCHEDULES_API = createResourceAPI<
  AccessSchedule,
  Pick<AccessSchedule, "name" | "days" | "time_from" | "time_to" | "is_active">
>("/permissions/schedules");

// ── Device Settings ────────────────────────────────────────────────────────────

export const DEVICE_SETTINGS_API = {
  get: () =>
    apiClient.get<DeviceSettings>("/device/settings/").then((r) => r.data),

  update: (data: UpdateDeviceSettingsPayload) =>
    apiClient
      .patch<DeviceSettings>("/device/settings/", data)
      .then((r) => r.data),
};

// ── Scopes ─────────────────────────────────────────────────────────────────────

export const SCOPES_API = {
  getAll: () =>
    apiClient
      .get<PaginatedResponse<Scope>>("/system/scopes/")
      .then((r) => r.data),
};

// ── API Keys ───────────────────────────────────────────────────────────────────

export const API_KEYS_API = {
  getAll: (params?: PaginationParams & { status?: string }) =>
    apiClient
      .get<PaginatedResponse<APIKey>>(`/api-keys/${buildQuery(params)}`)
      .then((r) => r.data),

  getOne: (uuid: string) =>
    apiClient.get<APIKey>(`/api-keys/${uuid}/`).then((r) => r.data),

  create: (data: CreateAPIKeyPayload) =>
    apiClient.post<APIKey>("/api-keys/", data).then((r) => r.data),

  update: (uuid: string, data: UpdateAPIKeyPayload) =>
    apiClient.patch<APIKey>(`/api-keys/${uuid}/`, data).then((r) => r.data),

  toggle: (uuid: string) =>
    apiClient.post<APIKey>(`/api-keys/${uuid}/toggle/`).then((r) => r.data),

  revoke: (uuid: string) => apiClient.delete(`/api-keys/${uuid}/`),
};

// ── API Key Request Logs ───────────────────────────────────────────────────────

export const API_KEY_LOGS_API = {
  getAll: (params?: PaginationParams & { api_key?: string; method?: string }) =>
    apiClient
      .get<
        PaginatedResponse<APIKeyRequestLog>
      >(`/api-keys/logs/${buildQuery(params)}`)
      .then((r) => r.data),
};
