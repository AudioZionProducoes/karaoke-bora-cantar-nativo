import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

interface BunnyPlayerProps {
  videoId: string | number;
  duration?: number;
  onEnded: () => void;
}

export function BunnyPlayer({ videoId, duration, onEnded }: BunnyPlayerProps) {
  const id = typeof videoId === "string" ? videoId : String(videoId);
  const [retryKey, setRetryKey] = useState(0);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const endedCalled = useRef(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activated = useRef(false);
  const startTime = useRef<number>(0);
  const lastKnownTime = useRef<number>(0);
  const knownDuration = useRef<number>(duration && duration > 0 ? duration : 0);

  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const FALLBACK_DURATION_MS = duration && duration > 0
    ? (duration + 5) * 1000
    : 5 * 60 * 1000;

  const libraryId = import.meta.env.VITE_BUNNY_LIBRARY_ID || "670590";
  const iframeUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${id}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`;

  // Send { command } to the Bunny player iframe
  // Bunny uses { command: "activate" | "play" | "pause" | ... }
  const sendCommand = (command: string, parameter?: unknown) => {
    try {
      const frame = iframeRef.current;
      if (!frame?.contentWindow) return;
      const msg = parameter !== undefined ? { command, parameter } : { command };
      frame.contentWindow.postMessage(msg, "*");
    } catch { /* cross-origin postMessage */ }
  };

  // Activate the Bunny player events (REQUIRED — without this wireUpEvents() is never called)
  const activateRef = useRef(false);
  const doActivate = () => {
    if (activateRef.current) return;
    activateRef.current = true;
    sendCommand("activate");
    console.log("[BunnyPlayer] sent activate");
  };

  useEffect(() => {
    endedCalled.current = false;
    activated.current = false;
    activateRef.current = false;
    setHasError(false);
    startTime.current = Date.now();
    lastKnownTime.current = 0;
    knownDuration.current = duration && duration > 0 ? duration : 0;

    const callEnded = () => {
      if (endedCalled.current) return;
      endedCalled.current = true;
      if (fallbackTimer.current) { clearTimeout(fallbackTimer.current); fallbackTimer.current = null; }
      console.log("[BunnyPlayer] onEnded fired");
      onEndedRef.current();
    };

    const handler = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;

      // Only handle Bunny Stream messages
      if (e.data.channel !== "bunnystream") return;

      const ev = e.data.event as string | undefined;
      // Time data lives inside status: { currentTime, duration, ended, paused, ... }
      const status = (e.data.status ?? {}) as Record<string, unknown>;

      if (!ev) return;

      // --- Video ended (native event) ---
      if (ev === "ended") {
        console.log("[BunnyPlayer] ended event");
        callEnded();
        return;
      }

      // --- Player ready: send activate to wire up events ---
      if (ev === "ready") {
        doActivate();
        return;
      }

      // --- Time update: extract from status.currentTime / status.duration ---
      if (ev === "timeupdate") {
        const time = typeof status.currentTime === "number" ? status.currentTime : null;
        const dur = typeof status.duration === "number" ? status.duration : null;

        if (time !== null) lastKnownTime.current = time;
        if (dur !== null && dur > 0) knownDuration.current = dur;

        // Check ended flag in status (belt + suspenders)
        if (status.ended === true) { callEnded(); return; }

        // Detect near end (within last 2 seconds)
        if (time !== null && knownDuration.current > 0 && time >= knownDuration.current - 2) {
          console.log("[BunnyPlayer] end via timeupdate", { time, dur: knownDuration.current });
          callEnded();
        }
        return;
      }

      // --- Pause near end = video ended ---
      if (ev === "pause") {
        const time = typeof status.currentTime === "number" ? status.currentTime : lastKnownTime.current;
        const dur = typeof status.duration === "number" ? status.duration : knownDuration.current;
        if (status.ended === true || (dur > 0 && time >= dur - 5)) {
          console.log("[BunnyPlayer] end via pause-near-end", { time, dur });
          callEnded();
        }
        return;
      }

      if (ev === "error") {
        console.warn("[BunnyPlayer] error event from player");
        setHasError(true);
      }
    };

    window.addEventListener("message", handler);

    // Fallback activate: send activate 1.5s after mount in case 'ready' event was missed
    const activateTimer = setTimeout(doActivate, 1500);

    // Fallback timer: fire onEnded if events never arrive
    fallbackTimer.current = setTimeout(() => {
      const elapsed = ((Date.now() - startTime.current) / 1000).toFixed(1);
      console.warn(`[BunnyPlayer] Fallback timer fired after ${elapsed}s`);
      callEnded();
    }, FALLBACK_DURATION_MS);

    console.log(`[BunnyPlayer] Started — videoId=${id}, fallback=${FALLBACK_DURATION_MS / 1000}s`);

    return () => {
      window.removeEventListener("message", handler);
      clearTimeout(activateTimer);
      if (fallbackTimer.current) { clearTimeout(fallbackTimer.current); fallbackTimer.current = null; }
    };
  }, [id, retryKey, FALLBACK_DURATION_MS]);

  return (
    <div className="absolute inset-0 bg-black">
      <iframe
        ref={iframeRef}
        key={`bunny-${id}-${retryKey}`}
        src={iframeUrl}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        title="Karaoke Video Player"
        onLoad={doActivate}
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
          Erro de reprodução — clique para tentar novamente
        </div>
      )}
    </div>
  );
}
