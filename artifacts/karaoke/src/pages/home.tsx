import { useState, useMemo, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Play, Music, Mic2, Monitor, Settings, FolderOpen, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useSearchMusicas, useGetMusicasStats } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Layout } from "@/components/layout";
import { useSession } from "@/hooks/use-session";
import { useSearch } from "@/contexts/search-context";
import { useLocalMusic } from "@/contexts/local-music-context";
import { useScoringEnabled } from "@/hooks/use-scoring";
import { toast } from "@/hooks/use-toast";
import { AddToQueueDialog, type QueueCandidate } from "@/components/add-to-queue-dialog";

export default function Home() {
  const { session, createSession, addToQueue, setMode, playSong } = useSession();
  const { selectFolder } = useLocalMusic();
  const [, navigate] = useLocation();
  const { searchTerm } = useSearch();
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(1);
  const [startingSession, setStartingSession] = useState(false);
  const [pendingItem, setPendingItem] = useState<QueueCandidate | null>(null);
  const [scoringEnabled, setScoringEnabled] = useScoringEnabled();

  useMemo(() => { setPage(1); }, [debouncedSearch]);

  const { data: stats } = useGetMusicasStats();
  const { data: searchResults, isLoading } = useSearchMusicas({ q: debouncedSearch, page, limit: 24 });

  async function handleStartTV(mode?: "home" | "party") {
    if (session) {
      if (mode && mode !== session.mode) {
        setStartingSession(true);
        await setMode(mode);
        setStartingSession(false);
      }
      navigate(`/tv/${session.id}`);
      return;
    }
    setStartingSession(true);
    const id = await createSession("Karaokê Bora Cantar", mode);
    setStartingSession(false);
    if (id) navigate(`/tv/${id}`);
  }

  const handleAddToQueue = useCallback(async (singerName: string) => {
    if (!pendingItem) return;

    // Se não houver sessão, cria automaticamente antes de adicionar
    let activeSessionId = session?.id;
    if (!activeSessionId) {
      const newId = await createSession("Karaokê Bora Cantar", "home");
      if (!newId) {
        toast({
          title: "Erro ao criar sessão",
          description: "Não foi possível iniciar a sessão. Tente novamente.",
          variant: "destructive",
        });
        setPendingItem(null);
        return;
      }
      activeSessionId = newId;
    }

    const result = await addToQueue(pendingItem.id, pendingItem.musica, pendingItem.artista, singerName);
    if (result.ok) {
      toast({
        title: "Adicionado à fila!",
        description: `${pendingItem.musica} — ${pendingItem.artista} foi adicionada para ${singerName}.`,
      });
    } else {
      toast({
        title: "Erro ao adicionar",
        description: result.error ?? "Não foi possível adicionar à fila. Tente novamente.",
        variant: "destructive",
      });
    }
    setPendingItem(null);
  }, [pendingItem, addToQueue, session, createSession]);

  const handleCantarAgora = useCallback(async (item: QueueCandidate) => {
    // Se não houver sessão, cria automaticamente
    let activeSessionId = session?.id;
    if (!activeSessionId) {
      const newId = await createSession("Karaokê Bora Cantar", "home");
      if (!newId) {
        toast({
          title: "Erro ao criar sessão",
          description: "Não foi possível iniciar a sessão. Tente novamente.",
          variant: "destructive",
        });
        return;
      }
      activeSessionId = newId;
    }

    // Adiciona à fila com nome "Anônimo" e toca imediatamente
    const result = await addToQueue(item.id, item.musica, item.artista, "Anônimo");
    if (!result.ok) {
      toast({
        title: "Erro ao adicionar",
        description: result.error ?? "Não foi possível adicionar à fila.",
        variant: "destructive",
      });
      return;
    }

    await playSong(item.id);
    navigate(`/tv/${activeSessionId}`);
  }, [session, createSession, addToQueue, playSong, navigate]);

  return (
    <Layout>
      <AddToQueueDialog
        item={pendingItem}
        onConfirm={handleAddToQueue}
        onCancel={() => setPendingItem(null)}
      />

      <div className="flex flex-col items-center pt-4 pb-4 max-w-3xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-2 shadow-[0_0_15px_rgba(250,204,21,0.15)] dark:shadow-[0_0_15px_rgba(250,204,21,0.25)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          {stats ? `${stats.totalSongs.toLocaleString("pt-BR")} músicas disponíveis` : "Carregando catálogo..."}
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground drop-shadow-sm">
          Faça de sua Festa um Grande Evento.
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          Busque no maior catálogo de karaokê. Músicas de alta qualidade, sem espera.
        </p>

        <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
          <div className="flex flex-col items-center gap-2">
            <Button
              size="lg"
              className={`shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all ${session?.mode === "party" ? "ring-2 ring-white/50 bg-red-400" : "bg-red-500 hover:bg-red-600"} text-white px-6`}
              onClick={() => handleStartTV("party")}
              disabled={startingSession}
            >
              <Monitor className="h-5 w-5 mr-2" />
              {startingSession ? "Iniciando..." : "Iniciar Sessão na TV Modo Festa"}
            </Button>
            <p className="text-xs text-muted-foreground text-center max-w-[220px] leading-relaxed">
              <span className="font-medium text-foreground">Modo Festa:</span> Cada pessoa só pode colocar 1 música por vez. Todos cantam na mesma rodada.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button
              size="lg"
              className={`shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all ${session?.mode === "home" ? "ring-2 ring-white/50 bg-green-400" : "bg-green-500 hover:bg-green-600"} text-white px-6`}
              onClick={() => handleStartTV("home")}
              disabled={startingSession}
            >
              <Monitor className="h-5 w-5 mr-2" />
              {startingSession ? "Iniciando..." : "Iniciar Sessão na TV Modo Casa"}
            </Button>
            <p className="text-xs text-muted-foreground text-center max-w-[220px] leading-relaxed">
              <span className="font-medium text-foreground">Modo Casa:</span> sem limites. Adicione quantas músicas quiser à fila.
            </p>
          </div>
        </div>

          {session && (
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>Sessão ativa: <span className="font-mono text-primary/80 dark:text-yellow-400/80">{session.id}</span></p>
              <Button
                size="sm"
                variant="ghost"
                className={`h-6 px-2.5 text-[10px] rounded-full border transition-colors mt-1 ${
                  scoringEnabled
                    ? "bg-neutral-950 border-yellow-500/60 text-yellow-400 hover:bg-neutral-900 dark:bg-primary/20 dark:border-primary/50 dark:text-primary dark:hover:bg-primary/30"
                    : "bg-red-50 border-red-400 text-red-700 hover:bg-red-100 dark:bg-white/5 dark:border-white/20 dark:text-white/60 dark:hover:bg-white/10"
                }`}
                onClick={() => setScoringEnabled(!scoringEnabled)}
                title={scoringEnabled ? "Desativar pontuação" : "Ativar pontuação"}
              >
                <Trophy className="h-3 w-3 mr-1" />
                {scoringEnabled ? "Com Pontuação" : "Sem Pontuação"}
              </Button>
            </div>
          )}
      </div>

      <div className="mt-2 space-y-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2 shrink-0">
            <Music className="h-5 w-5 text-primary dark:text-yellow-400" />
            {debouncedSearch ? "Resultados da Busca" : "Catálogo em Destaque"}
          </h2>

          {searchResults && (
            <span className="text-sm text-muted-foreground shrink-0">{searchResults.total.toLocaleString("pt-BR")} encontradas</span>
          )}

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={selectFolder}
              className="text-xs font-medium text-muted-foreground hover:text-foreground border-border/30 bg-muted/40 rounded-full px-3 py-1.5 h-auto gap-1"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span>Pasta</span>
            </Button>
            <Link href="/admin" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 bg-muted/40 border border-border/30 rounded-full px-3 py-1.5">
              <Settings className="h-3.5 w-3.5" />
              <span>Admin</span>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="bg-card/50 border-border/40 overflow-hidden">
                <CardContent className="p-5 flex flex-col h-full gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-10 w-full mt-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchResults?.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-muted/30 p-4 rounded-full mb-4">
              <Mic2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium">Nenhuma música encontrada</h3>
            <p className="text-muted-foreground mt-2">Tente um termo de busca diferente</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchResults?.data.map((musica) => (
                <Card key={musica.id} className="group bg-card border-border/40 hover:border-primary/50 dark:hover:border-yellow-400/50 transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] dark:hover:shadow-[0_0_20px_rgba(250,204,21,0.15)] overflow-hidden flex flex-col h-full">
                  <CardContent className="p-5 flex flex-col h-full gap-4 relative">
                    <div className="space-y-1.5 flex-1 relative z-10">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors" title={musica.musica}>
                          {musica.musica}
                        </div>
                        <span className="shrink-0 text-xs font-mono text-primary/70 bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5">
                          #{musica.id}
                        </span>
                      </div>
                      <div className="text-muted-foreground font-medium text-sm line-clamp-1" title={musica.artista}>
                        {musica.artista}
                      </div>
                      {musica.inicio && (
                        <div className="text-xs text-muted-foreground/70 mt-3 italic line-clamp-2 pl-2 border-l-2 border-primary/30">
                          "{musica.inicio}"
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2 flex-col">
                      <Button
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] dark:group-hover:shadow-[0_0_15px_rgba(250,204,21,0.4)] transition-all z-10 relative"
                        onClick={() => handleCantarAgora({ id: musica.id, musica: musica.musica, artista: musica.artista })}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Cantar Agora
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60 transition-all z-10 relative"
                        onClick={() => setPendingItem({ id: musica.id, musica: musica.musica, artista: musica.artista })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar à Fila
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {searchResults && searchResults.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-8">
                <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Anterior
                </Button>
                <div className="text-sm font-medium px-4">
                  Página {page} de {searchResults.totalPages}
                </div>
                <Button variant="outline" disabled={page === searchResults.totalPages} onClick={() => setPage(p => p + 1)}>
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
