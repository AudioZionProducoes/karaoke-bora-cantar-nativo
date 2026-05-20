import { useEffect, useRef } from "react";

interface BunnyPlayerProps {
  libraryId: string;
  videoId: number;
  onEnded: () => void;
}

export function BunnyPlayer({ libraryId, videoId, onEnded }: BunnyPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onEndedRef = useRef(onEnded);
  const hasSubscribedRef = useRef(false);

  // Keep latest onEnded reference
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // Listen for Bunny Stream Player API messages
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && typeof e.data === "object") {
        // Bunny Stream Player API events
        if (e.data.method === "ended" || e.data.event === "ended") {
          onEndedRef.current();
        }
        // Alternative format Bunny might use
        if (e.data.type === "ended" || e.data.name === "ended") {
          onEndedRef.current();
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Subscribe to ended event when iframe loads
  const handleLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const subscribeToEnded = () => {
      if (hasSubscribedRef.current) return;
      try {
        // Bunny Stream Player API: subscribe to 'ended' event
        iframe.contentWindow?.postMessage(
          { method: "addEventListener", value: "ended" },
          "*"
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
  };

  return (
    <iframe
      ref={iframeRef}
      src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`}
      className="w-full h-full border-0"
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
      allowFullScreen
      onLoad={handleLoad}
    />
  );
}
