/**
 * All AccessPi API endpoints.
 * Import from here everywhere — never import apiClient directly in components.
 *
 * @example
 * import { STAFF_API, AUTH_API } from "@/lib/api";
 */
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
