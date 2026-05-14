import { useParams, Link } from "wouter";
import { ArrowLeft, Play, Music, AlertCircle, FolderOpen, Star, RotateCcw, Trophy } from "lucide-react";
import { useGetMusica, getGetMusicaQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocalMusic } from "@/contexts/local-music-context";
import { useState, useCallback } from "react";

function randomScore() {
  return Math.floor(Math.random() * 21) + 80; // 80–100
}

function ScoreScreen({ score, musica, artista, onReplay, onBack }: {
  score: number;
  musica: string;
  artista: string;
  onReplay: () => void;
  onBack: () => void;
}) {
  const stars = score >= 95 ? 5 : score >= 90 ? 4 : score >= 85 ? 3 : 2;
  const label =
    score === 100 ? "Perfeito! 🎤" :
    score >= 95 ? "Incrível!" :
    score >= 90 ? "Excelente!" :
    score >= 85 ? "Muito Bom!" :
    "Bom trabalho!";

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md text-white p-8 animate-in fade-in duration-500">
      <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-primary/30 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-1/2 h-64 bg-violet-500/20 blur-[120px] rounded-full pointer-events-none translate-y-1/2" />

      <Trophy className="h-14 w-14 text-yellow-400 mb-4 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]" />

      <p className="text-muted-foreground text-sm mb-1 uppercase tracking-widest font-medium">Resultado</p>
      <h2 className="text-2xl font-bold mb-1 line-clamp-1 text-center">{musica}</h2>
      <p className="text-muted-foreground text-sm mb-8">{artista}</p>

      {/* Score ring */}
      <div className="relative flex items-center justify-center mb-6">
        <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
          <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle
            cx="80" cy="80" r="70" fill="none"
            stroke="url(#scoreGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 70}`}
            strokeDashoffset={`${2 * Math.PI * 70 * (1 - score / 100)}`}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-5xl font-black tabular-nums leading-none">{score}</span>
          <span className="text-muted-foreground text-xs mt-1">pontos</span>
        </div>
      </div>

      {/* Stars */}
      <div className="flex gap-1.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-7 w-7 transition-all duration-300 ${i < stars ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" : "text-white/20"}`}
          />
        ))}
      </div>

      <p className="text-xl font-bold mb-10 text-primary">{label}</p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onReplay} className="border-white/20 text-white hover:bg-white/10 hover:text-white">
          <RotateCcw className="h-4 w-4 mr-2" />
          Cantar de novo
        </Button>
        <Button onClick={onBack} className="bg-primary hover:bg-primary/90">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Catálogo
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
      <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-primary/20 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />

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

        {/* Manual score trigger for Bunny Stream */}
        {isLibraryConfigured && !score && (
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 hover:text-white backdrop-blur-sm rounded-full bg-black/20 border border-white/10 text-xs"
            onClick={() => setScore(randomScore())}
          >
            <Trophy className="h-3.5 w-3.5 mr-1.5" />
            Pontuação
          </Button>
        )}
        {(!isLibraryConfigured || score) && <div className="w-28" />}
      </header>

      <main className="flex-1 w-full h-screen relative z-10 flex items-center justify-center bg-black pt-16">
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
            controls
            autoPlay
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
              Para reproduzir <strong>{musica.musica}</strong>, selecione a pasta onde estão os arquivos MP4. O player vai encontrar <code className="text-primary bg-primary/10 px-1 rounded">{musica.id}.mp4</code> automaticamente.
            </p>
            <Button onClick={selectFolder} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <FolderOpen className="h-4 w-4 mr-2" />
              Selecionar Pasta de Músicas
            </Button>
          </div>
        )}

        {/* Score overlay */}
        {score !== null && (
          <ScoreScreen
            score={score}
            musica={musica.musica}
            artista={musica.artista}
            onReplay={handleReplay}
            onBack={() => window.history.back()}
          />
        )}
      </main>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
    </div>
  );
}
