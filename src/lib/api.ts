import type {
  AdminAdministrativeResponse,
  AdminStructureCard,
  AdminStructureDetail,
  AdminFlatsResponse,
  AdminFloorsResponse,
  AdminLocationResponse,
  AdminRatingsResponse,
  ApiResponse,
  AuthLoginResponse,
  SystemStats
} from "@/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const TOKEN_KEY = "sams_admin_access_token";

type RequestOptions = RequestInit & {
  headers?: HeadersInit;
};

export class ApiError extends Error {
  status?: number;
  payload?: unknown;
}

export function getStoredToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setStoredToken(token: string): void {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
}

export function getApiBase(): string {
  return API_BASE;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = (await response.json().catch(() => ({}))) as ApiResponse<T>;
  if (!response.ok) {
    const message =
      (data as { error?: string; message?: string })?.error ||
      (data as { error?: string; message?: string })?.message ||
      "Request failed";
    const error = new ApiError(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

async function downloadFile(path: string, fileName: string): Promise<void> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error("Failed to download report");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const api = {
  login: (identifier: string, password: string) =>
    request<AuthLoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password })
    }),
  validateSession: () => request<SystemStats>("/api/admin/system-stats"),
  getAdminStructures: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type_of_structure?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.status && params.status !== "all") searchParams.set("status", params.status);
    if (params?.type_of_structure && params.type_of_structure !== "all") {
      searchParams.set("type_of_structure", params.type_of_structure);
    }
    if (params?.search?.trim()) searchParams.set("search", params.search.trim());
    if (params?.date_from) searchParams.set("date_from", params.date_from);
    if (params?.date_to) searchParams.set("date_to", params.date_to);

    const query = searchParams.toString();
    return request<AdminStructureCard[]>(`/api/admin/structures${query ? `?${query}` : ""}`);
  },
  getAdminStructure: (id: string) => request<AdminStructureDetail>(`/api/admin/structures/${id}`),
  getAdminStructureLocation: (id: string) =>
    request<AdminLocationResponse>(`/api/admin/structures/${id}/location`),
  getAdminStructureAdministrative: (id: string) =>
    request<AdminAdministrativeResponse>(`/api/admin/structures/${id}/administrative`),
  getAdminStructureFloors: (id: string) =>
    request<AdminFloorsResponse>(`/api/admin/structures/${id}/floors`),
  getAdminStructureFlats: (id: string) =>
    request<AdminFlatsResponse>(`/api/admin/structures/${id}/flats`),
  getAdminStructureRatings: (id: string) =>
    request<AdminRatingsResponse>(`/api/admin/structures/${id}/ratings`),
  getSystemStats: () => request<SystemStats>("/api/admin/system-stats"),
  downloadStructureReportPdf: (id: string) =>
    downloadFile(`/api/reports/structures/${id}/download?format=pdf`, `structure-${id}.pdf`),
  downloadStructureReportWord: (id: string) =>
    downloadFile(`/api/reports/structures/${id}/download?format=word`, `structure-${id}.doc`)
};
