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
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
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

  useEffect(() => {
    endedCalled.current = false;
    setHasError(false);
    startTime.current = Date.now();
    lastKnownTime.current = 0;
    knownDuration.current = duration && duration > 0 ? duration : 0;

    const callEnded = () => {
      if (endedCalled.current) return;
      endedCalled.current = true;
      if (fallbackTimer.current) { clearTimeout(fallbackTimer.current); fallbackTimer.current = null; }
      if (pollInterval.current) { clearInterval(pollInterval.current); pollInterval.current = null; }
      console.log("[BunnyPlayer] onEnded fired");
      onEndedRef.current();
    };

    const sendCommand = (method: string, value?: unknown) => {
      try {
        const frame = iframeRef.current;
        if (!frame?.contentWindow) return;
        const msg = value !== undefined ? { method, value } : { method };
        frame.contentWindow.postMessage(msg, "*");
      } catch { /* cross-origin postMessage is safe to ignore */ }
    };

    const handler = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;

      // Bunny Stream uses { event: "..." } but some versions use { method: "..." } or { type: "..." }
      const ev = e.data.event ?? e.data.method ?? e.data.type;

      // --- Fim do vídeo ---
      if (ev === "ended" || ev === "end") {
        console.log("[BunnyPlayer] ended event from player");
        callEnded();
        return;
      }

      // --- Atualização de tempo (Bunny usa "seconds", mas tratamos todas as variações) ---
      if (ev === "timeupdate") {
        const time = e.data.seconds ?? e.data.currentTime ?? e.data.current_time ?? e.data.time;
        const dur = e.data.duration ?? e.data.totalDuration ?? e.data.total_duration;
        if (typeof time === "number") lastKnownTime.current = time;
        if (typeof dur === "number" && dur > 0) knownDuration.current = dur;
        if (
          typeof time === "number" &&
          knownDuration.current > 0 &&
          time >= knownDuration.current - 2
        ) {
          console.log("[BunnyPlayer] end via timeupdate", { time, dur: knownDuration.current });
          callEnded();
        }
        return;
      }

      // --- Progresso (0-100%) ---
      if (ev === "progress") {
        const pct = e.data.percent ?? e.data.progress ?? e.data.percentage;
        if (typeof pct === "number" && pct >= 99) {
          console.log("[BunnyPlayer] end via progress", pct);
          callEnded();
        }
        return;
      }

      // --- Pause perto do fim = vídeo terminou ---
      if (ev === "pause" || ev === "paused") {
        const time = e.data.seconds ?? e.data.currentTime ?? e.data.current_time ?? e.data.time;
        const dur = e.data.duration ?? e.data.totalDuration ?? e.data.total_duration ?? knownDuration.current;
        if (typeof time === "number" && dur > 0 && time >= dur - 5) {
          console.log("[BunnyPlayer] end via pause-near-end", { time, dur });
          callEnded();
        }
        return;
      }

      // --- Resposta do comando getCurrentTime ---
      if (ev === "getCurrentTime" && typeof e.data.value === "number") {
        lastKnownTime.current = e.data.value;
        if (knownDuration.current > 0 && e.data.value >= knownDuration.current - 2) {
          console.log("[BunnyPlayer] end via getCurrentTime poll", e.data.value);
          callEnded();
        }
        return;
      }

      // --- Resposta do comando getDuration ---
      if (ev === "getDuration" && typeof e.data.value === "number" && e.data.value > 0) {
        knownDuration.current = e.data.value;
        return;
      }

      if (ev === "error") {
        console.warn("[BunnyPlayer] error event from iframe");
        setHasError(true);
      }
    };

    window.addEventListener("message", handler);

    // Polling ativo: a cada 1s envia getCurrentTime ao player.
    // Se o player não emitir eventos espontâneos, o poll detecta o fim.
    pollInterval.current = setInterval(() => {
      sendCommand("getCurrentTime");
      if (knownDuration.current === 0) sendCommand("getDuration");
    }, 1000);

    // Fallback: dispara onEnded após a duração esperada + margem
    fallbackTimer.current = setTimeout(() => {
      const elapsed = ((Date.now() - startTime.current) / 1000).toFixed(1);
      console.warn(`[BunnyPlayer] Fallback timer fired after ${elapsed}s`);
      callEnded();
    }, FALLBACK_DURATION_MS);

    console.log(`[BunnyPlayer] Started — libraryId=${libraryId}, videoId=${id}, fallback=${FALLBACK_DURATION_MS / 1000}s`);

    return () => {
      window.removeEventListener("message", handler);
      if (pollInterval.current) { clearInterval(pollInterval.current); pollInterval.current = null; }
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
