import { Music, ArrowUpDown, Trash2, Play, User, Search } from "lucide-react";

export function QueueScreen() {
  const queue = [
    { id: 1, musica: "Billie Jean", artista: "Michael Jackson", singer: "Carlos", status: "playing" },
    { id: 2, musica: "I Will Always Love You", artista: "Whitney Houston", singer: "Ana", status: "next" },
    { id: 3, musica: "Sweet Child O' Mine", artista: "Guns N' Roses", singer: "Pedro", status: "waiting" },
    { id: 4, musica: "Bohemian Rhapsody", artista: "Queen", singer: "Você", status: "waiting" },
    { id: 5, musica: "Hotel California", artista: "Eagles", singer: "Maria", status: "waiting" },
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
        <h1 className="text-xl font-bold mb-2">Fila da Sessão</h1>
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>5 músicas na fila</span>
          <span className="text-emerald-400">Sessão: ABC123</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-2 mt-1">
        <button className="flex-1 py-2.5 text-sm font-bold bg-zinc-900 text-zinc-400 rounded-lg border border-zinc-800">Buscar</button>
        <button className="flex-1 py-2.5 text-sm font-bold bg-emerald-500 text-black rounded-lg">Fila</button>
      </div>

      {/* Now playing card */}
      <div className="px-4 mt-3">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-emerald-400 truncate">Tocando Agora</div>
            <div className="text-xs text-zinc-400 truncate">Billie Jean — Michael Jackson</div>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full shrink-0">
            Carlos
          </span>
        </div>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-auto px-4 py-3">
        <div className="flex flex-col gap-2">
          {queue.slice(1).map((item, i) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                item.singer === "Você"
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-zinc-900/80 border-zinc-800/50"
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">
                {i + 2}
              </div>
              <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{item.musica}</div>
                <div className="text-xs text-zinc-500 truncate">{item.artista}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.singer === "Você" && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                    Você
                  </span>
                )}
                <button className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="border-t border-zinc-800 bg-zinc-950/95 backdrop-blur px-6 py-2 flex justify-around items-center text-xs">
        <div className="flex flex-col items-center gap-0.5 text-zinc-500">
          <Search className="w-5 h-5" />
          <span>Buscar</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-emerald-400">
          <User className="w-5 h-5" />
          <span>Fila</span>
        </div>
      </div>
    </div>
  );
}
