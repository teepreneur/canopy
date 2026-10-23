import { deleteItem, getItem, setItem } from "./storage";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

let accessToken: string | null = null;
let refreshToken: string | null = null;

export async function loadTokens() {
  accessToken = await getItem("access_token");
  refreshToken = await getItem("refresh_token");
}

export async function saveTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  await setItem("access_token", access);
  await setItem("refresh_token", refresh);
}

export async function clearTokens() {
  accessToken = null;
  refreshToken = null;
  await deleteItem("access_token");
  await deleteItem("refresh_token");
}

export function getAccessToken() {
  return accessToken;
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    await saveTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.Authorization = `Bearer ${accessToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
