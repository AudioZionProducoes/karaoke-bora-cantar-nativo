import { useRef, useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";

interface BunnyPlayerProps {
  libraryId: string;
  videoId: string | number;
  onEnded: () => void;
}

export function BunnyPlayer({ videoId, onEnded }: BunnyPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resolution, setResolution] = useState<"720p" | "480p" | "360p">("720p");
  const [retryKey, setRetryKey] = useState(0);

  const id = typeof videoId === "string" ? videoId : String(videoId);

  // Use API proxy to bypass Bunny Stream referer/CORS issues
  // The proxy fetches from Bunny and streams MP4 directly
  const videoUrl = `/api/video-proxy/${id}?res=${resolution}&_cb=${retryKey}`;

  const handleError = useCallback(() => {
    if (resolution === "720p") setResolution("480p");
    else if (resolution === "480p") setResolution("360p");
  }, [resolution]);

  const handleRetry = useCallback(() => {
    setResolution("720p");
    setRetryKey((k) => k + 1);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black flex flex-col">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        controls
        autoPlay
        playsInline
        onEnded={onEnded}
        onError={handleError}
        crossOrigin="anonymous"
      />
      <button
        onClick={handleRetry}
        className="absolute top-4 right-4 z-50 bg-black/60 hover:bg-black/80 text-white rounded-lg px-3 py-2 flex items-center gap-2 text-xs"
      >
        <RotateCcw className="h-3 w-3" />
        Recarregar
      </button>
    </div>
  );
}
