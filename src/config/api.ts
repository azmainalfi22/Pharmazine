/**
 * Centralized API Configuration for Pharmazine.
 * Use this instead of hardcoding API_BASE in individual files.
 */

/**
 * Ensure the API base URL never has duplicate trailing slashes
 * and strip an accidental `/api` suffix (the client appends it automatically).
 */
const sanitizeBaseUrl = (raw: string): string => {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (trimmed.toLowerCase().endsWith("/api")) {
    return trimmed.slice(0, -4);
  }
  return trimmed;
};

/**
 * Determine the base URL based on environment.
 * Priority: ENV variable > Auto-detect > Fallback.
 */
const getBaseUrl = (): string => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv) {
    return sanitizeBaseUrl(fromEnv);
  }

  if (typeof window !== "undefined") {
    const { protocol, host } = window.location;
    return sanitizeBaseUrl(`${protocol}//${host}`);
  }

  // Fallback for SSR/build tools
  return "http://localhost:8000";
};

const BASE_URL = getBaseUrl();
const API_ROOT = `${BASE_URL}/api`;

export const API_CONFIG = {
  BASE_URL,
  API_ROOT,
  PHARMACY_BASE: `${API_ROOT}/pharmacy`,
  HRM_BASE: `${API_ROOT}/hrm`,
  SERVICES_BASE: `${API_ROOT}/services`,
  CRM_BASE: `${API_ROOT}/crm`,
  FINANCE_BASE: `${API_ROOT}/finance`,
  AUTO_REORDER_BASE: `${API_ROOT}/auto-reorder`,
  NOTIFICATIONS_BASE: `${API_ROOT}/notifications`,
  BACKUP_BASE: `${API_ROOT}/backup`,
  TIMEOUT: 30000, // 30 seconds

  // Helper to check environment
  isDevelopment: import.meta.env.MODE === "development",
  isProduction: import.meta.env.MODE === "production",
};

/**
 * Helper function to get auth headers
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Helper function for API calls with proper error handling
 */
export const apiCall = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const defaultOptions: RequestInit = {
    headers: getAuthHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "An error occurred" }));
      throw new Error(
        errorData.message || errorData.detail || `HTTP Error ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred");
  }
};

const serializeBody = (payload: unknown): BodyInit | undefined => {
  if (payload === undefined) {
    return undefined;
  }

  if (
    payload instanceof Blob ||
    payload instanceof FormData ||
    payload instanceof URLSearchParams
  ) {
    return payload;
  }

  if (ArrayBuffer.isView(payload) || payload instanceof ArrayBuffer) {
    return payload as BodyInit;
  }

  if (typeof payload === "string") {
    return payload;
  }

  return JSON.stringify(payload);
};

/**
 * Axios-like API client for easy migration and consistent usage
 */
const api = {
  get: async <T = unknown>(
    url: string,
    config?: RequestInit
  ): Promise<{ data: T }> => {
    const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
    const data = await apiCall<T>(fullUrl, { method: "GET", ...config });
    return { data };
  },

  post: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestInit
  ): Promise<{ data: T }> => {
    const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
    const responseData = await apiCall<T>(fullUrl, {
      method: "POST",
      body: serializeBody(data),
      ...config,
    });
    return { data: responseData };
  },

  put: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestInit
  ): Promise<{ data: T }> => {
    const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
    const responseData = await apiCall<T>(fullUrl, {
      method: "PUT",
      body: serializeBody(data),
      ...config,
    });
    return { data: responseData };
  },

  delete: async <T = unknown>(
    url: string,
    config?: RequestInit
  ): Promise<{ data: T }> => {
    const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
    const data = await apiCall<T>(fullUrl, { method: "DELETE", ...config });
    return { data };
  },

  patch: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestInit
  ): Promise<{ data: T }> => {
    const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
    const responseData = await apiCall<T>(fullUrl, {
      method: "PATCH",
      body: serializeBody(data),
      ...config,
    });
    return { data: responseData };
  },
};

export default api;
