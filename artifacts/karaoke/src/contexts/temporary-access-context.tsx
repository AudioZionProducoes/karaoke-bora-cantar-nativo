import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface TemporaryAccess {
  code: string;
  durationMinutes: number;
  accessExpiresAt: string;
  redeemedAt: string;
}

interface TemporaryAccessContextType {
  access: TemporaryAccess | null;
  hasAccess: boolean;
  remainingMinutes: number;
  ready: boolean;
  redeemCode: (code: string, name: string, email: string, whatsapp: string, marketingConsent?: boolean) => Promise<{ success: boolean; message?: string; error?: string }>;
  reactivateCode: (code: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  clearAccess: () => void;
}

const STORAGE_KEY = "karaoke-ct-temp-access";

function loadAccess(): TemporaryAccess | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TemporaryAccess;
    // Check if expired
    if (new Date(parsed.accessExpiresAt) < new Date()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch { return null; }
}

function saveAccess(access: TemporaryAccess | null) {
  try {
    if (access) localStorage.setItem(STORAGE_KEY, JSON.stringify(access));
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

const TemporaryAccessContext = createContext<TemporaryAccessContextType | null>(null);

export function TemporaryAccessProvider({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<TemporaryAccess | null>(loadAccess);
  const [ready, setReady] = useState(false);
  const [remaining, setRemaining] = useState(() => {
    const initialAccess = loadAccess();
    if (!initialAccess) return 0;
    const expires = new Date(initialAccess.accessExpiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((expires - now) / 60_000));
  });

  // Recalculate remaining time every 30 seconds
  useEffect(() => {
    function updateRemaining() {
      if (!access) { setRemaining(0); return; }
      const expires = new Date(access.accessExpiresAt).getTime();
      const now = Date.now();
      const mins = Math.max(0, Math.ceil((expires - now) / 60_000));
      setRemaining(mins);
      if (mins === 0) {
        saveAccess(null);
        setAccess(null);
        // Redirect to plans page when temporary access expires
        window.location.href = "/planos";
      }
    }
    updateRemaining();
    setReady(true);
    const id = setInterval(updateRemaining, 30_000);
    return () => clearInterval(id);
  }, [access]);

  const redeemCode = useCallback(async (code: string, name: string, email: string, whatsapp: string, marketingConsent?: boolean) => {
    try {
      const res = await fetch(`/api/access-codes/${encodeURIComponent(code.toUpperCase().trim())}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), whatsapp: whatsapp.trim(), marketingConsent }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || "Erro ao resgatar cupom" };
      }

      const data = await res.json();
      const newAccess: TemporaryAccess = {
        code: code.toUpperCase().trim(),
        durationMinutes: data.durationMinutes,
        accessExpiresAt: data.accessExpiresAt,
        redeemedAt: new Date().toISOString(),
      };
      saveAccess(newAccess);
      setAccess(newAccess);
      return { success: true, message: data.message };
    } catch {
      return { success: false, error: "Erro de rede. Tente novamente." };
    }
  }, []);

  const reactivateCode = useCallback(async (code: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await fetch(`/api/access-codes/${encodeURIComponent(code.toUpperCase().trim())}/reactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || "Erro ao reativar cupom" };
      }

      const data = await res.json();
      const newAccess: TemporaryAccess = {
        code: code.toUpperCase().trim(),
        durationMinutes: data.durationMinutes,
        accessExpiresAt: data.accessExpiresAt,
        redeemedAt: new Date().toISOString(),
      };
      saveAccess(newAccess);
      setAccess(newAccess);
      // Immediately update remaining
      const expires = new Date(data.accessExpiresAt).getTime();
      const mins = Math.max(0, Math.ceil((expires - Date.now()) / 60_000));
      setRemaining(mins);
      return { success: true, message: data.message };
    } catch {
      return { success: false, error: "Erro de rede. Tente novamente." };
    }
  }, []);

  const clearAccess = useCallback(() => {
    saveAccess(null);
    setAccess(null);
    setRemaining(0);
  }, []);

  return (
    <TemporaryAccessContext.Provider
      value={{
        access,
        hasAccess: !!access && remaining > 0,
        remainingMinutes: remaining,
        ready,
        redeemCode,
        reactivateCode,
        clearAccess,
      }}
    >
      {children}
    </TemporaryAccessContext.Provider>
  );
}

export function useTemporaryAccess() {
  const ctx = useContext(TemporaryAccessContext);
  if (!ctx) throw new Error("useTemporaryAccess must be used within TemporaryAccessProvider");
  return ctx;
}
