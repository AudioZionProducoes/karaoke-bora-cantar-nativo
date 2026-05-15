import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface QueueItem {
  id: number;
  musica: string;
  artista: string;
  singerName: string;
}

const MAX_QUEUE = 30;

interface QueueContextType {
  queue: QueueItem[];
  addToQueue: (item: QueueItem) => boolean;
  removeFromQueue: (id: number) => void;
  shiftQueue: () => QueueItem | null;
  clearQueue: () => void;
  isInQueue: (id: number) => boolean;
}

const QueueContext = createContext<QueueContextType | null>(null);

export function QueueProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const addToQueue = useCallback((item: QueueItem): boolean => {
    let added = false;
    setQueue((prev) => {
      if (prev.length >= MAX_QUEUE) return prev;
      if (prev.some((q) => q.id === item.id)) return prev;
      added = true;
      return [...prev, item];
    });
    return added;
  }, []);

  const removeFromQueue = useCallback((id: number) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const shiftQueue = useCallback((): QueueItem | null => {
    let first: QueueItem | null = null;
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      first = prev[0]!;
      return prev.slice(1);
    });
    return first;
  }, []);

  const clearQueue = useCallback(() => setQueue([]), []);

  const isInQueue = useCallback((id: number) => queue.some((q) => q.id === id), [queue]);

  return (
    <QueueContext.Provider value={{ queue, addToQueue, removeFromQueue, shiftQueue, clearQueue, isInQueue }}>
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error("useQueue must be used within QueueProvider");
  return ctx;
}
