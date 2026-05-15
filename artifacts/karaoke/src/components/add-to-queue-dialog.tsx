import { useState, useEffect, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRound, ListPlus } from "lucide-react";

export interface PendingQueueItem {
  id: number;
  musica: string;
  artista: string;
}

interface AddToQueueDialogProps {
  item: PendingQueueItem | null;
  onConfirm: (singerName: string) => void;
  onCancel: () => void;
}

export function AddToQueueDialog({ item, onConfirm, onCancel }: AddToQueueDialogProps) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) {
      setName("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [item]);

  function handleConfirm() {
    onConfirm(name.trim() || "Anônimo");
  }

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-sm bg-background border-border/60">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <ListPlus className="h-5 w-5" />
            </div>
            <DialogTitle className="text-foreground">Adicionar à Fila</DialogTitle>
          </div>
          {item && (
            <DialogDescription className="text-left">
              <span className="font-semibold text-foreground">{item.musica}</span>
              <br />
              <span className="text-muted-foreground">{item.artista}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="singer-name" className="text-sm text-muted-foreground flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5" />
            Nome de quem vai cantar
          </Label>
          <Input
            ref={inputRef}
            id="singer-name"
            placeholder="Ex: João, Maria..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            className="border-border/60 bg-muted/30"
            maxLength={40}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="bg-primary hover:bg-primary/90">
            <ListPlus className="h-4 w-4 mr-2" />
            Adicionar à Fila
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
