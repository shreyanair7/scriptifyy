import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService, type User } from "@/services/authService";

export interface AuthUser extends User {
  isGuest?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const GUEST_KEY = "scriptify_guest";

const GUEST_USER: AuthUser = {
  id: "guest",
  fullName: "Guest Explorer",
  email: "guest@scriptify.app",
  createdAt: new Date(0).toISOString(),
  isGuest: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const cached = authService.current();
      if (cached) {
        const fresh = await authService.refreshFromServer(); // validates token, logs out if expired
        setUser(fresh);
      } else if (typeof window !== "undefined" && localStorage.getItem(GUEST_KEY) === "1") {
        setUser(GUEST_USER);
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await authService.login(email, password);
    localStorage.removeItem(GUEST_KEY);
    setUser(u);
  }, []);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    const u = await authService.register(fullName, email, password);
    localStorage.removeItem(GUEST_KEY);
    setUser(u);
  }, []);

  const loginAsGuest = useCallback(() => {
    localStorage.setItem(GUEST_KEY, "1");
    setUser(GUEST_USER);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    localStorage.removeItem(GUEST_KEY);
    setUser(null);
  }, []);

  const refresh = useCallback(() => {
    const current = authService.current();
    setUser(current ?? (localStorage.getItem(GUEST_KEY) === "1" ? GUEST_USER : null));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isGuest: !!user?.isGuest,
      login,
      register,
      loginAsGuest,
      logout,
      refresh,
    }),
    [user, loading, login, register, loginAsGuest, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
