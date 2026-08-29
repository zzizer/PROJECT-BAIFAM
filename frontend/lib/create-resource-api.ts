import apiClient from "./api-client";
import type { PaginatedResponse, PaginationParams } from "@/types";
import { buildQuery } from "@/utils";

export function createResourceAPI<
  TModel,
  TCreate = Partial<TModel>,
  TUpdate = Partial<TModel>,
>(endpoint: string) {
  return {
    getAll(params?: PaginationParams) {
      return apiClient
        .get<PaginatedResponse<TModel>>(`${endpoint}/${buildQuery(params)}`)
        .then((r) => r.data);
    },

    getOne(id: string | number) {
      return apiClient.get<TModel>(`${endpoint}/${id}/`).then((r) => r.data);
    },

    create(data: TCreate) {
      return apiClient.post<TModel>(`${endpoint}/`, data).then((r) => r.data);
    },

    update(id: string | number, data: TUpdate) {
      return apiClient
        .patch<TModel>(`${endpoint}/${id}/`, data)
        .then((r) => r.data);
    },

    remove(id: string | number) {
      return apiClient.delete(`${endpoint}/${id}/`);
    },

    action<TResponse = TModel>(
      id: string | number,
      actionName: string,
      data?: unknown,
    ) {
      return apiClient
        .post<TResponse>(`${endpoint}/${id}/${actionName}/`, data)
        .then((r) => r.data);
    },

    collectionAction<TResponse = void>(actionName: string, data?: unknown) {
      return apiClient
        .post<TResponse>(`${endpoint}/${actionName}/`, data)
        .then((r) => r.data);
    },
  };
}
