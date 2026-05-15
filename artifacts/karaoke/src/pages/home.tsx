import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search, Play, Music, Mic2, ListPlus, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useSearchMusicas, useGetMusicasStats } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Layout } from "@/components/layout";
import { useQueue, type QueueItem } from "@/contexts/queue-context";
import { useToast } from "@/hooks/use-toast";
import { AddToQueueDialog, type PendingQueueItem } from "@/components/add-to-queue-dialog";

export default function Home() {
  const { addToQueue, isInQueue, queue } = useQueue();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(1);
  const [pendingItem, setPendingItem] = useState<PendingQueueItem | null>(null);

  useMemo(() => { setPage(1); }, [debouncedSearch]);

  const { data: stats } = useGetMusicasStats();
  const { data: searchResults, isLoading } = useSearchMusicas({ q: debouncedSearch, page, limit: 24 });

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
    toast({ title: "Adicionada à fila ✓", description: `"${pendingItem.musica}" entrou na fila para ${singerName}.` });
    setPendingItem(null);
  }

  return (
    <Layout>
      <AddToQueueDialog
        item={pendingItem}
        onConfirm={handleConfirmQueue}
        onCancel={() => setPendingItem(null)}
      />

      <div className="flex flex-col items-center pt-12 pb-8 max-w-3xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-2 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
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

        <div className="w-full relative mt-4 group">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl transition-all group-hover:bg-primary/30 group-focus-within:bg-primary/40 -z-10"></div>
          <div className="relative flex items-center w-full">
            <Search className="absolute left-6 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por artista, música, letra ou código..."
              className="w-full h-16 pl-14 pr-6 rounded-full bg-background border-border/50 text-lg shadow-sm focus-visible:ring-primary focus-visible:border-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            {debouncedSearch ? "Resultados da Busca" : "Catálogo em Destaque"}
          </h2>
          {searchResults && (
            <span className="text-sm text-muted-foreground">{searchResults.total.toLocaleString("pt-BR")} encontradas</span>
          )}
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
                <Card key={musica.id} className="group bg-card border-border/40 hover:border-primary/50 transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] overflow-hidden flex flex-col h-full">
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

                    <div className="flex gap-2 mt-4">
                      <Link href={`/player/${musica.id}`} className="flex-1">
                        <Button className="w-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all z-10 relative">
                          <Play className="h-4 w-4 mr-2" />
                          Cantar Agora
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Adicionar à fila"
                        className={`shrink-0 border-border/50 transition-all z-10 relative ${isInQueue(musica.id) ? "text-emerald-400 border-emerald-400/40 bg-emerald-400/10 hover:bg-emerald-400/20" : "text-muted-foreground hover:text-foreground hover:border-primary/50"}`}
                        onClick={() => openQueueDialog({ id: musica.id, musica: musica.musica, artista: musica.artista })}
                      >
                        {isInQueue(musica.id) ? <Check className="h-4 w-4" /> : <ListPlus className="h-4 w-4" />}
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
