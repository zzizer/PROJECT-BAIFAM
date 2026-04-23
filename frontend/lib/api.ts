/**
 * All AccessPi API endpoints.
 * Import from here everywhere — never import apiClient directly in components.
 *
 * @example
 * import { STAFF_API, AUTH_API } from "@/lib/api";
 */
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
  Department,
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

export const AUTH_API = {
  login: (data: LoginPayload) =>
    apiClient.post<LoginResponse>("/user/login/", data).then((r) => r.data),

  refresh: (refresh: string) =>
    apiClient
      .post<RefreshTokenResponse>("/user/refresh/", { refresh })
      .then((r) => r.data),

  logout: (refresh: string) => apiClient.post("/user/logout/", { refresh }),
};

export const STAFF_API = createResourceAPI<
  Staff,
  CreateStaffPayload,
  UpdateStaffPayload
>("/staff");

export const DEPARTMENTS_API = createResourceAPI<
  Department,
  Pick<Department, "name" | "description">
>("/departments");

export const FINGERPRINTS_API = createResourceAPI<
  Fingerprint,
  EnrollFingerprintPayload
>("/fingerprints");

export const LOGS_API = createResourceAPI<AccessLog>("/logs");

export const ACCESS_RULES_API = createResourceAPI<
  AccessRule,
  CreateAccessRulePayload
>("/permissions/rules");

export const SCHEDULES_API = createResourceAPI<
  AccessSchedule,
  Pick<AccessSchedule, "name" | "days" | "time_from" | "time_to" | "is_active">
>("/permissions/schedules");

export const DEVICE_SETTINGS_API = {
  get: () => apiClient.get<DeviceSettings>("/settings/").then((r) => r.data),
  update: (data: UpdateDeviceSettingsPayload) =>
    apiClient.patch<DeviceSettings>("/settings/", data).then((r) => r.data),
};

export const SCOPES_API = {
  getAll: () =>
    apiClient
      .get<PaginatedResponse<Scope>>("/system/scopes/")
      .then((r) => r.data),
};

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

export const API_KEY_LOGS_API = {
  getAll: (params?: PaginationParams & { api_key?: string; method?: string }) =>
    apiClient
      .get<
        PaginatedResponse<APIKeyRequestLog>
      >(`/api-keys/logs/${buildQuery(params)}`)
      .then((r) => r.data),
};
