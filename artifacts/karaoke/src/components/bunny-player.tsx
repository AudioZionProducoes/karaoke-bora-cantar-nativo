import { useEffect, useRef, useState } from "react";
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

  const endedCalled = useRef(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTime = useRef<number>(0);

  // Keep latest onEnded in ref so effect doesn't re-run when callback changes
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  // Fallback: use duration from DB if available (+5s buffer), otherwise 5 min
  const FALLBACK_DURATION_MS = duration && duration > 0
    ? (duration + 5) * 1000
    : 5 * 60 * 1000;

  const libraryId = import.meta.env.VITE_BUNNY_LIBRARY_ID || "670590";
  const iframeUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${id}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`;

  useEffect(() => {
    endedCalled.current = false;
    setHasError(false);
    startTime.current = Date.now();

    const callEnded = () => {
      if (endedCalled.current) return;
      endedCalled.current = true;
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
        fallbackTimer.current = null;
      }
      console.log("[BunnyPlayer] onEnded called");
      onEndedRef.current();
    };

    const handler = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;

      const ev = e.data.method ?? e.data.event ?? e.data.type;

      if (ev === "ended") {
        console.log("[BunnyPlayer] ended event");
        callEnded();
        return;
      }

      if (ev === "timeupdate") {
        const time = e.data.currentTime ?? e.data.current_time ?? e.data.time;
        const dur = e.data.duration ?? e.data.totalDuration ?? e.data.total_duration;
        if (typeof time === "number" && typeof dur === "number" && dur > 0 && time >= dur - 2) {
          console.log("[BunnyPlayer] end via timeupdate", { time, dur });
          callEnded();
        }
        return;
      }

      if (ev === "progress") {
        const pct = e.data.percent ?? e.data.progress ?? e.data.percentage;
        if (typeof pct === "number" && pct >= 99) {
          console.log("[BunnyPlayer] end via progress", pct);
          callEnded();
        }
        return;
      }

      if (ev === "paused") {
        const time = e.data.currentTime ?? e.data.current_time ?? e.data.time;
        const dur = e.data.duration ?? e.data.totalDuration ?? e.data.total_duration;
        if (typeof time === "number" && typeof dur === "number" && dur > 0 && time >= dur - 5) {
          console.log("[BunnyPlayer] end via paused-near-end", { time, dur });
          callEnded();
        }
        return;
      }

      if (ev === "error") {
        console.warn("[BunnyPlayer] error event from iframe");
        setHasError(true);
      }
    };

    window.addEventListener("message", handler);

    // Fallback: fire onEnded when expected duration elapses
    fallbackTimer.current = setTimeout(() => {
      const elapsed = ((Date.now() - startTime.current) / 1000).toFixed(1);
      console.warn(`[BunnyPlayer] Fallback fired after ${elapsed}s`);
      callEnded();
    }, FALLBACK_DURATION_MS);

    console.log(`[BunnyPlayer] Ready — fallback in ${FALLBACK_DURATION_MS / 1000}s`);

    return () => {
      window.removeEventListener("message", handler);
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
        fallbackTimer.current = null;
      }
    };
  }, [id, retryKey, FALLBACK_DURATION_MS]);

  return (
    <div className="absolute inset-0 bg-black">
      <iframe
        key={`bunny-${id}-${retryKey}`}
        src={iframeUrl}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        title="Karaoke Video Player"
      />
      {hasError && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 bg-black/80 border border-white/20 rounded-lg px-4 py-2 flex items-center gap-2 text-xs text-white/70">
          <RotateCcw
            className="h-3 w-3 cursor-pointer hover:text-white"
            onClick={() => {
              endedCalled.current = false;
              setRetryKey((k) => k + 1);
              setHasError(false);
            }}
          />
          Erro de codec — clique para tentar novamente
        </div>
      )}
    </div>
  );
}
