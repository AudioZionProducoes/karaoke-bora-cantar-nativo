import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface LocalMusicContextType {
  directoryHandle: FileSystemDirectoryHandle | null;
  isSupported: boolean;
  selectFolder: () => Promise<void>;
  getFileUrl: (id: number) => Promise<string | null>;
  clearFolder: () => void;
}

const LocalMusicContext = createContext<LocalMusicContextType | null>(null);

export function LocalMusicProvider({ children }: { children: ReactNode }) {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [blobUrls, setBlobUrls] = useState<Map<number, string>>(new Map());

  const isSupported = "showDirectoryPicker" in window;

  const selectFolder = useCallback(async () => {
    if (!isSupported) return;
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: "read" });
      setDirectoryHandle(handle);
      // Clear any previously created blob URLs
      setBlobUrls((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return new Map();
      });
    } catch {
      // User cancelled picker — do nothing
    }
  }, [isSupported]);

  const getFileUrl = useCallback(
    async (id: number): Promise<string | null> => {
      if (!directoryHandle) return null;

      // Return cached blob URL if already created
      const cached = blobUrls.get(id);
      if (cached) return cached;

      try {
        const fileHandle = await directoryHandle.getFileHandle(`${id}.mp4`);
        const file = await fileHandle.getFile();
        const url = URL.createObjectURL(file);
        setBlobUrls((prev) => new Map(prev).set(id, url));
        return url;
      } catch {
        return null;
      }
    },
    [directoryHandle, blobUrls],
  );

  const clearFolder = useCallback(() => {
    setBlobUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return new Map();
    });
    setDirectoryHandle(null);
  }, []);

  return (
    <LocalMusicContext.Provider value={{ directoryHandle, isSupported, selectFolder, getFileUrl, clearFolder }}>
      {children}
    </LocalMusicContext.Provider>
  );
}

export function useLocalMusic() {
  const ctx = useContext(LocalMusicContext);
  if (!ctx) throw new Error("useLocalMusic must be used within LocalMusicProvider");
  return ctx;
}
