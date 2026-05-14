import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

interface LocalMusicContextType {
  folderName: string | null;
  selectFolder: () => void;
  getFileUrl: (id: number) => string | null;
  clearFolder: () => void;
}

const LocalMusicContext = createContext<LocalMusicContextType | null>(null);

export function LocalMusicProvider({ children }: { children: ReactNode }) {
  const [folderName, setFolderName] = useState<string | null>(null);
  const [fileMap, setFileMap] = useState<Map<string, string>>(new Map());
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectFolder = useCallback(() => {
    if (!inputRef.current) {
      const input = document.createElement("input");
      input.type = "file";
      input.setAttribute("webkitdirectory", "");
      input.setAttribute("multiple", "");
      input.style.display = "none";
      input.addEventListener("change", () => {
        const files = input.files;
        if (!files || files.length === 0) return;

        // Revoke old blob URLs
        setFileMap((prev) => {
          prev.forEach((url) => URL.revokeObjectURL(url));
          return new Map();
        });

        const newMap = new Map<string, string>();
        let detectedFolderName = "";

        for (let i = 0; i < files.length; i++) {
          const file = files[i]!;
          // Extract just the filename without extension as key
          const name = file.name.toLowerCase();
          if (name.endsWith(".mp4")) {
            const key = file.name.replace(/\.mp4$/i, "");
            newMap.set(key, URL.createObjectURL(file));
          }
          // Detect folder name from relative path (e.g. "musicas/12345.mp4")
          if (!detectedFolderName && file.webkitRelativePath) {
            detectedFolderName = file.webkitRelativePath.split("/")[0] ?? "";
          }
        }

        setFileMap(newMap);
        setFolderName(detectedFolderName || `${newMap.size} músicas carregadas`);
        document.body.removeChild(input);
        inputRef.current = null;
      });
      document.body.appendChild(input);
      inputRef.current = input;
    }
    inputRef.current?.click();
  }, []);

  const getFileUrl = useCallback(
    (id: number): string | null => {
      return fileMap.get(String(id)) ?? null;
    },
    [fileMap],
  );

  const clearFolder = useCallback(() => {
    setFileMap((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return new Map();
    });
    setFolderName(null);
  }, []);

  return (
    <LocalMusicContext.Provider value={{ folderName, selectFolder, getFileUrl, clearFolder }}>
      {children}
    </LocalMusicContext.Provider>
  );
}

export function useLocalMusic() {
  const ctx = useContext(LocalMusicContext);
  if (!ctx) throw new Error("useLocalMusic must be used within LocalMusicProvider");
  return ctx;
}
