import { useParams, Link } from "wouter";
import { ArrowLeft, Play, Music, AlertCircle, FolderOpen } from "lucide-react";
import { useGetMusica, getGetMusicaQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocalMusic } from "@/contexts/local-music-context";

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <div className="p-4 flex items-center justify-between z-10">
          <Skeleton className="h-10 w-24" />
          <div className="flex-1 flex justify-center">
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="w-24"></div>
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
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Catálogo
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden selection:bg-primary/30">
      <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-primary/20 blur-[120px] rounded-full pointer-events-none -translate-y-1/2"></div>

      <header className="p-4 flex items-center justify-between z-20 absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white backdrop-blur-sm rounded-full bg-black/20 border border-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="flex-1 flex flex-col items-center text-center px-4">
          <h1 className="font-bold text-lg md:text-xl drop-shadow-md line-clamp-1">{musica.musica}</h1>
          <div className="text-primary-foreground/70 text-sm font-medium flex items-center gap-2">
            <Music className="h-3 w-3" />
            {musica.artista}
          </div>
        </div>

        <div className="w-24"></div>
      </header>

      <main className="flex-1 w-full h-screen relative z-10 flex items-center justify-center bg-black pt-16">
        {isLibraryConfigured ? (
          /* ── Bunny Stream (produção) ── */
          <iframe
            src={`https://iframe.mediadelivery.net/embed/${libraryId}/${musica.id}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          />
        ) : localVideoUrl ? (
          /* ── Arquivo local carregado ── */
          <video
            key={localVideoUrl}
            src={localVideoUrl}
            className="w-full h-full object-contain"
            controls
            autoPlay
          />
        ) : folderName ? (
          /* ── Pasta selecionada mas arquivo não encontrado ── */
          <div className="text-center p-8 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 max-w-md">
            <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Arquivo não encontrado</h2>
            <p className="text-muted-foreground mb-2">
              O arquivo <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">{musica.id}.mp4</code> não existe na pasta <strong>{folderName}</strong>.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              Verifique se o arquivo está na pasta e tente selecionar novamente.
            </p>
          </div>
        ) : (
          /* ── Nenhuma fonte configurada — pedir pasta ── */
          <div className="text-center p-8 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 max-w-md">
            <FolderOpen className="h-14 w-14 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Selecione a pasta de músicas</h2>
            <p className="text-muted-foreground mb-6">
              Para reproduzir <strong>{musica.musica}</strong>, selecione a pasta onde estão os arquivos MP4. O player vai encontrar <code className="text-primary bg-primary/10 px-1 rounded">{musica.id}.mp4</code> automaticamente.
            </p>
            <Button onClick={selectFolder} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <FolderOpen className="h-4 w-4 mr-2" />
              Selecionar Pasta de Músicas
            </Button>
          </div>
        )}
      </main>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-10"></div>
    </div>
  );
}
