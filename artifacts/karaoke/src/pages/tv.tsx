import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useGetMusica, useSearchMusicas } from "@workspace/api-client-react";
import { useSession } from "@/hooks/use-session";
import { useToast } from "@/hooks/use-toast";
import type { SessionQueueItem } from "@/contexts/session-context";
import { useLocalMusic } from "@/contexts/local-music-context";
import { useDebounce } from "@/hooks/use-debounce";
import { useScoringEnabled } from "@/hooks/use-scoring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QRCode from "react-qr-code";
import { ListMusic, UserRound, Play, ArrowLeft, Monitor, Smartphone, X, Search, Plus, Trash2 } from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";
import { AddToQueueDialog, type QueueCandidate } from "@/components/add-to-queue-dialog";
import { BunnyPlayer } from "@/components/bunny-player";

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
  singerName, musica, artista, nextItem, onNext, onClose, autoAdvanceSeconds,
}: {
  singerName: string; musica: string; artista: string;
  nextItem: SessionQueueItem | null;
  onNext: () => void; onClose: () => void;
  autoAdvanceSeconds: number | null;
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

  // Countdown timer for auto-advance
  const [countdown, setCountdown] = useState(autoAdvanceSeconds ?? 0);
  useEffect(() => {
    if (!autoAdvanceSeconds || !done) return;
    setCountdown(autoAdvanceSeconds);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          nextRef.current?.();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoAdvanceSeconds, done]);

  const circumference = 2 * Math.PI * 70;
  const ringOffset = circumference * (1 - displayed / 100);

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md text-white p-6 animate-in fade-in duration-500">
      <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-primary/30 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-1/2 h-64 bg-black/20 blur-[120px] rounded-full pointer-events-none translate-y-1/2" />

      <div className="flex items-center gap-2 mb-3 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5">
        <UserRound className="h-4 w-4 text-primary" />
        <span className="font-bold text-lg text-white">{singerName}</span>
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
            <span className="ml-2 text-xs text-primary-foreground/60">
              {autoAdvanceSeconds && done ? `(${countdown}s)` : "(Enter)"}
            </span>
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
  const [, navigate] = useLocation();
  const { session, joinSession, addToQueue, playSong, setMode, removeFromQueue, isHost, leaveSession, exitSession } = useSession();
  const { toast } = useToast();
  const { getFileUrl } = useLocalMusic();

  const libraryId = import.meta.env.VITE_BUNNY_LIBRARY_ID || "670590";
  const isLibraryConfigured = libraryId && libraryId !== "CONFIGURE_LIBRARY_ID";

  const currentSongId = session?.currentSongId ? Number(session.currentSongId) : null;
  const { data: musica } = useGetMusica(currentSongId ?? 0, {
    query: { queryKey: ["musica", currentSongId ?? 0], enabled: !!currentSongId && currentSongId > 0 }
  });

  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showScore, setShowScore] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const [pendingItem, setPendingItem] = useState<QueueCandidate | null>(null);

  // Scoring toggle
  const [scoringEnabled, setScoringEnabled] = useScoringEnabled();

  // TV-side search panel
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { data: searchResults, isLoading: searching } = useSearchMusicas({
    q: debouncedSearch, page: 1, limit: 12,
  });

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

  // Ref to hold latest handleNext for event listeners (declared before handleNext)
  const handleNextRef = useRef<() => void>(() => {});

  const handleVideoEnd = useCallback(() => {
    console.log("[TV] handleVideoEnd called", { scoringEnabled });
    if (scoringEnabled) {
      console.log("[TV] scoringEnabled=true, setting showScore=true");
      setShowScore(true);
    } else {
      console.log("[TV] scoringEnabled=false, calling handleNextRef");
      handleNextRef.current();
    }
  }, [scoringEnabled]);

  const [skipError, setSkipError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionCountdown, setTransitionCountdown] = useState(10);

  // Frozen song data for transition screen (so polling doesn't swap names mid-transition)
  interface NextSongSnapshot {
    singerName: string;
    musica: string;
    artista: string;
  }
  const nextSongRef = useRef<NextSongSnapshot | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const skipTransition = useCallback(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (transitionIntervalRef.current) {
      clearInterval(transitionIntervalRef.current);
      transitionIntervalRef.current = null;
    }
    setIsTransitioning(false);
    nextSongRef.current = null;
    setVideoKey((k) => k + 1);
  }, []);

  const handleAddToQueue = useCallback(async (singerName: string) => {
    if (!pendingItem) return;
    const result = await addToQueue(pendingItem.id, pendingItem.musica, pendingItem.artista, singerName);
    if (result.ok) {
      toast({ title: "Adicionado à fila!", description: `${pendingItem.musica} — ${pendingItem.artista} para ${singerName}` });
    } else {
      toast({ title: "Erro", description: result.error ?? "Não foi possível adicionar.", variant: "destructive" });
    }
    setPendingItem(null);
  }, [pendingItem, addToQueue]);

  const handleNext = useCallback(async () => {
    // TV acts as the owner of the current song so it can always advance
    const ownerDeviceId = session?.currentSongAddedBy ?? "anon";
    try {
      const res = await fetch(`/api/sessions/${sessionId}/next`, {
        method: "POST",
        headers: { "X-Device-Id": ownerDeviceId },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSkipError(err.error ?? "Não foi possível pular");
        setTimeout(() => setSkipError(null), 3000);
        return;
      }
      const data = await res.json();
      setShowScore(false);
      // Smooth transition: show "Next Song" screen for 10s with countdown before starting
      if (data.next) {
        // Freeze the data from the API response so polling doesn't swap names mid-transition
        nextSongRef.current = {
          singerName: data.next.singerName,
          musica: data.next.musica,
          artista: data.next.artista,
        };
        setIsTransitioning(true);
        setTransitionCountdown(10);
        const interval = setInterval(() => {
          setTransitionCountdown((c) => {
            if (c <= 1) {
              clearInterval(interval);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
        transitionIntervalRef.current = interval;
        const timer = setTimeout(() => {
          clearInterval(interval);
          setIsTransitioning(false);
          nextSongRef.current = null;
          setVideoKey((k) => k + 1);
        }, 10000);
        transitionTimerRef.current = timer;
      } else {
        setVideoKey((k) => k + 1);
      }
    } catch {
      setSkipError("Erro de rede ao pular música");
      setTimeout(() => setSkipError(null), 3000);
    }
  }, [session?.currentSongAddedBy, sessionId]);

  // Keep handleNextRef always pointing to the latest handleNext
  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

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

      {/* Top header — clean single-row, minimal */}
      <header className="shrink-0 z-20 bg-black/60 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between px-3 py-1.5 gap-3">
          {/* Left — back + session code + search icon */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="text-white/40 hover:text-white/80 transition-colors p-1 rounded-full hover:bg-white/10"
              onClick={() => {
                exitSession();
                navigate("/");
              }}
              title="Voltar para home"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-yellow-400 tracking-wider">{sessionId}</span>
              <button
                className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-yellow-400/90 hover:bg-yellow-300 text-black transition-colors text-xs font-semibold"
                onClick={() => setShowSearch((s) => !s)}
                title="Buscar músicas"
              >
                <Search className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>Buscar</span>
              </button>
            </div>
          </div>

          {/* Center — Now playing (compact) */}
          {session && currentSongId && currentSinger && (
            <div className="hidden md:flex items-center gap-2 bg-yellow-500/10 border border-yellow-400/20 rounded-lg px-3 py-1">
              <div className="bg-yellow-400/20 rounded-full p-1">
                <UserRound className="h-3 w-3 text-yellow-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider leading-none">Agora Cantando</div>
                <div className="text-xs font-bold text-white leading-tight">{currentSinger}</div>
                <div className="text-[10px] text-white/60 leading-tight">{musica?.musica ?? "Música " + currentSongId}</div>
              </div>
            </div>
          )}

          {/* Right — Mode + Scoring + Timer */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isHost && session && (
              <Button
                size="sm"
                variant="ghost"
                className={`h-6 px-2 text-[10px] rounded-full border transition-colors ${
                  session.mode === "party"
                    ? "bg-[hsl(0_70%_50%/0.25)] border-[hsl(0_70%_50%/0.5)] text-[hsl(0_70%_60%)] hover:bg-[hsl(0_70%_50%/0.35)]"
                    : "bg-[hsl(142_70%_45%/0.25)] border-[hsl(142_70%_45%/0.5)] text-[hsl(142_70%_55%)] hover:bg-[hsl(142_70%_45%/0.35)]"
                }`}
                onClick={() => setMode(session.mode === "party" ? "home" : "party")}
                title={session.mode === "party" ? "Trocar para Modo Casa" : "Trocar para Modo Festa"}
              >
                {session.mode === "party" ? "Modo Festa" : "Modo Casa"}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className={`h-6 px-2 text-[10px] rounded-full border transition-colors ${
                scoringEnabled
                  ? "bg-[hsl(48_90%_50%/0.25)] border-[hsl(48_90%_50%/0.6)] text-[hsl(48_90%_60%)] hover:bg-[hsl(48_90%_50%/0.35)]"
                  : "bg-[hsl(0_70%_50%/0.25)] border-[hsl(0_70%_50%/0.5)] text-[hsl(0_70%_60%)] hover:bg-[hsl(0_70%_50%/0.35)]"
              }`}
              onClick={() => setScoringEnabled(!scoringEnabled)}
              title={scoringEnabled ? "Desativar pontuação" : "Ativar pontuação"}
            >
              {scoringEnabled ? "Com Pontuação" : "Sem Pontuação"}
            </Button>
            <CountdownTimer alwaysShow size="lg" />
          </div>
        </div>
      </header>

      {/* Queue bar — horizontal scrolling list of upcoming songs */}
      {session && session.queue.length > 0 && (
        <div className="shrink-0 bg-black/40 backdrop-blur-sm border-b border-white/5 overflow-x-auto">
          <div className="flex items-center gap-1 px-3 py-1 min-w-0">
            {/* Up next — only show queue items, current song is in header */}
            {session.queue.map((item, i) => {
              const isCurrent = item.id === currentSongId;
              if (isCurrent) return null;
              return (
                <div
                  key={item.id}
                  className="shrink-0 flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-md px-2 py-1 hover:bg-white/10 transition-colors"
                >
                  <span className="text-[9px] font-mono text-white/30">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-white leading-tight truncate max-w-[100px]">{item.singerName}</div>
                    <div className="text-[9px] text-white/50 leading-tight truncate max-w-[100px]">{item.musica}</div>
                  </div>
                  {!currentSongId && i === 0 && (
                    <button
                      className="text-primary hover:text-yellow-300 transition-colors"
                      onClick={() => playSong(item.id)}
                      title="Tocar"
                    >
                      <Play className="h-2.5 w-2.5" />
                    </button>
                  )}
                  <button
                    className="text-white/20 hover:text-red-400 transition-colors"
                    onClick={() => removeFromQueue(item.id)}
                    title="Remover"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Video Player */}
      <div className="flex-1 bg-black relative overflow-hidden" style={{ minHeight: "0" }}>
        {isTransitioning && nextSongRef.current ? (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black text-white animate-in fade-in duration-500">
            <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-primary/30 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
            <div className="bg-primary/10 border-2 border-primary/40 rounded-2xl px-10 py-8 flex flex-col items-center shadow-2xl shadow-primary/20">
              <p className="text-primary font-bold uppercase tracking-widest text-sm mb-4">Próximo a Cantar</p>
              <div className="flex items-center gap-3 mb-5 bg-primary/20 border border-primary/30 rounded-full px-8 py-3">
                <UserRound className="h-6 w-6 text-primary" />
                <span className="font-bold text-4xl text-white">{nextSongRef.current.singerName}</span>
              </div>
              <h2 className="text-3xl font-bold mb-2 line-clamp-1 text-center">{nextSongRef.current.musica}</h2>
              <p className="text-muted-foreground text-base mb-8">{nextSongRef.current.artista}</p>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <p className="text-muted-foreground text-base mb-4">Preparando em <span className="text-primary font-bold text-xl">{transitionCountdown}s</span>...</p>
              <Button
                onClick={skipTransition}
                className="bg-green-600 hover:bg-green-500 text-white font-bold text-lg px-8 py-3 rounded-full shadow-lg shadow-green-900/30 transition-all hover:scale-105"
              >
                <Play className="h-5 w-5 mr-2 fill-white" />
                Começar Agora
              </Button>
            </div>
          </div>
        ) : isLibraryConfigured && currentSongId ? (
          !musica?.bunnyGuid ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : (
            <BunnyPlayer
              key={`bunny-${currentSongId}`}
              videoId={musica.bunnyGuid}
              duration={musica?.duration ?? undefined}
              onEnded={handleVideoEnd}
            />
          )
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
          <div className="text-center p-8 flex flex-col items-center justify-center h-full">
            <img src="/logo.jpeg" alt="Karaokê Bora Cantar" className="h-72 w-72 md:h-96 md:w-96 object-contain mx-auto mb-8 rounded-3xl ring-4 ring-primary/40 shadow-[0_0_120px_rgba(250,204,21,0.35)] animate-pulse" />
            <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Bora Cantar!</h2>
            <p className="text-muted-foreground mb-6 text-base md:text-lg max-w-md">
              Escaneie o QR Code com seu celular e adicione músicas à fila.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 inline-block shadow-[0_0_40px_rgba(250,204,21,0.15)]">
              <QRCode value={remoteUrl} size={180} bgColor="transparent" fgColor="#fff" />
            </div>
          </div>
        )}

        {/* End song button — always visible during playback */}
        {currentSongId && (
          <button
            type="button"
            className="absolute bottom-4 left-4 z-30 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-white/80 hover:text-white transition-colors"
            onClick={handleVideoEnd}
            title={scoringEnabled ? "Encerrar música e ver pontuação" : "Pular para próxima música"}
          >
            <Play className="h-3 w-3 fill-white" />
            {scoringEnabled ? "Encerrar / Pontuação" : "Próxima música"}
          </button>
        )}

        {/* Logo watermark — top-right corner of video area */}
        <img src="/logo.jpeg" alt="Karaokê Bora Cantar" className="absolute top-2 right-2 md:top-4 md:right-4 z-10 h-20 w-20 md:h-28 md:w-28 object-contain rounded-lg md:rounded-xl opacity-60 pointer-events-none shadow-lg shadow-black/40" />

        {/* QR Code overlay — inside video area, bottom-right with purple highlight */}
        <div className="absolute bottom-4 right-4 z-30 bg-[#f5c800] backdrop-blur-sm border border-black/20 rounded-xl p-3 flex flex-col items-center gap-1 shadow-lg shadow-black/30">
          <div className="bg-white rounded-md p-1">
            <QRCode value={remoteUrl} size={56} bgColor="#ffffff" fgColor="#000000" />
          </div>
          <div className="text-[9px] text-center text-black leading-tight max-w-[72px] font-bold">
            <Smartphone className="h-2.5 w-2.5 mx-auto mb-0.5 text-black" />
            Controle Remoto
          </div>
        </div>
      </div>

      {/* Search dropdown — compact, below header */}
      {showSearch && (
        <div className="absolute top-[52px] left-0 right-0 z-50 bg-[#0a0a0a]/98 border-b border-primary/30 shadow-[0_8px_32px_rgba(250,204,21,0.15)] flex flex-col max-h-[70vh]">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/70" />
              <Input
                autoFocus
                placeholder="Buscar música, artista ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-black/50 border-primary/30 text-white placeholder:text-white/40 h-9 focus-visible:ring-primary/50"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/10 h-8 px-2 shrink-0" onClick={() => { setShowSearch(false); setSearchTerm(""); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 px-3 pb-3">
            {searching && (
              <div className="text-center py-4 text-white/50 text-sm">Buscando...</div>
            )}
            {searchResults && searchResults.data.length === 0 && debouncedSearch && (
              <div className="text-center py-4 text-white/50 text-sm">Nenhuma música encontrada.</div>
            )}
            {searchResults && searchResults.data.length > 0 && (
              <div className="flex flex-col gap-1">
                {searchResults.data.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 rounded-lg px-3 py-2 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white truncate">{m.musica}</div>
                      <div className="text-xs text-white/60 truncate">{m.artista} <span className="text-primary/70 font-mono">#{m.id}</span></div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] h-7 px-2"
                        onClick={() => setPendingItem({ id: m.id, musica: m.musica, artista: m.artista })}
                      >
                        <Plus className="h-3 w-3 mr-1" />Fila
                      </Button>
                      <div
                        role="button"
                        className="cursor-pointer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: '6px',
                          backgroundColor: '#facc15',
                          height: '28px',
                          padding: '0 8px',
                          fontSize: '10px',
                          fontWeight: 500,
                          gap: '4px'
                        }}
                        onClick={async () => {
                          // Play immediately without adding to queue
                          await playSong(m.id);
                          setShowSearch(false);
                          setSearchTerm("");
                          toast({ title: "Tocando agora!", description: `${m.musica} — ${m.artista}` });
                        }}
                      >
                        <Play style={{ height: '12px', width: '12px', color: '#000000', flexShrink: 0 }} />
                        <span style={{ color: '#000000' }}>Tocar</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add to queue dialog */}
      <AddToQueueDialog item={pendingItem} onConfirm={handleAddToQueue} onCancel={() => setPendingItem(null)} />

      {/* Score overlay — always show if video ended and we have song data */}
      {showScore && musica && (
        <ScoreOverlay
          singerName={currentSinger || "Anônimo"}
          musica={musica.musica}
          artista={musica.artista}
          nextItem={nextItem}
          onNext={handleNext}
          onClose={() => setShowScore(false)}
          autoAdvanceSeconds={5}
        />
      )}
    </div>
  );
}
