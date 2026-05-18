import { useState, useEffect } from "react";
import { Plus, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

  useEffect(() => {
    if (item) setName("");
  }, [item]);

  function handleConfirm() {
    onConfirm(name.trim() || "Anônimo");
  }

  return (
    <Dialog open={item !== null} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar à Fila</DialogTitle>
          {item && (
            <DialogDescription>
              <strong className="text-foreground">{item.musica}</strong> — {item.artista}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5" />
            Nome de quem vai cantar
          </label>
          <Input
            autoFocus
            placeholder="Ex: João, Maria..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            maxLength={40}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} className="text-muted-foreground">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
