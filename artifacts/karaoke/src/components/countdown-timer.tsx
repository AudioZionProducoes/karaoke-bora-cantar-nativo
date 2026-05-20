import { useState, useEffect, useMemo } from "react";
import { Clock } from "lucide-react";
import { useTemporaryAccess } from "@/contexts/temporary-access-context";

function formatHHMMSS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CountdownTimer({ className = "", alwaysShow = false, size = "sm" }: { className?: string; alwaysShow?: boolean; size?: "sm" | "lg" }) {
  const { hasAccess, remainingMinutes, access } = useTemporaryAccess();
  const [seconds, setSeconds] = useState(0);

  // Calculate exact remaining seconds from the stored expiresAt
  useEffect(() => {
    if (!hasAccess || !access) {
      setSeconds(0);
      return;
    }

    const expiresAt = access.accessExpiresAt;

    function update() {
      const expires = new Date(expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((expires - now) / 1000));
      setSeconds(remaining);
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [hasAccess, access]);

  const formatted = useMemo(() => formatHHMMSS(seconds), [seconds]);

  // Color/styling based on urgency
  const isUrgent = seconds <= 600; // 10 minutes
  const isCritical = seconds <= 60; // 1 minute

  const isLarge = size === "lg";
  const textSize = isLarge ? "text-lg" : "text-sm";
  const iconSize = isLarge ? "w-5 h-5" : "w-4 h-4";
  const padSize = isLarge ? "px-4 py-2" : "px-3 py-1.5";
  const labelSize = isLarge ? "text-xs" : "text-[10px]";

  if (!hasAccess && !alwaysShow) return null;

  // When alwaysShow is true but no active access, show unlimited session state
  if (!hasAccess && alwaysShow) {
    return (
      <div
        className={`
          flex items-center gap-2 font-mono ${textSize} font-bold tracking-wider
          rounded-lg ${padSize} border backdrop-blur-sm
          text-emerald-400 bg-emerald-500/10 border-emerald-500/20
          ${className}
        `}
      >
        <Clock className={iconSize} />
        <span>24:00:00</span>
        <span className={`${labelSize} uppercase tracking-wide opacity-70`}>Ilimitado</span>
      </div>
    );
  }

  return (
    <div
      className={`
        flex items-center gap-2 font-mono ${textSize} font-bold tracking-wider
        rounded-lg ${padSize} border backdrop-blur-sm
        ${
          isCritical
            ? "text-red-400 bg-red-500/10 border-red-500/40 animate-pulse"
            : isUrgent
            ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
            : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        }
        ${className}
      `}
    >
      <Clock className={`${iconSize} ${isCritical ? "animate-spin" : ""}`} />
      <span>{formatted}</span>
      {isCritical && <span className={`${labelSize} uppercase tracking-wide`}>Acabando!</span>}
    </div>
  );
}

/* Large variant for hero/player overlay */
export function CountdownTimerLarge({ className = "" }: { className?: string }) {
  const { hasAccess, access } = useTemporaryAccess();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!hasAccess || !access) {
      setSeconds(0);
      return;
    }

    const expiresAt = access.accessExpiresAt;

    function update() {
      const expires = new Date(expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((expires - now) / 1000));
      setSeconds(remaining);
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [hasAccess, access]);

  const formatted = useMemo(() => formatHHMMSS(seconds), [seconds]);

  const isUrgent = seconds <= 600;
  const isCritical = seconds <= 60;

  if (!hasAccess) return null;

  return (
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
        ${className}
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
  );
}
