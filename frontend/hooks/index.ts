"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  STAFF_API,
  DEPARTMENTS_API,
  FINGERPRINTS_API,
  LOGS_API,
  DEVICE_SETTINGS_API,
} from "@/lib/api";
import type {
  Staff,
  CreateStaffPayload,
  UpdateStaffPayload,
  Department,
  Fingerprint,
  EnrollFingerprintPayload,
  AccessLog,
  DeviceSettings,
  UpdateDeviceSettingsPayload,
  PaginationParams,
} from "@/types";

export const QK = {
  staff: {
    all: () => ["staff"] as const,
    list: (p?: PaginationParams) => ["staff", "list", p] as const,
    detail: (id: number) => ["staff", id] as const,
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
} as const;

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

export function useUpdateStaff(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateStaffPayload) => STAFF_API.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.staff.all() });
      qc.invalidateQueries({ queryKey: QK.staff.detail(id) });
    },
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => STAFF_API.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.staff.all() }),
  });
}

export function useDepartmentList(params?: PaginationParams) {
  return useQuery({
    queryKey: QK.departments.list(params),
    queryFn: () => DEPARTMENTS_API.getAll(params),
    staleTime: 1000 * 60 * 5,
  });
}

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
