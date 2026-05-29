import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

interface BunnyPlayerProps {
  videoId: string | number;
  duration?: number; // Duration in seconds (from musicas table)
  onEnded: () => void;
  onError?: () => void;
}

export function BunnyPlayer({ videoId, duration, onEnded, onError }: BunnyPlayerProps) {
  const id = typeof videoId === "string" ? videoId : String(videoId);
  const [retryKey, setRetryKey] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [hasProgressed, setHasProgressed] = useState(false);

  const endedCalled = useRef(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const codecCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTime = useRef<number>(0);
  const lastTimeUpdate = useRef<number>(0);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);

  // Refs for callbacks so we don't re-run effect when they change
  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);
  onEndedRef.current = onEnded;
  onErrorRef.current = onError;

  // Fallback: use duration from DB if available, otherwise 1 min
  const FALLBACK_DURATION_MS = (duration && duration > 0) ? (duration + 5) * 1000 : 60 * 1000;

  const libraryId = import.meta.env.VITE_BUNNY_LIBRARY_ID || "670590";
  const iframeUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${id}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`;

  const callEnded = () => {
    if (endedCalled.current) return;
    endedCalled.current = true;
    if (fallbackTimer.current) { clearTimeout(fallbackTimer.current); fallbackTimer.current = null; }
    if (codecCheckTimer.current) { clearTimeout(codecCheckTimer.current); codecCheckTimer.current = null; }
    console.log("[BunnyPlayer] Video ended, calling onEnded");
    onEndedRef.current();
  };

  useEffect(() => {
    endedCalled.current = false;
    setHasError(false);
    setHasProgressed(false);
    startTime.current = Date.now();
    lastTimeUpdate.current = 0;
    currentTimeRef.current = 0;
    durationRef.current = 0;

    const handler = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;

      // Track timeupdate for real playback progress
      if (e.data.method === "timeupdate" || e.data.event === "timeupdate") {
        const time = e.data.currentTime ?? e.data.current_time ?? e.data.time;
        const dur = e.data.duration ?? e.data.totalDuration ?? e.data.total_duration;
        if (typeof time === "number") {
          currentTimeRef.current = time;
          lastTimeUpdate.current = Date.now();
          if (time > 0) {
            setHasProgressed(true);
            setHasError(false);
          }
        }
        if (typeof dur === "number" && dur > 0) {
          durationRef.current = dur;
        }
        // Detect end via timeupdate
        if (typeof time === "number" && typeof dur === "number" && dur > 0 && time >= dur - 2) {
          console.log("[BunnyPlayer] timeupdate end detected", { time, dur });
          callEnded();
        }
      }

      // Track ended event
      if (e.data.method === "ended" || e.data.event === "ended") {
        console.log("[BunnyPlayer] ended event received", e.data);
        callEnded();
      }

      // Track error event
      if (e.data.method === "error" || e.data.event === "error") {
        console.log("[BunnyPlayer] error event received", e.data);
        setHasError(true);
      }

      // Detect end via progress
      if (e.data.method === "progress" || e.data.event === "progress") {
        const percent = e.data.percent ?? e.data.progress ?? e.data.percentage;
        if (typeof percent === "number" && percent >= 99) {
          console.log("[BunnyPlayer] progress end detected", { percent });
          callEnded();
        }
      }

      // Detect paused near end
      if (e.data.method === "paused" || e.data.event === "paused") {
        const time = e.data.currentTime ?? e.data.current_time ?? e.data.time;
        const dur = e.data.duration ?? e.data.totalDuration ?? e.data.total_duration;
        if (typeof time === "number" && typeof dur === "number" && dur > 0 && time >= dur - 5) {
          console.log("[BunnyPlayer] paused near end detected", { time, dur });
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

    // Codec error detection: if time hasn't advanced after 15s, treat as error
    codecCheckTimer.current = setTimeout(() => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      const timeSinceLastUpdate = (Date.now() - lastTimeUpdate.current) / 1000;
      if (currentTimeRef.current < 0.5 && timeSinceLastUpdate > 14 && !endedCalled.current) {
        console.warn(`[BunnyPlayer] Video not progressing after ${elapsed}s — codec error, currentTime=${currentTimeRef.current}`);
        setHasError(true);
        onErrorRef.current?.();
      }
    }, 15000);

    return () => {
      window.removeEventListener("message", handler);
      if (fallbackTimer.current) { clearTimeout(fallbackTimer.current); fallbackTimer.current = null; }
      if (codecCheckTimer.current) { clearTimeout(codecCheckTimer.current); codecCheckTimer.current = null; }
    };
  }, [id, retryKey, FALLBACK_DURATION_MS]);

  const handleRetry = () => {
    endedCalled.current = false;
    setRetryKey((k) => k + 1);
    setHasError(false);
    setHasProgressed(false);
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
      {/* Show error overlay if there's an error AND video hasn't actually progressed */}
      {hasError && !hasProgressed && (
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
