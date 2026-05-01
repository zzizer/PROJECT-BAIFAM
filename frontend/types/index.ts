// ── Pagination ─────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  granted_count?: number;
  denied_count?: number;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: unknown;
}

// ── Auth ───────────────────────────────────────────────────────────────────────

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

// ── Roles ──────────────────────────────────────────────────────────────────────

export interface Role {
  id: number;
  internal_base_uuid: string;
  ref_code: string;
  name: string;
  description: string;
  staff_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
}

export type UpdateRolePayload = Partial<CreateRolePayload>;

// ── Departments ────────────────────────────────────────────────────────────────

export interface Department {
  id: number;
  internal_base_uuid: string;
  ref_code: string;
  name: string;
  description: string | null;
  staff_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentPayload {
  name: string;
  description?: string;
}

export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload>;

// ── Staff ──────────────────────────────────────────────────────────────────────

export interface AccesPermission {
  id: number;
  internal_base_uuid: string;
  is_allowed: boolean;
  access_start_time?: string;
  access_end_time?: string;
  allowed_days?: string;
  valid_from?: string;
  valid_until?: string;
}

export interface Staff {
  id: number;
  internal_base_uuid: string;
  ref_code: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: Role | null;
  department: Department | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  fingerprints?: Fingerprint;
  access_permission?: AccesPermission;
  access_config?: AccesPermission;
}

export interface CreateStaffPayload {
  full_name: string;
  email?: string;
  phone_number?: string;
  role_uuid?: string;
  department_uuid?: string;
}

export interface UpdateStaffPayload extends Partial<CreateStaffPayload> {
  is_active?: boolean;
}

// ── Fingerprints ───────────────────────────────────────────────────────────────

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
  is_active: boolean;
}

export interface EnrollFingerprintPayload {
  staff_id: number;
  finger_index: number;
}

// ── Access Logs ────────────────────────────────────────────────────────────────

export type AccessResult = "granted" | "denied";

export interface AccessLog {
  id: number;
  staff_name: string;
  staff_employee_id: string;
  staff_role: string;
  scanner_slot: number | null;
  confidence: number;
  granted: boolean;
  deny_reason: string;
  deny_reason_display: string;
  timestamp: string;
  result: AccessResult;
}

// ── Access Schedules & Rules ───────────────────────────────────────────────────

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

// ── Device Settings ────────────────────────────────────────────────────────────

export interface DeviceSettings {
  id: number;
  device_name: string;
  device_location: string | null;
  timezone: string;
  unlock_duration_sec: number;
  require_2finger_confirm: boolean;
  allow_unknown_finger_log: boolean;
  buzzer_enabled: boolean;
  buzzer_volume: number;
  lockout_duration_mins: number;
  max_failed_attempts: number;
  max_duration_before_sleep_if_idle: number;
  max_fingerprints_per_staff: number;
  serial_number: string;
  device_model: string;
  hardware_version: string;
  firmware_version: string;
  fingerprint_template_size: number;
}

export interface UpdateDeviceSettingsPayload {
  device_name?: string;
  device_location?: string | null;
  timezone?: string;
  unlock_duration_sec?: number;
  require_2finger_confirm?: boolean;
  allow_unknown_finger_log?: boolean;
  buzzer_enabled?: boolean;
  buzzer_volume?: number;
  lockout_duration_mins?: number;
  max_failed_attempts?: number;
  max_duration_before_sleep_if_idle?: number;
}

// ── API Key Management ─────────────────────────────────────────────────────────

export interface Scope {
  id: number;
  uuid: string;
  value: string;
  label: string;
  description: string;
  is_active: boolean;
  internal_base_uuid: string;
}

export interface APIKeyScope {
  id: number;
  scope: Scope;
  is_active: boolean;
}

export interface APIKeyScopeFlat {
  id: number;
  uuid: string;
  value: string;
  label: string;
  description: string;
  scope_link_id: number;
  scope_link_active: boolean;
  internal_base_uuid: string;
}

export interface APIKey {
  id: number;
  ref_code: string;
  internal_base_uuid: string;
  name: string;
  prefix: string;
  scopes: APIKeyScopeFlat[];
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
  is_expired: boolean;
  is_valid: boolean;
  created_by: number | null;
  created_by_name: string | null;
  request_log_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  plaintext_key?: string;
}

export interface CreateAPIKeyPayload {
  name: string;
  scope_uuids: string[];
  expires_at?: string | null;
}

export interface UpdateAPIKeyPayload {
  name?: string;
  scope_uuids?: string[];
  expires_at?: string | null;
}

export interface APIKeyRequestLog {
  id: number;
  api_key: number;
  api_key_name: string;
  api_key_prefix: string;
  method: string;
  path: string;
  status_code: number;
  ip_address: string | null;
  requested_at: string;
}
