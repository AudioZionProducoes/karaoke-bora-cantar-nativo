import { useParams, Link, useLocation } from "wouter";
import {
  ArrowLeft, Play, Music, AlertCircle, FolderOpen,
  Star, RotateCcw, Trophy, Search, X, Mic2,
  ListMusic, Trash2, ListPlus, Check, UserRound, ChevronRight
} from "lucide-react";
import { useGetMusica, getGetMusicaQueryKey, useSearchMusicas } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalMusic } from "@/contexts/local-music-context";
import { useQueue, type QueueItem } from "@/contexts/queue-context";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { AddToQueueDialog, type PendingQueueItem } from "@/components/add-to-queue-dialog";

function randomScore() {
  return Math.floor(Math.random() * 21) + 80;
}

/* Persistent search bar in player header — always visible */
function PersistentSearchBar() {
  const [, navigate] = useLocation();
  const { addToQueue, isInQueue, queue } = useQueue();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [focused, setFocused] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [pendingItem, setPendingItem] = useState<PendingQueueItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useMemo(() => { setPage(1); }, [debouncedSearch]);

  const { data, isLoading } = useSearchMusicas({ q: debouncedSearch, page, limit: 8 }, {
    query: { enabled: focused && debouncedSearch.length > 0, queryKey: ["search-musicas", debouncedSearch, page] }
  });

  const hasResults = focused && debouncedSearch.length > 0 && (isLoading || (data && data.data.length > 0));
  const hasEmpty = focused && debouncedSearch.length > 0 && !isLoading && data?.data.length === 0;

  function openQueueDialog(m: PendingQueueItem) {
    if (queue.length >= 30) {
      toast({ title: "Fila cheia", description: "A fila já tem 30 músicas.", variant: "destructive" });
      return;
    }
    if (isInQueue(m.id)) {
      toast({ title: "Já na fila", description: `"${m.musica}" já está na lista de espera.` });
      return;
    }
    setPendingItem(m);
  }

  function handleConfirmQueue(singerName: string) {
    if (!pendingItem) return;
    addToQueue({ ...pendingItem, singerName });
    toast({ title: "Adicionada à fila ✓", description: `"${pendingItem.musica}" para ${singerName}.` });
    setPendingItem(null);
  }

  return (
    <>
      <AddToQueueDialog item={pendingItem} onConfirm={handleConfirmQueue} onCancel={() => setPendingItem(null)} />
      <div className="relative">
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all ${
            focused
              ? "bg-black/70 border-primary/60 shadow-[0_0_12px_rgba(var(--primary-rgb),0.3)]"
              : "bg-black/40 border-white/15 hover:border-white/30"
          }`}
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar música..."
            className="flex-1 bg-transparent border-0 text-white text-sm placeholder:text-muted-foreground focus:outline-none min-w-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
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
              className="h-5 w-5 text-muted-foreground hover:text-white shrink-0"
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
                        <Button size="sm" variant="outline"
                          className={`h-7 w-7 p-0 border-white/20 ${isInQueue(m.id) ? "text-emerald-400 border-emerald-400/40 bg-emerald-400/10" : "text-white hover:bg-white/10 hover:text-white"}`}
                          onClick={() => openQueueDialog({ id: m.id, musica: m.musica, artista: m.artista })}
                          title="Adicionar à fila">
                          {isInQueue(m.id) ? <Check className="h-3 w-3" /> : <ListPlus className="h-3 w-3" />}
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
    </>
  );
}

function ScoreScreen({
  score, musica, artista, singerName, nextItem,
  onReplay, onBack, onNext,
}: {
  score: number;
  musica: string;
  artista: string;
  singerName?: string;
  nextItem?: QueueItem | null;
  onReplay: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const stars = score >= 95 ? 5 : score >= 90 ? 4 : score >= 85 ? 3 : 2;
  const label = score === 100 ? "Perfeito! 🎤" : score >= 95 ? "Incrível!" : score >= 90 ? "Excelente!" : score >= 85 ? "Muito Bom!" : "Bom trabalho!";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" && nextItem) onNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextItem, onNext]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md text-white p-8 animate-in fade-in duration-500">
      <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-primary/30 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-1/2 h-64 bg-violet-500/20 blur-[120px] rounded-full pointer-events-none translate-y-1/2" />

      <Trophy className="h-14 w-14 text-yellow-400 mb-3 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]" />
      <p className="text-muted-foreground text-sm mb-1 uppercase tracking-widest font-medium">Resultado</p>

      {singerName && (
        <div className="flex items-center gap-2 mb-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5">
          <UserRound className="h-4 w-4 text-primary" />
          <span className="font-bold text-lg text-primary">{singerName}</span>
        </div>
      )}

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

      {/* Next in queue card */}
      {nextItem && (
        <div className="mb-6 w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-4 text-left">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ListMusic className="h-3 w-3" />Próxima na fila
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
          <Button
            className="w-full mt-3 bg-primary hover:bg-primary/90 text-white font-bold"
            onClick={onNext}
          >
            <Play className="h-4 w-4 mr-2" />
            Começar — {nextItem.singerName}
            <span className="ml-2 text-xs text-primary-foreground/60">(Enter)</span>
          </Button>
        </div>
      )}

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

function SearchTopPanel({ onClose }: { onClose: () => void }) {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { addToQueue, isInQueue, queue } = useQueue();
  const { toast } = useToast();
  const [pendingItem, setPendingItem] = useState<PendingQueueItem | null>(null);

  useMemo(() => { setPage(1); }, [debouncedSearch]);

  const { data, isLoading } = useSearchMusicas({ q: debouncedSearch, page, limit: 8 });

  function openQueueDialog(m: PendingQueueItem) {
    if (queue.length >= 30) {
      toast({ title: "Fila cheia", description: "A fila já tem 30 músicas.", variant: "destructive" });
      return;
    }
    if (isInQueue(m.id)) {
      toast({ title: "Já na fila", description: `"${m.musica}" já está na lista de espera.` });
      return;
    }
    setPendingItem(m);
  }

  function handleConfirmQueue(singerName: string) {
    if (!pendingItem) return;
    addToQueue({ ...pendingItem, singerName });
    toast({ title: "Adicionada à fila ✓", description: `"${pendingItem.musica}" para ${singerName}.` });
    setPendingItem(null);
  }

  return (
    <>
      <AddToQueueDialog item={pendingItem} onConfirm={handleConfirmQueue} onCancel={() => setPendingItem(null)} />
      <div className="absolute top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10 animate-in slide-in-from-top duration-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            autoFocus
            placeholder="Buscar próxima música por artista, título ou código..."
            className="flex-1 bg-transparent border-0 text-white text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 h-10 px-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
          />
          <Button variant="ghost" size="icon" onClick={onClose}
            className="shrink-0 text-muted-foreground hover:text-white h-9 w-9 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {(isLoading || (data && data.data.length > 0)) && (
          <div className="border-t border-white/10 px-3 pb-3">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5 p-3 rounded-lg bg-white/5">
                    <Skeleton className="h-4 w-3/4 bg-white/10" />
                    <Skeleton className="h-3 w-1/2 bg-white/5" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3">
                  {data?.data.map((m) => (
                    <div key={m.id} className="rounded-lg bg-white/5 border border-transparent hover:border-white/10 transition-all p-3 flex flex-col gap-2">
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
                          onClick={() => { navigate(`/player/${m.id}`); onClose(); }}>
                          <Play className="h-3 w-3 mr-1" />Tocar
                        </Button>
                        <Button size="sm" variant="outline"
                          className={`h-7 w-7 p-0 border-white/20 ${isInQueue(m.id) ? "text-emerald-400 border-emerald-400/40 bg-emerald-400/10" : "text-white hover:bg-white/10 hover:text-white"}`}
                          onClick={() => openQueueDialog({ id: m.id, musica: m.musica, artista: m.artista })}
                          title="Adicionar à fila">
                          {isInQueue(m.id) ? <Check className="h-3 w-3" /> : <ListPlus className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {data && data.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-3">
                    <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                      className="text-xs text-muted-foreground hover:text-white h-7">Anterior</Button>
                    <span className="text-xs text-muted-foreground">{page} / {data.totalPages}</span>
                    <Button variant="ghost" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}
                      className="text-xs text-muted-foreground hover:text-white h-7">Próxima</Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {debouncedSearch && !isLoading && data?.data.length === 0 && (
          <div className="border-t border-white/10 flex items-center justify-center gap-2 py-5 text-muted-foreground text-sm">
            <Mic2 className="h-4 w-4" />Nenhuma música encontrada para "{debouncedSearch}"
          </div>
        )}
      </div>
    </>
  );
}

function QueuePanel({ onClose }: { onClose: () => void }) {
  const { queue, removeFromQueue, clearQueue } = useQueue();

  return (
    <div className="absolute top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10 animate-in slide-in-from-top duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <ListMusic className="h-5 w-5 text-primary" />
          <span className="font-semibold text-white">Fila de espera</span>
          <span className="text-xs text-muted-foreground bg-white/10 rounded-full px-2 py-0.5">{queue.length}/30</span>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearQueue}
              className="text-xs text-muted-foreground hover:text-destructive h-7">
              <Trash2 className="h-3.5 w-3.5 mr-1" />Limpar tudo
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-white rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm gap-2">
          <ListMusic className="h-8 w-8 opacity-40" />
          <p>A fila está vazia. Busque músicas e clique em <strong className="text-white/60">+</strong> para adicionar.</p>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto">
          {queue.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
              <span className="text-xs font-mono text-muted-foreground w-5 shrink-0 text-center">{index + 1}</span>
              <div className="bg-primary/15 rounded-full p-1 shrink-0">
                <UserRound className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-primary line-clamp-1">{item.singerName}</div>
                <div className="text-xs text-white line-clamp-1">{item.musica}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{item.artista}</div>
              </div>
              <span className="text-[10px] font-mono text-primary/60 bg-primary/10 rounded px-1.5 py-0.5 shrink-0">#{item.id}</span>
              <Button variant="ghost" size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => removeFromQueue(item.id)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Player() {
  const params = useParams();
  const id = Number(params.id);
  const [, navigate] = useLocation();

  const { data: musica, isLoading, isError } = useGetMusica(id, {
    query: { enabled: !!id, queryKey: getGetMusicaQueryKey(id) }
  });

  const libraryId = import.meta.env.VITE_BUNNY_LIBRARY_ID;
  const isLibraryConfigured = libraryId && libraryId !== "CONFIGURE_LIBRARY_ID";

  const { folderName, selectFolder, getFileUrl } = useLocalMusic();
  const { queue, shiftQueue, addToQueue, isInQueue } = useQueue();
  const { toast } = useToast();
  const localVideoUrl = musica ? getFileUrl(musica.id) : null;

  const [score, setScore] = useState<number | null>(null);
  const [videoKey, setVideoKey] = useState(0);
  const [panel, setPanel] = useState<"none" | "search" | "queue">("none");

  // Store the next queued item to show on score screen
  const [nextQueuedItem, setNextQueuedItem] = useState<QueueItem | null>(null);

  // Ref to avoid stale closures
  const shiftQueueRef = useRef(shiftQueue);
  const navigateRef = useRef(navigate);
  useEffect(() => { shiftQueueRef.current = shiftQueue; }, [shiftQueue]);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  // Peek at the next item (first in queue) without removing it
  const peekNextItem = queue[0] ?? null;

  const handleVideoEnd = useCallback(() => {
    // Show score screen; peek at next item from queue
    setNextQueuedItem(queue[0] ?? null);
    setScore(randomScore());
  }, [queue]);

  // Called when user presses Enter or clicks "Começar" on score screen
  const handleNext = useCallback(() => {
    const next = shiftQueueRef.current();
    if (next) {
      setScore(null);
      setNextQueuedItem(null);
      setVideoKey((k) => k + 1);
      navigateRef.current(`/player/${next.id}`);
    }
  }, []);

  const handleReplay = useCallback(() => {
    setScore(null);
    setNextQueuedItem(null);
    setVideoKey((k) => k + 1);
  }, []);

  const togglePanel = (p: "search" | "queue") => setPanel(prev => prev === p ? "none" : p);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
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
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Música não encontrada</h1>
        <p className="text-muted-foreground mb-8">A música que você tentou acessar não existe ou ocorreu um erro.</p>
        <Link href="/"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Voltar ao Catálogo</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden selection:bg-primary/30">
      <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-primary/20 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />

      {/* Header */}
      <header className="p-3 flex items-center gap-3 z-20 absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent">
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

        {/* Right: Queue + Score buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {isLibraryConfigured && !score && (
            <Button variant="ghost" size="sm"
              className="text-white hover:bg-white/10 hover:text-white backdrop-blur-sm rounded-full bg-black/20 border border-white/10 text-xs h-8 px-3"
              onClick={() => { setNextQueuedItem(queue[0] ?? null); setScore(randomScore()); }}>
              <Trophy className="h-3.5 w-3.5 mr-1.5" />Pontuação
            </Button>
          )}
          <Button variant="ghost" size="sm"
            className={`backdrop-blur-sm rounded-full border text-xs transition-all relative h-8 px-3 ${panel === "queue" ? "bg-primary text-white border-primary" : "bg-black/20 text-white border-white/10 hover:bg-white/10"}`}
            onClick={() => togglePanel("queue")}>
            <ListMusic className="h-3.5 w-3.5 mr-1.5" />
            Fila
            {queue.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                {queue.length}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Queue panel only — search is now persistent in header */}
      {panel === "queue" && <QueuePanel onClose={() => setPanel("none")} />}

      {/* Video */}
      <div className="flex h-screen pt-14">
        <main className="flex-1 relative flex items-center justify-center bg-black min-w-0">
          {isLibraryConfigured ? (
            <iframe
              src={`https://iframe.mediadelivery.net/embed/${libraryId}/${musica.id}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`}
              className="absolute inset-0 w-full h-full border-0"
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
              singerName={undefined}
              nextItem={nextQueuedItem}
              onReplay={handleReplay}
              onBack={() => window.history.back()}
              onNext={handleNext}
            />
          )}
        </main>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
    </div>
  );
}
