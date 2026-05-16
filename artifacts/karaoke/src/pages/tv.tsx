import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, Link } from "wouter";
import { useGetMusica } from "@workspace/api-client-react";
import { useSession } from "@/hooks/use-session";
import type { SessionQueueItem } from "@/contexts/session-context";
import { useLocalMusic } from "@/contexts/local-music-context";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";
import { ListMusic, UserRound, Play, ArrowLeft, Monitor, Smartphone, X } from "lucide-react";

function generateScore(singerName: string): { score: number; stars: number; label: string } {
  const score = Math.floor(Math.random() * 21) + 80;
  const stars = score >= 95 ? 5 : score >= 90 ? 4 : score >= 85 ? 3 : 2;
  const label = score === 100 ? "Perfeito!" : score >= 95 ? "Incrível!" : score >= 90 ? "Excelente!" : score >= 85 ? "Muito Bom!" : "Bom trabalho!";
  return { score, stars, label };
}

function useRouletteScore(finalScore: number) {
  const [displayed, setDisplayed] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed(0);
    setDone(false);
    const duration = 2500;
    const start = performance.now();
    let raf = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // easeOutQuart — starts fast, decelerates near the end
      const eased = 1 - Math.pow(1 - t, 4);
      const current = Math.round(eased * finalScore);
      setDisplayed(current);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [finalScore]);

  return { displayed, done };
}

function ScoreOverlay({
  singerName, musica, artista, nextItem, onNext, onClose,
}: {
  singerName: string; musica: string; artista: string;
  nextItem: SessionQueueItem | null;
  onNext: () => void; onClose: () => void;
}) {
  const result = useMemo(() => generateScore(singerName), [singerName]);
  const { displayed, done } = useRouletteScore(result.score);
  const nextRef = useRef(onNext);
  nextRef.current = onNext;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" && nextRef.current) nextRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const circumference = 2 * Math.PI * 70;
  const ringOffset = circumference * (1 - displayed / 100);

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md text-white p-6 animate-in fade-in duration-500">
      <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-primary/30 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-1/2 h-64 bg-black/20 blur-[120px] rounded-full pointer-events-none translate-y-1/2" />

      <div className="flex items-center gap-2 mb-3 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5">
        <UserRound className="h-4 w-4 text-primary" />
        <span className="font-bold text-lg text-primary">{singerName}</span>
      </div>
      <h2 className="text-2xl font-bold mb-1 line-clamp-1 text-center">{musica}</h2>
      <p className="text-muted-foreground text-sm mb-6">{artista}</p>

      <div className="relative flex items-center justify-center mb-6">
        <svg width="180" height="180" viewBox="0 0 160 160" className="-rotate-90">
          <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle cx="80" cy="80" r="70" fill="none" stroke="url(#scoreGrad)" strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${ringOffset}`}
            style={{ transition: "stroke-dashoffset 50ms linear" }} />
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`tabular-nums leading-none font-black ${done ? "text-5xl text-white" : "text-4xl text-primary"} transition-colors duration-300`}>
            {displayed}
          </span>
          <span className="text-muted-foreground text-xs mt-1">pontos</span>
        </div>
      </div>

      <div className="h-8 mb-4 flex items-center justify-center">
        {done ? (
          <p className="text-xl font-bold text-primary animate-in zoom-in duration-300">{result.label}</p>
        ) : (
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}
      </div>

      {nextItem ? (
        <div className="mb-6 w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-4 text-left">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ListMusic className="h-3 w-3" />Próximo na fila
          </p>
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 rounded-full p-2 shrink-0">
              <UserRound className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-base line-clamp-1">{nextItem.singerName}</div>
              <div className="text-sm text-muted-foreground line-clamp-1">{nextItem.musica} — {nextItem.artista}</div>
            </div>
          </div>
          <Button className="w-full mt-3 bg-primary hover:bg-primary/90 text-white font-bold" onClick={onNext}>
            <Play className="h-4 w-4 mr-2" />
            Começar — {nextItem.singerName}
            <span className="ml-2 text-xs text-primary-foreground/60">(Enter)</span>
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground mb-6">Fila vazia. Aguardando próxima música...</p>
      )}

      <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/10">
        <X className="h-4 w-4 mr-2" />Fechar pontuação
      </Button>
    </div>
  );
}

export default function TVPage() {
  const params = useParams();
  const sessionId = params.sessionId?.toUpperCase() ?? "";
  const { session, joinSession, advanceQueue } = useSession();
  const { getFileUrl } = useLocalMusic();

  const libraryId = import.meta.env.VITE_BUNNY_LIBRARY_ID;
  const isLibraryConfigured = libraryId && libraryId !== "CONFIGURE_LIBRARY_ID";

  const currentSongId = session?.currentSongId ? Number(session.currentSongId) : null;
  const { data: musica } = useGetMusica(currentSongId ?? 0, {
    query: { queryKey: ["musica", currentSongId ?? 0], enabled: !!currentSongId && currentSongId > 0 }
  });

  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showScore, setShowScore] = useState(false);
  const [videoKey, setVideoKey] = useState(0);

  // Auto-join session on mount
  useEffect(() => {
    if (!sessionId) return;
    joinSession(sessionId).then((ok) => {
      setJoined(ok);
      if (!ok) setJoinError("Sessão não encontrada. Verifique o código.");
    });
  }, [sessionId, joinSession]);

  const remoteUrl = typeof window !== "undefined"
    ? `${window.location.origin}${import.meta.env.BASE_URL}remote/${sessionId}`
    : "";

  const localVideoUrl = musica ? getFileUrl(musica.id) : null;

  // When song changes, reset score and video
  useEffect(() => {
    setShowScore(false);
    setVideoKey((k) => k + 1);
  }, [session?.currentSongId]);

  const handleVideoEnd = useCallback(() => {
    setShowScore(true);
  }, []);

  const handleNext = useCallback(async () => {
    await advanceQueue();
    setShowScore(false);
  }, [advanceQueue]);

  if (!joined) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Monitor className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold mb-2">Conectando à sessão...</h1>
          {joinError && <p className="text-destructive mt-2">{joinError}</p>}
        </div>
      </div>
    );
  }

  const nextItem = session?.queue?.[0] ?? null;
  // Prefer the server-stored singer name; fall back to queue lookup only as backup
  const currentSinger = session?.currentSingerName
    ? session.currentSingerName
    : currentSongId
      ? session?.queue?.find(q => q.id === currentSongId)?.singerName ?? "Anônimo"
      : null;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-primary/20 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />

      {/* Top header bar — compact single row */}
      <header className="shrink-0 z-20 bg-black/70 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-1.5 px-3 py-1.5 flex-wrap">
          {/* Left controls — minimal */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/10 rounded-full bg-white/5 border border-white/10 h-7 px-2 text-xs">
                <ArrowLeft className="h-3 w-3 mr-1" />Sair
              </Button>
            </Link>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">TV</div>
            <div className="font-bold text-xs shrink-0">Sessão: <span className="text-primary">{sessionId}</span></div>
          </div>

          {/* Queue — flows right after Sessão, wraps like notebook lines */}
          {session && session.queue.length > 0 && (
            <>
              {/* Now playing badge */}
              {currentSongId && currentSinger && (
                <div className="shrink-0 flex items-center gap-2 bg-yellow-500/15 border border-yellow-400/40 rounded-lg px-3 py-1.5">
                  <div className="bg-yellow-400/20 rounded-full p-1">
                    <UserRound className="h-3 w-3 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider leading-none">Agora Cantando</div>
                    <div className="text-xs font-bold text-white leading-tight">{currentSinger}</div>
                    <div className="text-[10px] text-white/70 leading-tight">{musica?.musica ?? "Música " + currentSongId}</div>
                  </div>
                </div>
              )}

              {/* Up next items */}
              {session.queue.map((item, i) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 border ${
                    i === 0 && currentSongId !== item.id
                      ? "bg-primary/10 border-primary/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-primary leading-tight truncate">{item.singerName}</div>
                    <div className="text-[10px] text-white/70 leading-tight truncate">{item.musica}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Empty queue hint */}
          {(!session?.queue || session.queue.length === 0) && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ListMusic className="h-3 w-3" />
              Fila vazia — escaneie o QR Code para adicionar músicas
            </div>
          )}
        </div>
      </header>

      {/* Video Player */}
      <div className="flex-1 flex items-center justify-center bg-black min-h-0 relative">
        {isLibraryConfigured && currentSongId ? (
          <iframe
            key={`iframe-${currentSongId}`}
            src={`https://iframe.mediadelivery.net/embed/${libraryId}/${currentSongId}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`}
            className="w-full h-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          />
        ) : localVideoUrl ? (
          <video
            key={`local-${videoKey}`}
            src={localVideoUrl}
            className="w-full h-full object-contain"
            controls autoPlay
            onEnded={handleVideoEnd}
          />
        ) : currentSongId ? (
          <div className="text-center p-8">
            <p className="text-muted-foreground">Carregando música...</p>
          </div>
        ) : (
          <div className="text-center p-8">
            <ListMusic className="h-16 w-16 text-primary/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Aguardando músicas</h2>
            <p className="text-muted-foreground mb-4 text-sm max-w-sm">
              Use o celular para escanear o QR Code e adicionar músicas à fila.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 inline-block">
              <QRCode value={remoteUrl} size={160} bgColor="transparent" fgColor="#fff" />
            </div>
          </div>
        )}

        {/* QR Code overlay — inside video area, bottom-right with purple highlight */}
        <div className="absolute bottom-4 right-4 z-30 bg-[#f5c800] backdrop-blur-sm border border-black/20 rounded-xl p-3 flex flex-col items-center gap-1 shadow-lg shadow-black/30">
          <div className="bg-[#f5c800] rounded-md p-1">
            <QRCode value={remoteUrl} size={56} bgColor="#f5c800" fgColor="#000000" />
          </div>
          <div className="text-[9px] text-center text-black leading-tight max-w-[72px] font-bold">
            <Smartphone className="h-2.5 w-2.5 mx-auto mb-0.5 text-black" />
            Controle Remoto
          </div>
        </div>
      </div>

      {/* Score overlay */}
      {showScore && musica && currentSinger && (
        <ScoreOverlay
          singerName={currentSinger}
          musica={musica.musica}
          artista={musica.artista}
          nextItem={nextItem}
          onNext={handleNext}
          onClose={() => setShowScore(false)}
        />
      )}
    </div>
  );
}
