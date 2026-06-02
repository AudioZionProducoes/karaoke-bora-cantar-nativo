import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

interface NativePlayerProps {
  videoId: string | number;
  duration?: number;
  onEnded: () => void;
}

const BUNNY_CDN_HOST = "https://karaoke-cdn.b-cdn.net";

export function NativePlayer({ videoId, duration, onEnded }: NativePlayerProps) {
  const rawId = typeof videoId === "string" ? videoId : String(videoId);
  // Bunny Storage files may have zero-padding (e.g. 04937.mp4 vs 4937.mp4)
  const paddedId = rawId.length < 5 ? rawId.padStart(5, "0") : rawId;
  const [id, setId] = useState(rawId);
  const [useFallback, setUseFallback] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const endedCalled = useRef(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTime = useRef<number>(0);

  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const FALLBACK_DURATION_MS = duration && duration > 0
    ? (duration + 5) * 1000
    : 5 * 60 * 1000;

  // Format: https://karaoke-cdn.b-cdn.net/Catálogo/{id}.mp4
  const videoUrl = `${BUNNY_CDN_HOST}/Cat%C3%A1logo/${id}.mp4`;

  useEffect(() => {
    endedCalled.current = false;
    setHasError(false);
    setIsLoading(true);
    startTime.current = Date.now();

    const callEnded = () => {
      if (endedCalled.current) return;
      endedCalled.current = true;
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
        fallbackTimer.current = null;
      }
      console.log("[NativePlayer] onEnded fired");
      onEndedRef.current();
    };

    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      console.log("[NativePlayer] video ended event");
      callEnded();
    };

    const handleTimeUpdate = () => {
      if (!video.duration || video.duration <= 0) return;
      if (video.currentTime >= video.duration - 2) {
        console.log("[NativePlayer] end via timeupdate", {
          currentTime: video.currentTime,
          duration: video.duration,
        });
        callEnded();
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      console.log("[NativePlayer] canplay — video ready");
      video.play().catch(() => {
        // Autoplay blocked — user will need to click
      });
    };

    const handleError = () => {
      console.warn("[NativePlayer] error event", video.error);
      // If rawId failed, try zero-padded version once
      if (id === rawId && !useFallback) {
        console.log(`[NativePlayer] Retrying with padded ID: ${paddedId}`);
        setId(paddedId);
        setUseFallback(true);
        setHasError(false);
        setIsLoading(true);
        return;
      }
      setHasError(true);
      setIsLoading(false);
    };

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    video.addEventListener("ended", handleEnded);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);

    // Fallback timer
    fallbackTimer.current = setTimeout(() => {
      const elapsed = ((Date.now() - startTime.current) / 1000).toFixed(1);
      console.warn(`[NativePlayer] Fallback timer fired after ${elapsed}s`);
      callEnded();
    }, FALLBACK_DURATION_MS);

    console.log(`[NativePlayer] Started — videoId=${id}, url=${videoUrl}, fallback=${FALLBACK_DURATION_MS / 1000}s`);

    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
        fallbackTimer.current = null;
      }
    };
  }, [id, retryKey, FALLBACK_DURATION_MS, videoUrl]);

  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        key={`native-${id}-${retryKey}`}
        src={videoUrl}
        className="absolute inset-0 w-full h-full object-contain"
        controls={false}
        autoPlay
        playsInline
        muted={false}
        preload="metadata"
        crossOrigin="anonymous"
        title="Karaoke Video Player"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <span className="ml-3 text-white/70 text-sm">Carregando vídeo...</span>
        </div>
      )}
      {hasError && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 bg-black/80 border border-white/20 rounded-lg px-4 py-2 flex items-center gap-2 text-xs text-white/70">
          <RotateCcw
            className="h-3 w-3 cursor-pointer hover:text-white"
            onClick={() => {
              endedCalled.current = false;
              setRetryKey((k) => k + 1);
              setHasError(false);
              setIsLoading(true);
            }}
          />
          Erro de reprodução — clique para tentar novamente
        </div>
      )}
    </div>
  );
}
