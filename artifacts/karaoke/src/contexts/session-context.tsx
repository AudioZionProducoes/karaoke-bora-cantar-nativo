import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface SessionQueueItem {
  id: number;
  musica: string;
  artista: string;
  singerName: string;
  addedAt: string;
}

export interface Session {
  id: string;
  name: string;
  queue: SessionQueueItem[];
  currentSongId: string | null;
  currentSongStartedAt: string | null;
  updatedAt: string;
}

interface SessionContextType {
  session: Session | null;
  loading: boolean;
  error: string | null;
  createSession: (name?: string) => Promise<string | null>;
  joinSession: (id: string) => Promise<boolean>;
  addToQueue: (songId: number, musica: string, artista: string, singerName: string) => Promise<boolean>;
  removeFromQueue: (songId: number) => Promise<boolean>;
  advanceQueue: () => Promise<boolean>;
  playSong: (songId: number) => Promise<boolean>;
  leaveSession: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

const STORAGE_KEY = "karaoke-ct-session-id";

function getStoredSessionId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function setStoredSessionId(id: string | null) {
  try { if (id) localStorage.setItem(STORAGE_KEY, id); else localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(getStoredSessionId);

  const fetchSession = useCallback(async (id: string) => {
    const res = await fetch(`/api/sessions/${id}`);
    if (!res.ok) return false;
    const data = await res.json();
    setSession(data);
    return true;
  }, []);

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

  const createSession = useCallback(async (name?: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name ?? "Sessão" }),
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

  const addToQueue = useCallback(async (songId: number, musica: string, artista: string, singerName: string): Promise<boolean> => {
    if (!sessionId) return false;
    try {
      const res = await fetch(`/api/sessions/${sessionId}/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: songId, musica, artista, singerName }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setSession((prev) => prev ? { ...prev, queue: data.queue } : null);
      return true;
    } catch {
      return false;
    }
  }, [sessionId]);

  const removeFromQueue = useCallback(async (songId: number): Promise<boolean> => {
    if (!sessionId) return false;
    try {
      const res = await fetch(`/api/sessions/${sessionId}/queue/${songId}`, { method: "DELETE" });
      if (!res.ok) return false;
      const data = await res.json();
      setSession((prev) => prev ? { ...prev, queue: data.queue } : null);
      return true;
    } catch {
      return false;
    }
  }, [sessionId]);

  const advanceQueue = useCallback(async (): Promise<boolean> => {
    if (!sessionId) return false;
    try {
      const res = await fetch(`/api/sessions/${sessionId}/next`, { method: "POST" });
      if (!res.ok) return false;
      const data = await res.json();
      setSession((prev) => prev ? {
        ...prev,
        queue: data.queue,
        currentSongId: data.next ? String(data.next.id) : null,
        currentSongStartedAt: data.next ? new Date().toISOString() : null,
      } : null);
      return true;
    } catch {
      return false;
    }
  }, [sessionId]);

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

  const value: SessionContextType = {
    session, loading, error,
    createSession, joinSession, addToQueue,
    removeFromQueue, advanceQueue, playSong, leaveSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
