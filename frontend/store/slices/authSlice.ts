import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient, { ensureCsrfCookie } from "@/lib/api-client";
import type { LoginPayload, LoginResponse, User } from "@/types";
import axios from "axios";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      await ensureCsrfCookie();
      const { data } = await apiClient.post<LoginResponse>(
        "/user/login/",
        payload,
      );
      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(
          err.response?.data?.detail ?? "Invalid credentials",
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.post("/user/logout/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.detail ?? "Logout failed");
      }
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuth(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      });
  },
});

export const { clearAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
