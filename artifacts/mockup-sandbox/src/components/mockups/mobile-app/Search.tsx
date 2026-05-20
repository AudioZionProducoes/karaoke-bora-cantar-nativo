import { Search, Music, User, Plus, Mic2 } from "lucide-react";

export function SearchScreen() {
  const songs = [
    { id: 1, musica: "Billie Jean", artista: "Michael Jackson", inicio: "Funk" },
    { id: 2, musica: "I Will Always Love You", artista: "Whitney Houston", inicio: "Pop" },
    { id: 3, musica: "Sweet Child O' Mine", artista: "Guns N' Roses", inicio: "Rock" },
    { id: 4, musica: "Bohemian Rhapsody", artista: "Queen", inicio: "Rock" },
    { id: 5, musica: "Like a Prayer", artista: "Madonna", inicio: "Pop" },
    { id: 6, musica: "Hotel California", artista: "Eagles", inicio: "Rock" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col max-w-[390px] mx-auto">
      {/* Status bar mock */}
      <div className="h-6 bg-black/50 flex items-center justify-between px-4 text-[10px] text-white/60">
        <span>9:41</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-full border border-white/40" />
          <div className="w-3 h-3 rounded-full border border-white/40" />
        </div>
      </div>

      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <h1 className="text-xl font-bold mb-3 flex items-center gap-2">
          <Mic2 className="w-6 h-6 text-emerald-400" />
          Bora Cantar
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar música ou artista..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-2 mt-2">
        <button className="flex-1 py-2.5 text-sm font-bold bg-emerald-500 text-black rounded-lg">Buscar</button>
        <button className="flex-1 py-2.5 text-sm font-bold bg-zinc-900 text-zinc-400 rounded-lg border border-zinc-800">Fila</button>
      </div>

      {/* Results count */}
      <div className="px-4 py-2 text-xs text-zinc-500">
        80.234 músicas disponíveis
      </div>

      {/* Song list */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        <div className="flex flex-col gap-2">
          {songs.map((song, i) => (
            <div
              key={song.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/50"
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{song.musica}</div>
                <div className="text-xs text-zinc-500 truncate">{song.artista}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                  {song.inicio}
                </span>
                <button className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="border-t border-zinc-800 bg-zinc-950/95 backdrop-blur px-6 py-2 flex justify-around items-center text-xs">
        <div className="flex flex-col items-center gap-0.5 text-emerald-400">
          <Search className="w-5 h-5" />
          <span>Buscar</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-zinc-500">
          <User className="w-5 h-5" />
          <span>Fila</span>
        </div>
      </div>
    </div>
  );
}
