import { apiFetch, setToken } from "@/lib/apiClient";

export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

interface BackendUser {
  id: number;
  name?: string;
  email: string;
  created_at?: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: { id: number; name: string; email: string };
}

const SESSION_KEY = "ocr_session";

function toUser(u: BackendUser): User {
  return {
    id: String(u.id),
    fullName: u.name ?? "",
    email: u.email,
    createdAt: u.created_at ?? new Date().toISOString(),
  };
}

function persistSession(user: User) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const data = await apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.access_token);
    const user = toUser(data.user);
    persistSession(user);
    return user;
  },

  async register(fullName: string, email: string, password: string): Promise<User> {
    await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: fullName, email, password }),
    });
    // Backend register doesn't auto-login; log in right after for a seamless flow.
    return this.login(email, password);
  },

  logout() {
    setToken(null);
    localStorage.removeItem(SESSION_KEY);
  },

  current(): User | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async refreshFromServer(): Promise<User | null> {
    try {
      const u = await apiFetch<BackendUser>("/api/auth/me");
      const user = toUser(u);
      persistSession(user);
      return user;
    } catch {
      this.logout();
      return null;
    }
  },

  async updateProfile(updates: Partial<Pick<User, "fullName" | "email">>): Promise<User> {
    const body: Record<string, string> = {};
    if (updates.fullName !== undefined) body.name = updates.fullName;
    if (updates.email !== undefined) body.email = updates.email;

    const u = await apiFetch<{ name: string; email: string; created_at: string }>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    });
    const current = this.current();
    const user: User = {
      id: current?.id ?? "",
      fullName: u.name,
      email: u.email,
      createdAt: u.created_at,
    };
    persistSession(user);
    return user;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    await apiFetch("/api/profile/password", {
      method: "PUT",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  },
};