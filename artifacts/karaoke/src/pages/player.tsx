import { useParams, Link, useLocation } from "wouter";
import {
  ArrowLeft, Play, Music, AlertCircle, FolderOpen,
  Star, RotateCcw, Trophy, Search, X, Mic2,
  Smartphone, AlertTriangle, ArrowRight
} from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";
import { useGetMusica, getGetMusicaQueryKey, useSearchMusicas } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocalMusic } from "@/contexts/local-music-context";
import { useSession } from "@/hooks/use-session";
import { useTemporaryAccess } from "@/contexts/temporary-access-context";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import QRCodeLib from "react-qr-code";

function randomScore() {
  return Math.floor(Math.random() * 21) + 80;
}

/* Banner shown when temporary access is about to expire */
function TempAccessBanner() {
  const { hasAccess, remainingMinutes } = useTemporaryAccess();
  if (!hasAccess || remainingMinutes > 10) return null;
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2">
      <div className="container mx-auto max-w-7xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-amber-400 font-medium">
            Seu tempo está acabando! Faltam apenas {remainingMinutes} minutos.
          </span>
        </div>
        <Link href="/planos">
          <Button
            size="sm"
            className="h-7 text-xs bg-amber-500 hover:bg-amber-500/90 text-black font-bold shrink-0"
          >
            Assinar plano
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* Persistent search bar in player header — always visible */
function PersistentSearchBar() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [focused, setFocused] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useMemo(() => { setPage(1); }, [debouncedSearch]);

  const { data, isLoading } = useSearchMusicas({ q: debouncedSearch, page, limit: 8 }, {
    query: { enabled: focused && debouncedSearch.length > 0, queryKey: ["search-musicas", debouncedSearch, page] }
  });

  const hasResults = focused && debouncedSearch.length > 0 && (isLoading || (data && data.data.length > 0));
  const hasEmpty = focused && debouncedSearch.length > 0 && !isLoading && data?.data.length === 0;

  useEffect(() => {
    if (!focused) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [focused]);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all w-full ${
          focused
            ? "bg-black/80 border-[hsl(55,100%,50%)]/70 shadow-[0_0_15px_hsla(55,100%,50%,0.25)]"
            : "bg-black/60 border-[hsl(55,100%,50%)]/30 hover:border-[hsl(55,100%,50%)]/50"
        }`}
      >
        <Search className="h-4 w-4 text-[hsl(55,100%,50%)] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar próxima música..."
          className="flex-1 bg-transparent border-0 text-white text-sm placeholder:text-white/40 focus:outline-none min-w-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setSearchTerm("");
              setFocused(false);
              inputRef.current?.blur();
            }
          }}
        />
        {searchTerm && (
          <Button variant="ghost" size="icon"
            className="h-5 w-5 text-white/50 hover:text-white shrink-0"
            onClick={() => { setSearchTerm(""); inputRef.current?.focus(); }}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Dropdown results */}
      {(hasResults || hasEmpty) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5 p-3 rounded-lg bg-white/5">
                  <Skeleton className="h-4 w-3/4 bg-white/10" />
                  <Skeleton className="h-3 w-1/2 bg-white/5" />
                </div>
              ))}
            </div>
          ) : data && data.data.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3">
                {data.data.map((m) => (
                  <div key={m.id} className="rounded-lg bg-white/5 border border-transparent hover:border-white/15 transition-all p-3 flex flex-col gap-2">
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-0.5">
                        <div className="font-medium text-sm text-white line-clamp-1 flex-1">{m.musica}</div>
                        <span className="text-[10px] font-mono text-primary/60 bg-primary/10 rounded px-1 py-0.5 shrink-0">#{m.id}</span>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{m.artista}</div>
                    </div>
                    <div className="flex gap-1.5 mt-auto">
                      <Button size="sm"
                        className="flex-1 h-7 text-xs bg-primary/80 hover:bg-primary"
                        onClick={() => { navigate(`/player/${m.id}`); setSearchTerm(""); setFocused(false); }}>
                        <Play className="h-3 w-3 mr-1" />Tocar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 p-2 border-t border-white/10">
                  <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="text-xs text-muted-foreground hover:text-white h-7">Anterior</Button>
                  <span className="text-xs text-muted-foreground">{page} / {data.totalPages}</span>
                  <Button variant="ghost" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}
                    className="text-xs text-muted-foreground hover:text-white h-7">Próxima</Button>
                </div>
              )}
            </>
          ) : null}

          {hasEmpty && (
            <div className="flex items-center justify-center gap-2 py-5 text-muted-foreground text-sm">
              <Mic2 className="h-4 w-4" />Nenhuma música encontrada para "{debouncedSearch}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreScreen({
  score, musica, artista,
  onReplay, onBack,
}: {
  score: number;
  musica: string;
  artista: string;
  onReplay: () => void;
  onBack: () => void;
}) {
  const stars = score >= 95 ? 5 : score >= 90 ? 4 : score >= 85 ? 3 : 2;
  const label = score === 100 ? "Perfeito! 🎤" : score >= 95 ? "Incrível!" : score >= 90 ? "Excelente!" : score >= 85 ? "Muito Bom!" : "Bom trabalho!";

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md text-white p-8 animate-in fade-in duration-500">
      <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-primary/30 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-1/2 h-64 bg-black/20 blur-[120px] rounded-full pointer-events-none translate-y-1/2" />

      <Trophy className="h-14 w-14 text-yellow-400 mb-3 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]" />
      <p className="text-muted-foreground text-sm mb-1 uppercase tracking-widest font-medium">Resultado</p>

      <h2 className="text-2xl font-bold mb-1 line-clamp-1 text-center">{musica}</h2>
      <p className="text-muted-foreground text-sm mb-6">{artista}</p>

      <div className="relative flex items-center justify-center mb-6">
        <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
          <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle cx="80" cy="80" r="70" fill="none" stroke="url(#scoreGrad)" strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 70}`}
            strokeDashoffset={`${2 * Math.PI * 70 * (1 - score / 100)}`}
            className="transition-all duration-1000" />
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-5xl font-black tabular-nums leading-none">{score}</span>
          <span className="text-muted-foreground text-xs mt-1">pontos</span>
        </div>
      </div>

      <div className="flex gap-1.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`h-7 w-7 ${i < stars ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" : "text-white/20"}`} />
        ))}
      </div>
      <p className="text-xl font-bold mb-8 text-primary">{label}</p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onReplay} className="border-white/20 text-white hover:bg-white/10 hover:text-white">
          <RotateCcw className="h-4 w-4 mr-2" />Cantar de novo
        </Button>
        <Button onClick={onBack} variant="ghost" className="text-white hover:bg-white/10">
          <ArrowLeft className="h-4 w-4 mr-2" />Voltar ao Catálogo
        </Button>
      </div>
    </div>
  );
}

export default function Player() {
  const params = useParams();
  const id = Number(params.id);
  const { data: musica, isLoading, isError } = useGetMusica(id, {
    query: { enabled: !!id, queryKey: getGetMusicaQueryKey(id) }
  });

  const libraryId = import.meta.env.VITE_BUNNY_LIBRARY_ID;
  const isLibraryConfigured = libraryId && libraryId !== "CONFIGURE_LIBRARY_ID";

  const { folderName, selectFolder, getFileUrl } = useLocalMusic();
  const localVideoUrl = musica ? getFileUrl(musica.id) : null;

  const [score, setScore] = useState<number | null>(null);
  const [videoKey, setVideoKey] = useState(0);

  // Session + QR Code for remote control
  const { createSession, joinSession } = useSession();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    async function setupSession() {
      const stored = localStorage.getItem("karaoke-ct-session-id");
      if (stored) {
        const ok = await joinSession(stored);
        if (ok) { setSessionId(stored); return; }
      }
      const newId = await createSession("Player");
      if (newId) setSessionId(newId);
    }
    setupSession();
  }, [createSession, joinSession]);

  const remoteUrl = typeof window !== "undefined" && sessionId
    ? `${window.location.origin}${import.meta.env.BASE_URL}remote/${sessionId}`
    : "";

  const handleVideoEnd = useCallback(() => {
    setScore(randomScore());
  }, []);

  const handleReplay = useCallback(() => {
    setScore(null);
    setVideoKey((k) => k + 1);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <TempAccessBanner />
        <div className="p-4 flex items-center justify-between z-10">
          <Skeleton className="h-10 w-24" />
          <div className="flex-1 flex justify-center"><Skeleton className="h-8 w-64" /></div>
          <div className="w-24" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Play className="h-16 w-16 text-muted animate-pulse" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !musica) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center text-center p-4">
        <TempAccessBanner />
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Música não encontrada</h1>
        <p className="text-muted-foreground mb-8">A música que você tentou acessar não existe ou ocorreu um erro.</p>
        <Link href="/"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Voltar ao Catálogo</Button></Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden selection:bg-primary/30">
      {/* Header — always on top */}
      <header className="p-3 flex items-center gap-3 z-[100] bg-black/70 backdrop-blur-md border-b border-white/10 shrink-0">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white backdrop-blur-sm rounded-full bg-black/20 border border-white/10 h-8 px-3">
              <ArrowLeft className="h-4 w-4 mr-1.5" />Voltar
            </Button>
          </Link>
          <div className="hidden md:flex flex-col">
            <h1 className="font-bold text-sm drop-shadow-md line-clamp-1 leading-tight">{musica.musica}</h1>
            <div className="text-primary-foreground/70 text-xs font-medium flex items-center gap-1">
              <Music className="h-3 w-3" />{musica.artista}
            </div>
          </div>
        </div>

        {/* Center: Persistent search bar */}
        <div className="flex-1 max-w-xl mx-auto">
          <PersistentSearchBar />
        </div>

        {/* Right: Score button + Timer */}
        <div className="flex items-center gap-2 shrink-0">
          <CountdownTimer className="hidden sm:flex" />
          {isLibraryConfigured && !score && (
            <Button variant="ghost" size="sm"
              className="text-white hover:bg-white/10 hover:text-white backdrop-blur-sm rounded-full bg-black/20 border border-white/10 text-xs h-8 px-3"
              onClick={() => setScore(randomScore())}>
              <Trophy className="h-3.5 w-3.5 mr-1.5" />Pontuação
            </Button>
          )}
        </div>
      </header>

      <TempAccessBanner />

      {/* Video — fills remaining height */}
      <div className="flex-1 relative min-h-0">
        {isLibraryConfigured ? (
          <iframe
            src={`https://iframe.mediadelivery.net/embed/${libraryId}/${musica.id}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`}
            className="absolute inset-0 w-full h-full border-0 z-10"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          />
          ) : localVideoUrl ? (
            <video
              key={`${localVideoUrl}-${videoKey}`}
              src={localVideoUrl}
              className="w-full h-full object-contain"
              controls autoPlay
              onEnded={handleVideoEnd}
            />
          ) : folderName ? (
            <div className="text-center p-8 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 max-w-md">
              <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Arquivo não encontrado</h2>
              <p className="text-muted-foreground mb-2">
                O arquivo <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">{musica.id}.mp4</code> não existe na pasta <strong>{folderName}</strong>.
              </p>
            </div>
          ) : (
            <div className="text-center p-8 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 max-w-md">
              <FolderOpen className="h-14 w-14 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Selecione a pasta de músicas</h2>
              <p className="text-muted-foreground mb-6">
                Para reproduzir <strong>{musica.musica}</strong>, selecione a pasta onde estão os arquivos MP4.
                O player vai encontrar <code className="text-primary bg-primary/10 px-1 rounded">{musica.id}.mp4</code> automaticamente.
              </p>
              <Button onClick={selectFolder} className="bg-primary hover:bg-primary/90">
                <FolderOpen className="h-4 w-4 mr-2" />Selecionar Pasta de Músicas
              </Button>
            </div>
          )}

          {score !== null && (
            <ScoreScreen
              score={score}
              musica={musica.musica}
              artista={musica.artista}
              onReplay={handleReplay}
              onBack={() => window.history.back()}
            />
          )}

          {/* QR Code overlay — inside video area, bottom-right */}
          {sessionId && remoteUrl && (
            <div className="absolute bottom-4 right-4 z-30 bg-primary/80 backdrop-blur-sm border border-primary/50 rounded-xl p-3 flex flex-col items-center gap-1 shadow-lg shadow-primary/20">
              <div className="bg-white rounded-md p-1">
                <QRCodeLib value={remoteUrl} size={56} bgColor="#ffffff" fgColor="#000000" />
              </div>
              <div className="text-[9px] text-center text-primary-foreground leading-tight max-w-[72px] font-bold">
                <Smartphone className="h-2.5 w-2.5 mx-auto mb-0.5 text-primary-foreground/80" />
                Controle
              </div>
            </div>
          )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
    </div>
  );
}
