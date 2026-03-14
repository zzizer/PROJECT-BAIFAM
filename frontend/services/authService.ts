import apiClient from "@/lib/api-client";
import type {
  LoginPayload,
  LoginResponse,
  RefreshTokenResponse,
} from "@/types/auth.types";

const authService = {
  login: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>("/auth/login/", payload),

  refresh: (refreshToken: string) =>
    apiClient.post<RefreshTokenResponse>("/auth/refresh/", {
      refresh: refreshToken,
    }),

  logout: (refreshToken: string) =>
    apiClient.post("/auth/logout/", { refresh: refreshToken }),
};

export default authService;
