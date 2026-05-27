import { useEffect, useRef, useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";

interface BunnyPlayerProps {
  libraryId: string;
  videoId: string | number;
  onEnded: () => void;
}

export function BunnyPlayer({ libraryId, videoId, onEnded }: BunnyPlayerProps) {
  const id = typeof videoId === "string" ? videoId : String(videoId);
  const [retryKey, setRetryKey] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const endedCalled = useRef(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Default fallback duration (5 min) — most karaoke songs are 3-5 min
  const FALLBACK_DURATION_MS = 5 * 60 * 1000;

  const iframeUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${id}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`;

  const callEnded = useCallback(() => {
    if (endedCalled.current) return;
    endedCalled.current = true;
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current);
      fallbackTimer.current = null;
    }
    onEnded();
  }, [onEnded]);

  // Listen for postMessage events from Bunny Stream iframe
  useEffect(() => {
    endedCalled.current = false;
    setHasError(false);
    setIsPlaying(false);

    const handler = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;
      // Bunny Stream iframe events
      if (e.data.method === "ended" || e.data.event === "ended" || e.data.type === "ended") {
        callEnded();
      }
      if (e.data.method === "play" || e.data.event === "play" || e.data.type === "play") {
        setIsPlaying(true);
        setHasError(false);
      }
      if (e.data.method === "error" || e.data.event === "error" || e.data.type === "error") {
        setHasError(true);
      }
    };
    window.addEventListener("message", handler);

    // Fallback timer: if iframe doesn't send ended event, trigger after duration
    fallbackTimer.current = setTimeout(() => {
      console.warn("[BunnyPlayer] Fallback timer triggered — iframe did not send ended event");
      callEnded();
    }, FALLBACK_DURATION_MS);

    return () => {
      window.removeEventListener("message", handler);
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
        fallbackTimer.current = null;
      }
    };
  }, [id, retryKey, callEnded]);

  const handleRetry = () => {
    endedCalled.current = false;
    setRetryKey((k) => k + 1);
    setHasError(false);
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      <iframe
        key={`bunny-iframe-${id}-${retryKey}`}
        src={iframeUrl}
        className="w-full h-full border-0"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        title="Karaoke Video Player"
      />
      {hasError && !isPlaying && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <p className="text-white/60 text-sm mb-2">Erro ao carregar vídeo</p>
            <button
              onClick={handleRetry}
              className="bg-primary hover:bg-primary/90 text-black font-bold rounded-lg px-4 py-2 flex items-center gap-2 text-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
