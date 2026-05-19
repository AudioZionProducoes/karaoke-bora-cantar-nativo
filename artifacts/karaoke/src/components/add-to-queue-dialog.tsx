import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface QueueCandidate {
  id: number;
  musica: string;
  artista: string;
}

interface AddToQueueDialogProps {
  item: QueueCandidate | null;
  onConfirm: (singerName: string) => void;
  onCancel: () => void;
}

export function AddToQueueDialog({ item, onConfirm, onCancel }: AddToQueueDialogProps) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset name when item opens
  useEffect(() => {
    if (!item) return;
    setName("");
    const t = setTimeout(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
    return () => clearTimeout(t);
  }, [item?.id]);

  const handleConfirm = useCallback(() => {
    onConfirm(name.trim() || "Anônimo");
  }, [name, onConfirm]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Bottom sheet */}
      <div
        className="relative z-10 bg-[#111] border-t border-yellow-500/40 rounded-t-2xl w-full max-w-lg mx-auto"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/25" />
        </div>

        <div className="px-4 pb-4 pt-1 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white">Adicionar à Fila</h3>
              <p className="text-xs text-white/50 mt-0.5 truncate">
                <span className="text-white/70">{item.musica}</span> — {item.artista}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Input field — large, touch-friendly */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-white/40 flex items-center gap-1">
              <UserRound className="h-3 w-3" />
              Nome de quem vai cantar
            </label>
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              placeholder="Ex: João, Maria..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
              maxLength={40}
              autoComplete="off"
              autoCorrect="off"
              className="w-full h-12 px-3 rounded-lg bg-white/8 border border-white/15 text-white text-base placeholder:text-white/25 focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 transition-colors"
            />
          </div>

          {/* Buttons — full width, large touch targets */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="flex-1 h-12 text-sm text-white/50 hover:text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 h-12 text-sm bg-[hsl(55,100%,50%)] hover:bg-[hsl(55,100%,45%)] text-black font-semibold"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
