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
