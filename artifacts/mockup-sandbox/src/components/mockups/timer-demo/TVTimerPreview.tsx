import { useState, useEffect, useMemo } from "react";
import { Clock } from "lucide-react";

function formatHHMMSS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function CountdownTimerDemo({ initialSeconds = 86399 }: { initialSeconds?: number }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const formatted = useMemo(() => formatHHMMSS(seconds), [seconds]);
  const isUrgent = seconds <= 600;
  const isCritical = seconds <= 60;

  return (
    <div
      className={`
        flex items-center gap-2 font-mono text-sm font-bold tracking-wider
        rounded-lg px-3 py-1.5 border backdrop-blur-sm
        ${
          isCritical
            ? "text-red-400 bg-red-500/10 border-red-500/40 animate-pulse"
            : isUrgent
            ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
            : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        }
      `}
    >
      <Clock className={`w-4 h-4 ${isCritical ? "animate-spin" : ""}`} />
      <span>{formatted}</span>
      {isCritical && <span className="text-[10px] uppercase tracking-wide">Acabando!</span>}
    </div>
  );
}

export function TVTimerPreview() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden relative">
      {/* Fake header */}
      <header className="shrink-0 bg-black/70 backdrop-blur-sm border-b border-white/5 px-3 py-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="text-white/80 text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10">
              ← Sair
            </button>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">TV</div>
            <div className="font-bold text-xs">Sessão: <span className="text-yellow-400">F2K5KM</span></div>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="text-[10px] px-2 py-1 rounded-full border border-green-500/50 text-green-400 bg-green-500/20">
              Modo Casa
            </button>
            <button className="text-[10px] px-2 py-1 rounded-full border border-red-500/50 text-red-400 bg-red-500/20">
              Sem Pontuação
            </button>
          </div>
        </div>
      </header>

      {/* Fake video area with timer in top-right */}
      <div className="flex-1 relative bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎤</div>
          <p className="text-zinc-500 text-lg">Área do vídeo (Bunny Stream)</p>
        </div>

        {/* TIMER — top-right corner */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-20">
          <CountdownTimerDemo initialSeconds={86340} />
        </div>

        {/* Logo watermark */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10 h-20 w-20 md:h-28 md:w-28 bg-zinc-800 rounded-lg opacity-40 pointer-events-none flex items-center justify-center text-[10px] text-white/30">
          Logo
        </div>

        {/* QR Code */}
        <div className="absolute bottom-4 right-4 z-30 bg-yellow-400 rounded-xl p-3 flex flex-col items-center gap-1 shadow-lg">
          <div className="bg-white rounded-md p-1 w-14 h-14 flex items-center justify-center text-[8px] text-black font-bold">
            QR
          </div>
          <div className="text-[9px] text-center text-black font-bold">Controle</div>
        </div>
      </div>

      {/* Explanation */}
      <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none">
        <p className="text-xs text-white/50">
          O timer aparece aqui ↑ no canto superior direito quando o cliente tem acesso de 24h ativo
        </p>
      </div>
    </div>
  );
}
