const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const TOKEN_KEY = "scriptify_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function extractMessage(data: any, fallback: string): string {
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
  }
  return data.message || fallback;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(extractMessage(data, res.statusText), res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

/**
 * Upload with progress, using XHR (fetch has no upload progress events).
 * Mirrors the old fake `onProgress` callback shape the UI already expects.
 */
export function uploadWithProgress<T>(
  path: string,
  formData: FormData,
  onProgress?: (n: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}${path}`);

    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        // Cap at 90 during upload; the final 100 fires on response.
        onProgress(Math.min(90, Math.round((e.loaded / e.total) * 90)));
      }
    };

    xhr.onload = () => {
      let data: any = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* ignore parse errors, handled below */
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(data as T);
      } else {
        reject(new ApiError(extractMessage(data, xhr.statusText || "Request failed"), xhr.status));
      }
    };

    xhr.onerror = () => reject(new ApiError("Network error — is the backend running?", 0));
    xhr.send(formData);
  });
}

export { API_BASE_URL };