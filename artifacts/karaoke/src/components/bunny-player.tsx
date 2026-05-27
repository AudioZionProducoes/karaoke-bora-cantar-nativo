import { useEffect, useRef, useState } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface BunnyPlayerProps {
  libraryId: string;
  videoId: string | number;
  onEnded: () => void;
}

const BUNNY_ORIGIN = "https://iframe.mediadelivery.net";

export function BunnyPlayer({ libraryId, videoId, onEnded }: BunnyPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onEndedRef = useRef(onEnded);
  const hasSubscribedRef = useRef(false);
  const lastTimeRef = useRef(0);
  const stallCountRef = useRef(0);
  const durationRef = useRef(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hlsErrorCountRef = useRef(0);
  const [loadError, setLoadError] = useState(false);
  const [useNativePlayer, setUseNativePlayer] = useState(false);
  const [nativeVideoUrl, setNativeVideoUrl] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  // Keep latest onEnded reference
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // Listen for Bunny Stream Player API messages AND console errors
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== BUNNY_ORIGIN) return;
      if (!e.data || typeof e.data !== "object") return;

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log("[BunnyPlayer] message:", JSON.stringify(e.data));
      }

      if (e.data.method === "event" && e.data.value === "ended") {
        onEndedRef.current();
        return;
      }
      if (e.data.method === "ended" || e.data.event === "ended" || e.data.type === "ended") {
        onEndedRef.current();
        return;
      }

      if (e.data.method === "currentTime" || e.data.method === "getCurrentTime") {
        const time = typeof e.data.value === "number" ? e.data.value : 0;
        if (time === lastTimeRef.current && time > 0) {
          stallCountRef.current++;
          if (stallCountRef.current >= 3 && time > 30) {
            onEndedRef.current();
          }
        } else {
          stallCountRef.current = 0;
        }
        lastTimeRef.current = time;
      }

      if (e.data.method === "duration" || e.data.method === "getDuration") {
        durationRef.current = typeof e.data.value === "number" ? e.data.value : 0;
      }
    };

    // HLS codec error fallback: after 5s if video never started, show error
    const fallbackTimer = setTimeout(() => {
      if (lastTimeRef.current === 0) {
        setLoadError(true);
      }
    }, 5000);

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(fallbackTimer);
    };
  }, [videoId, useNativePlayer]);

  // Subscribe to ended event + start time polling when iframe loads
  const handleLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const subscribeToEnded = () => {
      if (hasSubscribedRef.current) return;
      try {
        iframe.contentWindow?.postMessage(
          { method: "addEventListener", value: "ended" },
          BUNNY_ORIGIN
        );
        hasSubscribedRef.current = true;
      } catch {
        // Cross-origin errors are expected; try again
      }
    };

    subscribeToEnded();
    setTimeout(subscribeToEnded, 1000);
    setTimeout(subscribeToEnded, 3000);
    setTimeout(subscribeToEnded, 5000);

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    lastTimeRef.current = 0;
    stallCountRef.current = 0;
    durationRef.current = 0;
    hlsErrorCountRef.current = 0;
    pollIntervalRef.current = setInterval(() => {
      try {
        iframe.contentWindow?.postMessage(
          { method: "getCurrentTime" },
          BUNNY_ORIGIN
        );
        iframe.contentWindow?.postMessage(
          { method: "getDuration" },
          BUNNY_ORIGIN
        );
      } catch {
        // ignore
      }
    }, 5000);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleReload = () => {
    setIsReloading(true);
    setUseNativePlayer(false);
    setNativeVideoUrl(null);
    setLoadError(false);
    hlsErrorCountRef.current = 0;
    stallCountRef.current = 0;
    lastTimeRef.current = 0;
    hasSubscribedRef.current = false;
    setTimeout(() => setIsReloading(false), 500);
  };

  // Native HTML5 video player fallback
  if (useNativePlayer && nativeVideoUrl) {
    return (
      <div className="w-full h-full relative overflow-hidden bg-black flex flex-col">
        <video
          src={nativeVideoUrl}
          className="w-full h-full object-contain"
          controls
          autoPlay
          onEnded={onEnded}
          onError={() => {
            // Try lower resolution
            const guid = typeof videoId === "string" ? videoId : String(videoId);
            if (nativeVideoUrl.includes("720p")) {
              setNativeVideoUrl(`https://vz-90f80c4b-2f5.b-cdn.net/${guid}/play_480p.mp4`);
            } else if (nativeVideoUrl.includes("480p")) {
              setNativeVideoUrl(`https://vz-90f80c4b-2f5.b-cdn.net/${guid}/play_360p.mp4`);
            } else {
              setLoadError(true);
              setUseNativePlayer(false);
            }
          }}
        />
        <button
          onClick={handleReload}
          className="absolute top-4 right-4 z-50 bg-black/60 hover:bg-black/80 text-white rounded-lg px-3 py-2 flex items-center gap-2 text-xs"
        >
          <RotateCcw className="h-3 w-3" />
          Tentar player Bunny
        </button>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#04192c] text-white p-6">
        <AlertCircle className="h-12 w-12 text-yellow-400 mb-4" />
        <h3 className="text-lg font-bold mb-2">Erro de codec no vídeo</h3>
        <p className="text-sm text-white/60 text-center mb-4 max-w-md">
          O vídeo contém áudio AC3 (Dolby Digital) que não é compatível com navegadores.
          O arquivo precisa ser convertido para AAC antes de enviar ao Bunny Stream.
        </p>
        <div className="bg-black/40 rounded-lg p-4 mb-4 text-xs text-left font-mono text-yellow-300/80">
          <p className="mb-2 text-white/50">Comando FFmpeg:</p>
          ffmpeg -i 20758.mp4 -c:v copy -c:a aac -b:a 192k -ac 2 20758_aac.mp4
        </div>
        <button
          onClick={handleReload}
          className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-2 rounded-lg flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{ background: "#000" }}
    >
      <iframe
        ref={iframeRef}
        src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=true&loop=false&muted=false&preload=true`}
        className="border-0"
        style={{
          position: "absolute",
          top: "-16.5%",
          left: "-16.5%",
          width: "133%",
          height: "133%",
        }}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        onLoad={handleLoad}
        onError={() => setLoadError(true)}
        scrolling="no"
      />
      {isReloading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <span className="text-white text-sm animate-pulse">Recarregando...</span>
        </div>
      )}
    </div>
  );
}
