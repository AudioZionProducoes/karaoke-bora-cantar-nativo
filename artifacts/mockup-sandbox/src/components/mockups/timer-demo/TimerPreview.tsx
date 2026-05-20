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

export function TimerPreview() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Fake player header */}
      <header className="p-3 flex items-center gap-3 bg-black/70 backdrop-blur-md border-b border-white/10 shrink-0">
        <button className="text-white text-sm flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/20 border border-white/10">
          ← Voltar
        </button>
        <div className="flex-1 text-center">
          <div className="font-bold text-sm">Billie Jean</div>
          <div className="text-xs text-white/60">Michael Jackson</div>
        </div>
        <div className="flex items-center gap-2">
          <CountdownTimerDemo initialSeconds={86399} />
          <button className="text-white text-xs px-3 py-1.5 rounded-full bg-black/20 border border-white/10">
            Pontuação
          </button>
        </div>
      </header>

      {/* Fake video area */}
      <div className="flex-1 relative bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎤</div>
          <p className="text-zinc-500 text-lg">Área do vídeo (Bunny Stream iframe)</p>
          <p className="text-zinc-600 text-sm mt-2">O timer aparece fixo aqui embaixo</p>
        </div>

        {/* QR Code mock */}
        <div className="absolute bottom-4 right-4 bg-yellow-400/80 rounded-xl p-3 flex flex-col items-center gap-1">
          <div className="bg-white rounded-md p-1 w-14 h-14 flex items-center justify-center text-[8px] text-black">
            QR
          </div>
          <div className="text-[9px] text-center text-black font-bold">Controle</div>
        </div>

        {/* FIXED TIMER at bottom — always visible above watermark */}
        <div className="fixed bottom-6 left-0 right-0 z-[60] flex justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <CountdownTimerDemo initialSeconds={86399} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Large variant demo for home page */
export function TimerLargePreview() {
  const [seconds, setSeconds] = useState(86399);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const formatted = useMemo(() => formatHHMMSS(seconds), [seconds]);
  const isUrgent = seconds <= 600;
  const isCritical = seconds <= 60;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8 gap-6">
      <h1 className="text-2xl font-bold">Tela Inicial — Contador Grande</h1>
      <div
        className={`
          inline-flex flex-col items-center gap-1
          rounded-xl px-5 py-3 border-2 backdrop-blur-md shadow-lg
          ${
            isCritical
              ? "text-red-400 bg-red-500/15 border-red-500/50 animate-pulse"
              : isUrgent
              ? "text-amber-400 bg-amber-500/15 border-amber-500/40"
              : "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
          }
        `}
      >
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold opacity-80">
          <Clock className={`w-4 h-4 ${isCritical ? "animate-spin" : ""}`} />
          Tempo Restante
        </div>
        <div className="font-mono text-3xl font-black tracking-widest tabular-nums leading-none">
          {formatted}
        </div>
        {isCritical && (
          <div className="text-[10px] uppercase tracking-wide text-red-300 font-bold">
            Acesso expirando!
          </div>
        )}
      </div>
      <p className="text-sm text-zinc-500 text-center max-w-md">
        Este contador aparece na tela inicial quando o cliente tem acesso temporário de 24h ativo.
      </p>
    </div>
  );
}
