import { useEffect, useRef, useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";

interface BunnyPlayerProps {
  videoId: string | number;
  duration?: number; // Duration in seconds (from musicas table)
  onEnded: () => void;
}

export function BunnyPlayer({ videoId, duration, onEnded }: BunnyPlayerProps) {
  const id = typeof videoId === "string" ? videoId : String(videoId);
  const [retryKey, setRetryKey] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const endedCalled = useRef(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTime = useRef<number>(0);

  // Fallback: use duration from DB if available, otherwise 5 min
  const FALLBACK_DURATION_MS = (duration && duration > 0) ? (duration + 5) * 1000 : 5 * 60 * 1000;

  const libraryId = import.meta.env.VITE_BUNNY_LIBRARY_ID || "670590";
  const iframeUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${id}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`;

  const callEnded = useCallback(() => {
    console.log("[BunnyPlayer] callEnded called");
    if (endedCalled.current) return;
    endedCalled.current = true;
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current);
      fallbackTimer.current = null;
    }
    onEnded();
  }, [onEnded]);

  useEffect(() => {
    endedCalled.current = false;
    setHasError(false);
    setIsPlaying(false);
    startTime.current = Date.now();

    const handler = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;

      // Bunny Stream iframe events
      if (e.data.method === "ended" || e.data.event === "ended" || e.data.type === "ended") {
        console.log("[BunnyPlayer] ended event received", e.data);
        callEnded();
      }
      if (e.data.method === "play" || e.data.event === "play" || e.data.type === "play") {
        console.log("[BunnyPlayer] play event received");
        setIsPlaying(true);
        isPlayingRef.current = true;
        setHasError(false);
      }
      if (e.data.method === "error" || e.data.event === "error" || e.data.type === "error") {
        console.log("[BunnyPlayer] error event received", e.data);
        setHasError(true);
      }
      // Detect end via timeupdate (currentTime approaching duration)
      if (e.data.method === "timeupdate" || e.data.event === "timeupdate" || e.data.type === "timeupdate") {
        const currentTime = e.data.currentTime ?? e.data.current_time ?? e.data.time;
        const totalDuration = e.data.duration ?? e.data.totalDuration ?? e.data.total_duration;
        if (typeof currentTime === "number" && typeof totalDuration === "number" && totalDuration > 0 && currentTime >= totalDuration - 2) {
          console.log("[BunnyPlayer] timeupdate end detected", { currentTime, totalDuration });
          callEnded();
        }
      }
      // Detect end via progress (percent >= 99)
      if (e.data.method === "progress" || e.data.event === "progress" || e.data.type === "progress") {
        const percent = e.data.percent ?? e.data.progress ?? e.data.percentage;
        if (typeof percent === "number" && percent >= 99) {
          console.log("[BunnyPlayer] progress end detected", { percent });
          callEnded();
        }
      }
      // Detect paused near end
      if (e.data.method === "paused" || e.data.event === "paused" || e.data.type === "paused") {
        const currentTime = e.data.currentTime ?? e.data.current_time ?? e.data.time;
        const totalDuration = e.data.duration ?? e.data.totalDuration ?? e.data.total_duration;
        if (typeof currentTime === "number" && typeof totalDuration === "number" && totalDuration > 0 && currentTime >= totalDuration - 5) {
          console.log("[BunnyPlayer] paused near end detected", { currentTime, totalDuration });
          callEnded();
        }
      }
    };
    window.addEventListener("message", handler);

    // Fallback timer based on actual duration (plus 5s buffer)
    fallbackTimer.current = setTimeout(() => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      console.warn(`[BunnyPlayer] Fallback timer triggered after ${elapsed}s — no ended event received`);
      callEnded();
    }, FALLBACK_DURATION_MS);
    console.log(`[BunnyPlayer] Started fallback timer for ${FALLBACK_DURATION_MS}ms`);

    return () => {
      window.removeEventListener("message", handler);
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
        fallbackTimer.current = null;
      }
    };
  }, [id, retryKey, callEnded, FALLBACK_DURATION_MS]);

  const handleRetry = () => {
    endedCalled.current = false;
    setRetryKey((k) => k + 1);
    setHasError(false);
  };

  return (
    <div className="absolute inset-0 bg-black">
      <iframe
        key={`bunny-iframe-${id}-${retryKey}`}
        src={iframeUrl}
        className="absolute inset-0 w-full h-full border-0"
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
