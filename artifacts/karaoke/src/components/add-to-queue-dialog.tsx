import { useState, useEffect, useRef } from "react";
import { Plus, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (item) {
      setName("");
      // Delay focus to let the panel animate in and avoid keyboard issues
      timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [item]);

  function handleConfirm() {
    onConfirm(name.trim() || "Anônimo");
  }

  if (!item) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex flex-col justify-end"
      onClick={(e) => {
        if (e.target === overlayRef.current) onCancel();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Bottom sheet panel */}
      <div className="relative z-10 bg-[#0a0a0a] border-t border-primary/30 rounded-t-2xl shadow-[0_-8px_32px_rgba(250,204,21,0.12)] w-full max-w-lg mx-auto animate-in slide-in-from-bottom duration-300">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-4 pb-6 pt-2 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Adicionar à Fila</h3>
              <p className="text-xs text-white/60 mt-0.5">
                <strong className="text-white">{item.musica}</strong> — {item.artista}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10 shrink-0"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Name input */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5" />
              Nome de quem vai cantar
            </label>
            <Input
              ref={inputRef}
              placeholder="Ex: João, Maria..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              maxLength={40}
              className="h-12 text-base bg-white/5 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-primary/50"
              style={{ touchAction: "manipulation" }}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="flex-1 text-white/60 hover:text-white hover:bg-white/10 h-12 text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-sm"
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
