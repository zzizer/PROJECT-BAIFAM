import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";

function getStore(): any {
  return require("@/store").store;
}

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const authClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

export async function ensureCsrfCookie(): Promise<void> {
  await authClient.get("/user/csrf/");
}

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: () => void;
  reject: (error: unknown) => void;
}> = [];

function drainQueue(error: unknown = null) {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(),
  );
  refreshQueue = [];
}

function isRefreshRequest(url?: string): boolean {
  return Boolean(url?.includes("/user/refresh/"));
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isRefreshRequest(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const store = getStore();

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: () => resolve(apiClient(originalRequest)),
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      await authClient.post("/user/refresh/");
      drainQueue();
      return apiClient(originalRequest);
    } catch (refreshError) {
      drainQueue(refreshError);
      const { clearAuth } = await import("@/store/slices/authSlice");
      store.dispatch(clearAuth());
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
