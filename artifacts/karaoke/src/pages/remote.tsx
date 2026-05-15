import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useSearchMusicas } from "@workspace/api-client-react";
import { useSession } from "@/hooks/use-session";
import type { SessionQueueItem } from "@/contexts/session-context";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArtistAvatar } from "@/components/artist-avatar";
import {
  Search, Mic2, ListMusic, Play, Plus, Check, UserRound,
  Monitor, ArrowLeft, X, Trash2, Smartphone, Pencil
} from "lucide-react";

function AddToQueueDialog({
  item, onConfirm, onCancel,
}: {
  item: { id: number; musica: string; artista: string } | null;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (item) { setName(""); }
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/60 rounded-xl p-5 w-full max-w-sm shadow-2xl">
        <h3 className="font-bold text-foreground mb-1">Adicionar à Fila</h3>
        <p className="text-sm text-muted-foreground mb-4">
          <strong className="text-foreground">{item.musica}</strong> — {item.artista}
        </p>
        <div className="space-y-2 mb-4">
          <label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5" />Nome de quem vai cantar
          </label>
          <Input
            autoFocus
            placeholder="Ex: João, Maria..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onConfirm(name.trim() || "Anônimo")}
            className="border-border/60"
            maxLength={40}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel} className="flex-1 text-muted-foreground">
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(name.trim() || "Anônimo")}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-1" />Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RemotePage() {
  const params = useParams();
  const sessionId = params.sessionId?.toUpperCase() ?? "";
  const { session, deviceId, joinSession, addToQueue, removeFromQueue, updateQueueItem, playSong, advanceQueue } = useSession();
  const [, navigate] = useLocation();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(1);
  const [pendingItem, setPendingItem] = useState<{ id: number; musica: string; artista: string } | null>(null);
  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [tab, setTab] = useState<"search" | "queue">("search");
  const [inQueueIds, setInQueueIds] = useState<Set<number>>(new Set());
  const [editingItem, setEditingItem] = useState<SessionQueueItem | null>(null);
  const [editSearchTerm, setEditSearchTerm] = useState("");
  const [editSearchResults, setEditSearchResults] = useState<Array<{id:number;musica:string;artista:string}>>([]);
  const [editSearching, setEditSearching] = useState(false);

  const { data: searchResults, isLoading } = useSearchMusicas({
    q: debouncedSearch, page, limit: 12,
  });

  // Auto-join session
  useEffect(() => {
    if (!sessionId) return;
    joinSession(sessionId).then((ok) => {
      setJoined(ok);
      if (!ok) setJoinError("Sessão não encontrada.");
    });
  }, [sessionId, joinSession]);

  // Track which songs are in queue
  useEffect(() => {
    if (session?.queue) {
      setInQueueIds(new Set(session.queue.map((q) => q.id)));
    }
  }, [session?.queue]);

  const handleAdd = useCallback(async (singerName: string) => {
    if (!pendingItem) return;
    const ok = await addToQueue(pendingItem.id, pendingItem.musica, pendingItem.artista, singerName);
    if (ok) {
      setInQueueIds((prev) => new Set(prev).add(pendingItem.id));
      setTab("queue");
    }
    setPendingItem(null);
  }, [pendingItem, addToQueue]);

  const handlePlayNow = useCallback(async (id: number) => {
    await playSong(id);
  }, [playSong]);

  const handleNext = useCallback(async () => {
    await advanceQueue();
  }, [advanceQueue]);

  // Edit song search
  const handleEditSearch = useCallback(async (term: string) => {
    setEditSearchTerm(term);
    if (!term.trim()) { setEditSearchResults([]); return; }
    setEditSearching(true);
    try {
      const res = await fetch(`/api/musicas/search?q=${encodeURIComponent(term)}&limit=8`);
      const data = await res.json();
      setEditSearchResults(data.data ?? []);
    } catch {
      setEditSearchResults([]);
    } finally {
      setEditSearching(false);
    }
  }, []);

  const handleEditConfirm = useCallback(async (newSong: {id:number;musica:string;artista:string}) => {
    if (!editingItem) return;
    const ok = await updateQueueItem(editingItem.id, newSong.musica, newSong.artista);
    if (ok) {
      setInQueueIds((prev) => {
        const next = new Set(prev);
        next.delete(editingItem.id);
        next.add(newSong.id);
        return next;
      });
    }
    setEditingItem(null);
    setEditSearchTerm("");
    setEditSearchResults([]);
  }, [editingItem, updateQueueItem]);

  if (!joined) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <Smartphone className="h-16 w-16 text-primary mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold mb-2">Conectando...</h1>
        {joinError && <p className="text-destructive mt-2 text-center">{joinError}</p>}
      </div>
    );
  }

  const currentSongId = session?.currentSongId ? Number(session.currentSongId) : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AddToQueueDialog item={pendingItem} onConfirm={handleAdd} onCancel={() => setPendingItem(null)} />

      {/* Edit Song Dialog — swap song in queue */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/60 rounded-xl p-5 w-full max-w-sm shadow-2xl max-h-[80vh] flex flex-col">
            <h3 className="font-bold text-foreground mb-1">Trocar Música</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Atual: <strong className="text-foreground">{editingItem.musica}</strong> — {editingItem.artista}
            </p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Buscar nova música..."
                value={editSearchTerm}
                onChange={(e) => handleEditSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {editSearching ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              ) : editSearchResults.length === 0 && editSearchTerm.trim() ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhuma música encontrada</p>
              ) : (
                editSearchResults.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleEditConfirm(m)}
                    className="w-full text-left p-2.5 rounded-lg bg-muted/30 border border-border/20 hover:bg-primary/10 hover:border-primary/30 transition-colors"
                  >
                    <div className="font-medium text-sm line-clamp-1">{m.musica}</div>
                    <div className="text-xs text-muted-foreground">{m.artista}</div>
                  </button>
                ))
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-border/40">
              <Button variant="ghost" onClick={() => { setEditingItem(null); setEditSearchTerm(""); setEditSearchResults([]); }} className="w-full text-muted-foreground">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="font-bold text-sm">Controle Remoto</div>
              <div className="text-[10px] text-primary font-mono">{sessionId}</div>
            </div>
          </div>
          {currentSongId && session?.queue && (
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs" onClick={handleNext}>
              <Play className="h-3 w-3 mr-1" />Próxima
            </Button>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex">
          <button
            onClick={() => setTab("search")}
            className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              tab === "search" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            }`}
          >
            <Search className="h-3.5 w-3.5" />Buscar
          </button>
          <button
            onClick={() => setTab("queue")}
            className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              tab === "queue" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            }`}
          >
            <ListMusic className="h-3.5 w-3.5" />
            Fila {session?.queue?.length ? `(${session.queue.length})` : ""}
          </button>
        </div>
      </header>

      {/* Search tab */}
      {tab === "search" && (
        <div className="flex-1 p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar música, artista ou código..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-9"
              autoFocus
            />
            {searchTerm && (
              <button onClick={() => { setSearchTerm(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <Skeleton className="h-12 w-12 rounded shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchResults?.data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mic2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Nenhuma música encontrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults?.data.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/20">
                  <ArtistAvatar name={m.artista} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm line-clamp-1">{m.musica}</div>
                    <div className="text-xs text-muted-foreground">{m.artista}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                      onClick={() => handlePlayNow(m.id)}
                      title="Tocar agora"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={inQueueIds.has(m.id) ? "default" : "outline"}
                      className={`h-8 w-8 p-0 ${inQueueIds.has(m.id) ? "bg-primary text-primary-foreground" : "border-border/50 text-muted-foreground hover:text-foreground"}`}
                      onClick={() => {
                        if (inQueueIds.has(m.id)) return;
                        setPendingItem({ id: m.id, musica: m.musica, artista: m.artista });
                      }}
                      title={inQueueIds.has(m.id) ? "Já na fila" : "Adicionar à fila"}
                      disabled={inQueueIds.has(m.id)}
                    >
                      {inQueueIds.has(m.id) ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}

              {searchResults && searchResults.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="text-xs h-7">Anterior</Button>
                  <span className="text-xs text-muted-foreground">{page} / {searchResults.totalPages}</span>
                  <Button variant="ghost" size="sm" disabled={page === searchResults.totalPages} onClick={() => setPage(p => p + 1)}
                    className="text-xs h-7">Próxima</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Queue tab */}
      {tab === "queue" && (
        <div className="flex-1 p-4">
          {!session?.queue || session.queue.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListMusic className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>A fila está vazia</p>
              <p className="text-xs mt-1">Busque músicas e adicione à fila</p>
            </div>
          ) : (
            <div className="space-y-2">
              {session.queue.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/20">
                  <span className="text-xs font-mono text-muted-foreground w-5 text-center">{index + 1}</span>
                  <div className="bg-primary/15 rounded-full p-1.5 shrink-0">
                    <UserRound className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-primary line-clamp-1">{item.singerName}</div>
                    <div className="text-sm text-foreground line-clamp-1">{item.musica}</div>
                    <div className="text-xs text-muted-foreground">{item.artista}</div>
                  </div>
                  {index === 0 && currentSongId === item.id && (
                    <span className="text-[10px] bg-primary/20 text-primary rounded-full px-2 py-0.5 shrink-0">Tocando</span>
                  )}
                  {(item.addedBy === deviceId || !item.addedBy || item.addedBy === "anon") && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary shrink-0"
                        onClick={() => setEditingItem(item)}
                        title="Trocar música"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeFromQueue(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Now playing card */}
          {currentSongId && (
            <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="text-[10px] text-primary uppercase tracking-wider mb-1">Agora na TV</div>
              <div className="font-bold text-sm">
                Música #{currentSongId}
              </div>
              <Button size="sm" className="mt-2 w-full bg-primary hover:bg-primary/90" onClick={handleNext}>
                <Play className="h-3.5 w-3.5 mr-1.5" />Próxima música
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
