import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface SessionQueueItem {
  id: number;
  musica: string;
  artista: string;
  singerName: string;
  addedBy: string;
  addedAt: string;
}

export interface SwapRequestData {
  requesterDeviceId: string;
  requesterName: string;
  targetDeviceId: string;
  targetName: string;
  requesterIndex: number;
  targetIndex: number;
  status: "pending";
  requestedAt: string;
}

export interface Session {
  id: string;
  name: string;
  mode: "home" | "party";
  queue: SessionQueueItem[];
  currentSongId: string | null;
  currentSingerName: string | null;
  currentSongAddedBy: string | null;
  currentSongStartedAt: string | null;
  swapRequest: SwapRequestData | null;
  updatedAt: string;
}

interface SessionContextType {
  session: Session | null;
  loading: boolean;
  error: string | null;
  deviceId: string;
  createSession: (name?: string, mode?: "home" | "party") => Promise<string | null>;
  joinSession: (id: string) => Promise<boolean>;
  addToQueue: (songId: number, musica: string, artista: string, singerName: string) => Promise<{ ok: boolean; error?: string }>;
  removeFromQueue: (songId: number) => Promise<boolean>;
  updateQueueItem: (songId: number, musica: string, artista: string) => Promise<boolean>;
  advanceQueue: () => Promise<{ ok: boolean; error?: string }>;
  playSong: (songId: number) => Promise<boolean>;
  setMode: (mode: "home" | "party") => Promise<boolean>;
  requestSwap: (targetIndex: number) => Promise<{ ok: boolean; error?: string }>;
  acceptSwap: () => Promise<{ ok: boolean; error?: string }>;
  declineSwap: () => Promise<{ ok: boolean; error?: string }>;
  leaveSession: () => void;
}

export const SessionContext = createContext<SessionContextType | null>(null);

const STORAGE_KEY = "karaoke-ct-session-id";
const DEVICE_KEY = "karaoke-ct-device-id";

function getStoredSessionId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function setStoredSessionId(id: string | null) {
  try { if (id) localStorage.setItem(STORAGE_KEY, id); else localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(getStoredSessionId);
  const deviceId = getDeviceId();

  const fetchSession = useCallback(async (id: string) => {
    const res = await fetch(`/api/sessions/${id}`, { headers: { "X-Device-Id": deviceId } });
    if (!res.ok) return false;
    const data = await res.json();
    setSession(data);
    return true;
  }, [deviceId]);

  // Polling loop
  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    async function poll() {
      if (!active || !sessionId) return;
      try {
        await fetchSession(sessionId);
      } catch {
        // silently ignore polling errors
      }
      setTimeout(poll, 2000);
    }
    poll();
    return () => { active = false; };
  }, [sessionId, fetchSession]);

  const createSession = useCallback(async (name?: string, mode?: "home" | "party"): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name ?? "Sessão", mode: mode ?? "home" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Erro ao criar sessão");
        return null;
      }
      const data = await res.json();
      const id = data.id;
      setSessionId(id);
      setStoredSessionId(id);
      await fetchSession(id);
      return id;
    } catch {
      setError("Erro de rede ao criar sessão");
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchSession]);

  const joinSession = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const ok = await fetchSession(id);
      if (!ok) {
        setError("Sessão não encontrada");
        return false;
      }
      setSessionId(id);
      setStoredSessionId(id);
      return true;
    } catch {
      setError("Erro de rede");
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchSession]);

  const addToQueue = useCallback(async (songId: number, musica: string, artista: string, singerName: string): Promise<{ ok: boolean; error?: string }> => {
    if (!sessionId) return { ok: false };
    try {
      const res = await fetch(`/api/sessions/${sessionId}/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Device-Id": deviceId },
        body: JSON.stringify({ id: songId, musica, artista, singerName }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: err.error };
      }
      const data = await res.json();
      setSession((prev) => prev ? { ...prev, queue: data.queue } : null);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }, [sessionId, deviceId]);

  const removeFromQueue = useCallback(async (songId: number): Promise<boolean> => {
    if (!sessionId) return false;
    try {
      const res = await fetch(`/api/sessions/${sessionId}/queue/${songId}`, {
        method: "DELETE",
        headers: { "X-Device-Id": deviceId },
      });
      if (!res.ok) return false;
      const data = await res.json();
      setSession((prev) => prev ? { ...prev, queue: data.queue } : null);
      return true;
    } catch {
      return false;
    }
  }, [sessionId, deviceId]);

  const advanceQueue = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!sessionId) return { ok: false };
    try {
      const res = await fetch(`/api/sessions/${sessionId}/next`, {
        method: "POST",
        headers: { "X-Device-Id": deviceId },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: err.error };
      }
      const data = await res.json();
      setSession((prev) => prev ? {
        ...prev,
        queue: data.queue,
        currentSongId: data.next ? String(data.next.id) : null,
        currentSongStartedAt: data.next ? new Date().toISOString() : null,
      } : null);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }, [sessionId, deviceId]);

  const playSong = useCallback(async (songId: number): Promise<boolean> => {
    if (!sessionId) return false;
    try {
      const res = await fetch(`/api/sessions/${sessionId}/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: String(songId) }),
      });
      if (!res.ok) return false;
      setSession((prev) => prev ? {
        ...prev,
        currentSongId: String(songId),
        currentSongStartedAt: new Date().toISOString(),
      } : null);
      return true;
    } catch {
      return false;
    }
  }, [sessionId]);

  const leaveSession = useCallback(() => {
    setSession(null);
    setSessionId(null);
    setStoredSessionId(null);
  }, []);

  const updateQueueItem = useCallback(async (songId: number, musica: string, artista: string): Promise<boolean> => {
    if (!sessionId) return false;
    try {
      const res = await fetch(`/api/sessions/${sessionId}/queue/${songId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Device-Id": deviceId },
        body: JSON.stringify({ musica, artista }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setSession((prev) => prev ? { ...prev, queue: data.queue } : null);
      return true;
    } catch {
      return false;
    }
  }, [sessionId, deviceId]);

  const setMode = useCallback(async (mode: "home" | "party"): Promise<boolean> => {
    if (!sessionId) return false;
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setSession((prev) => prev ? { ...prev, mode: data.mode } : null);
      return true;
    } catch {
      return false;
    }
  }, [sessionId]);

  const requestSwap = useCallback(async (targetIndex: number): Promise<{ ok: boolean; error?: string }> => {
    if (!sessionId) return { ok: false };
    try {
      const res = await fetch(`/api/sessions/${sessionId}/swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Device-Id": deviceId },
        body: JSON.stringify({ targetIndex }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: err.error };
      }
      const data = await res.json();
      setSession((prev) => prev ? { ...prev, swapRequest: data.swapRequest } : null);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }, [sessionId, deviceId]);

  const acceptSwap = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!sessionId) return { ok: false };
    try {
      const res = await fetch(`/api/sessions/${sessionId}/swap/accept`, {
        method: "POST",
        headers: { "X-Device-Id": deviceId },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: err.error };
      }
      const data = await res.json();
      setSession((prev) => prev ? { ...prev, queue: data.queue, swapRequest: null } : null);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }, [sessionId, deviceId]);

  const declineSwap = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!sessionId) return { ok: false };
    try {
      const res = await fetch(`/api/sessions/${sessionId}/swap/decline`, {
        method: "POST",
        headers: { "X-Device-Id": deviceId },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: err.error };
      }
      setSession((prev) => prev ? { ...prev, swapRequest: null } : null);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }, [sessionId, deviceId]);

  const value: SessionContextType = {
    session, loading, error, deviceId,
    createSession, joinSession, addToQueue,
    removeFromQueue, updateQueueItem, advanceQueue, playSong, setMode,
    requestSwap, acceptSwap, declineSwap, leaveSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}
