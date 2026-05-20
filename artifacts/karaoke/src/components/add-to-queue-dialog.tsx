import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, UserRound, X, Mic2 } from "lucide-react";
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

  // Reset name when item opens and focus input
  useEffect(() => {
    if (!item) return;
    setName("");
    const t = setTimeout(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.select();
      }
    }, 50);
    return () => clearTimeout(t);
  }, [item?.id]);

  const handleConfirm = useCallback(() => {
    onConfirm(name.trim() || "Anônimo");
  }, [name, onConfirm]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  }, [handleConfirm, onCancel]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop — clickable to dismiss */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal card */}
      <div className="relative z-10 bg-[#141414] border border-yellow-500/40 rounded-2xl w-full max-w-md shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-500/15 rounded-full p-1.5">
              <Mic2 className="h-4 w-4 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Adicionar à Fila</h3>
              <p className="text-xs text-white/50 truncate max-w-[200px]">
                <span className="text-white/70">{item.musica}</span> — {item.artista}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
            onClick={onCancel}
            aria-label="Cancelar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Input field */}
        <div className="px-5 pb-2 space-y-1.5">
          <label className="text-[11px] text-white/40 flex items-center gap-1.5">
            <UserRound className="h-3 w-3" />
            Nome de quem vai cantar
          </label>
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            enterKeyHint="done"
            placeholder="Ex: João, Maria..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={40}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            className="w-full h-12 px-3 rounded-lg bg-white/8 border border-white/15 text-white text-base placeholder:text-white/25 focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 transition-colors"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 p-5 pt-3">
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
  );
}
