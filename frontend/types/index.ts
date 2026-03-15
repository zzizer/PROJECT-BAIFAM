export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: unknown;
}

export interface User {
  id: number;
  email: string;
  fullname: string;
  is_staff: boolean;
  is_active: boolean;
  ref_code: string;
  internal_base_uuid: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}
export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}
export interface RefreshTokenResponse {
  access: string;
  refresh: string;
}

export interface Department {
  id: number;
  ref_code: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: number;
  ref_code: string;
  fullname: string;
  email: string;
  phone: string | null;
  department: Department | null;
  department_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStaffPayload {
  fullname: string;
  email?: string;
  phone?: string;
  department_id?: number;
}
export interface UpdateStaffPayload extends Partial<CreateStaffPayload> {
  is_active?: boolean;
}

export type FingerprintStatus = "active" | "inactive" | "pending";

export interface Fingerprint {
  id: number;
  ref_code: string;
  staff: number;
  staff_name: string;
  finger_index: number;
  status: FingerprintStatus;
  enrolled_at: string;
  created_at: string;
  updated_at: string;
}

export interface EnrollFingerprintPayload {
  staff_id: number;
  finger_index: number;
}

export type AccessResult = "granted" | "denied";

export interface AccessLog {
  id: number;
  ref_code: string;
  staff: number | null;
  staff_name: string | null;
  result: AccessResult;
  reason: string | null;
  timestamp: string;
}

export type ScheduleDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface AccessSchedule {
  id: number;
  ref_code: string;
  name: string;
  days: ScheduleDay[];
  time_from: string;
  time_to: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccessRule {
  id: number;
  ref_code: string;
  staff: number;
  staff_name: string;
  schedule: AccessSchedule | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAccessRulePayload {
  staff_id: number;
  schedule_id?: number;
  is_active?: boolean;
}

export interface DeviceSettings {
  id: number;
  device_name: string;
  location: string | null;
  timezone: string;
  allow_unknown_attempts: boolean;
  max_failed_attempts: number;
  lockout_duration_minutes: number;
  updated_at: string;
}

export type UpdateDeviceSettingsPayload = Partial<
  Omit<DeviceSettings, "id" | "updated_at">
>;
