import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";

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
  const [loadError, setLoadError] = useState(false);

  // Keep latest onEnded reference
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // Listen for Bunny Stream Player API messages
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // Only accept messages from Bunny Stream origin
      if (e.origin !== BUNNY_ORIGIN) return;
      if (!e.data || typeof e.data !== "object") return;

      // Log all messages for debugging (development only)
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log("[BunnyPlayer] message:", JSON.stringify(e.data));
      }

      // Bunny Stream Player API event format: { method: "event", value: "ended", data: {} }
      if (e.data.method === "event" && e.data.value === "ended") {
        onEndedRef.current();
        return;
      }
      // Alternative formats (older API versions)
      if (e.data.method === "ended" || e.data.event === "ended" || e.data.type === "ended") {
        onEndedRef.current();
        return;
      }

      // Track current time for end-of-video detection (fallback)
      if (e.data.method === "currentTime" || e.data.method === "getCurrentTime") {
        const time = typeof e.data.value === "number" ? e.data.value : 0;
        if (time === lastTimeRef.current && time > 0) {
          stallCountRef.current++;
          // If time hasn't advanced for 3 consecutive polls (~15s) and we're past 30s, video likely ended
          if (stallCountRef.current >= 3 && time > 30) {
            if (import.meta.env.DEV) {
              // eslint-disable-next-line no-console
              console.log("[BunnyPlayer] Video appears ended (stall detected)");
            }
            onEndedRef.current();
          }
        } else {
          stallCountRef.current = 0;
        }
        lastTimeRef.current = time;
      }

      // Track duration for end-of-video detection
      if (e.data.method === "duration" || e.data.method === "getDuration") {
        durationRef.current = typeof e.data.value === "number" ? e.data.value : 0;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Subscribe to ended event + start time polling when iframe loads
  const handleLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const subscribeToEnded = () => {
      if (hasSubscribedRef.current) return;
      try {
        // Bunny Stream Player API: subscribe to 'ended' event
        iframe.contentWindow?.postMessage(
          { method: "addEventListener", value: "ended" },
          BUNNY_ORIGIN
        );
        hasSubscribedRef.current = true;
      } catch {
        // Cross-origin errors are expected; try again
      }
    };

    // Retry subscription a few times
    subscribeToEnded();
    setTimeout(subscribeToEnded, 1000);
    setTimeout(subscribeToEnded, 3000);
    setTimeout(subscribeToEnded, 5000);

    // Fallback: poll current time + duration every 5s to detect video end
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    lastTimeRef.current = 0;
    stallCountRef.current = 0;
    durationRef.current = 0;
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

  if (loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#04192c] text-white p-6">
        <AlertCircle className="h-12 w-12 text-yellow-400 mb-4" />
        <h3 className="text-lg font-bold mb-2">Vídeo não encontrado</h3>
        <p className="text-sm text-white/60 text-center mb-4">
          O vídeo da música (ID: {videoId}) ainda não foi carregado no Bunny Stream.
        </p>
        <p className="text-xs text-white/40 text-center">
          Library: {libraryId}
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{ background: "#000" }}
    >
      {/* Scaled-up iframe so the video fills the entire container.
         Bunny Stream’s Plyr player preserves the source aspect ratio
         (common for karaoke = 4:3) so on a 16:9 TV the video appears
         small and centred. We zoom the iframe 133 % and crop overflow. */}
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
    </div>
  );
}
