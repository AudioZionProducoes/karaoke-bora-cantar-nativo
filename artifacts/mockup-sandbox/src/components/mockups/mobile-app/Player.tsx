import { Play, Pause, SkipForward, Volume2, Mic2, ChevronLeft, Heart } from "lucide-react";

export function PlayerScreen() {
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

      {/* Top bar */}
      <div className="px-4 pt-2 pb-2 flex items-center gap-3">
        <button className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center">
          <div className="text-xs text-zinc-500">Tocando da fila</div>
        </div>
        <button className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">
          <Heart className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Album art placeholder */}
      <div className="px-8 pt-6 pb-4">
        <div className="aspect-square rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center gap-3">
          <Mic2 className="w-16 h-16 text-zinc-700" />
          <div className="text-zinc-600 text-sm">Bora Cantar</div>
        </div>
      </div>

      {/* Song info */}
      <div className="px-8 pt-2 pb-6">
        <h2 className="text-xl font-bold mb-1">Billie Jean</h2>
        <p className="text-zinc-500 text-sm">Michael Jackson</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
            Carlos está cantando
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-8 pb-6">
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full w-[45%] bg-emerald-500 rounded-full" />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-zinc-500">
          <span>1:52</span>
          <span>4:54</span>
        </div>
      </div>

      {/* Controls */}
      <div className="px-8 pb-8 flex items-center justify-center gap-6">
        <button className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <Volume2 className="w-5 h-5 text-zinc-400" />
        </button>

        <button className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-lg shadow-white/10">
          <Pause className="w-7 h-7 fill-black" />
        </button>

        <button className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <SkipForward className="w-5 h-5 fill-black" />
        </button>
      </div>

      {/* Up next */}
      <div className="px-4 pb-4">
        <div className="text-xs text-zinc-500 mb-2 px-1">Próxima da fila</div>
        <div className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
            <Mic2 className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">I Will Always Love You</div>
            <div className="text-xs text-zinc-500 truncate">Whitney Houston • Ana</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
            <Play className="w-4 h-4 text-zinc-400" />
          </div>
        </div>
      </div>

      {/* Bottom safe area */}
      <div className="h-6" />
    </div>
  );
}
