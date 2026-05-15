import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export interface AuthUser {
  id: number;
  email: string;
  subscriptionStatus: string;
  accessGranted: boolean;
  accessGrantedAt: string | null;
  expiresAt: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_KEY = "karaoke-ct-auth-token";

function getStoredToken(): string | null {
  try { return localStorage.getItem(AUTH_KEY); } catch { return null; }
}

function setStoredToken(token: string | null) {
  try { if (token) localStorage.setItem(AUTH_KEY, token); else localStorage.removeItem(AUTH_KEY); } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const validateToken = useCallback(async (token: string): Promise<AuthUser | null> => {
    try {
      const res = await fetch("/api/users/me", {
        headers: { "X-Auth-Token": token },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: password.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erro ao fazer login");
        return false;
      }
      const data = await res.json();
      setStoredToken(data.token);
      setUser({
        id: data.id,
        email: data.email,
        subscriptionStatus: data.subscriptionStatus,
        accessGranted: data.accessGranted,
        accessGrantedAt: data.accessGrantedAt,
        expiresAt: data.expiresAt,
      });
      return true;
    } catch {
      setError("Erro de rede. Tente novamente.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const token = getStoredToken();
    if (token) {
      try {
        await fetch("/api/users/logout", {
          method: "POST",
          headers: { "X-Auth-Token": token },
        });
      } catch { /* ignore */ }
    }
    setUser(null);
    setStoredToken(null);
    setError(null);
  }, []);

  // Validate token on mount
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      validateToken(token).then((u) => {
        if (u) setUser(u);
        else setStoredToken(null);
        setInitialized(true);
      });
    } else {
      setInitialized(true);
    }
  }, [validateToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
