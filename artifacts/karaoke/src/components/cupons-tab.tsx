import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreateAccessCodes, useListAccessCodes } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check, Ticket, Clock, Calendar, Hash } from "lucide-react";

const DURATIONS = [
  { value: "15", label: "15 minutos" },
  { value: "30", label: "30 minutos" },
  { value: "60", label: "1 hora" },
  { value: "240", label: "4 horas" },
  { value: "360", label: "6 horas" },
  { value: "720", label: "12 horas" },
  { value: "1440", label: "24 horas" },
];

interface AccessCodeItem {
  id: number;
  code: string;
  durationMinutes: number;
  label: string | null;
  used: boolean;
  usedAt: string | null;
  usedBy: string | null;
  redeemerName: string | null;
  redeemerEmail: string | null;
  redeemerWhatsapp: string | null;
  expiresAt: string | null;
  createdAt: string | null;
  createdBy: number | null;
  status: string;
}

export function CuponsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [duration, setDuration] = useState("60");
  const [quantity, setQuantity] = useState(1);
  const [label, setLabel] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const { data: codes, isLoading } = useListAccessCodes();
  const createCodes = useCreateAccessCodes();

  function onGenerate() {
    const mins = parseInt(duration, 10);
    if (!mins || mins <= 0) {
      toast({ title: "Duração inválida", variant: "destructive" });
      return;
    }

    createCodes.mutate(
      { data: { durationMinutes: mins, quantity, label: label || undefined } },
      {
        onSuccess: (result) => {
          toast({
            title: "Cupons gerados!",
            description: `${result.codes?.length ?? 1} código(s) criados com ${mins} minutos de acesso.`,
          });
          queryClient.invalidateQueries({ queryKey: ["/api/access-codes"] });
          setLabel("");
        },
        onError: (error) => {
          toast({
            title: "Erro ao gerar cupons",
            description: (error as { message?: string }).message || "Tente novamente.",
            variant: "destructive",
          });
        },
      }
    );
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast({ title: "Código copiado!", description: code });
    setTimeout(() => setCopied(null), 2000);
  }

  function formatDuration(mins: number) {
    if (mins < 60) return `${mins}min`;
    if (mins === 60) return "1h";
    if (mins % 60 === 0) return `${mins / 60}h`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}min`;
  }

  function formatDate(iso: string | null) {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "used":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Usado</Badge>;
      case "expired":
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">Expirado</Badge>;
      default:
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
      {/* Generator */}
      <Card className="border-border/40 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Gerar Cupons de Acesso
          </CardTitle>
          <CardDescription>Crie códigos temporários para clientes testarem o Karaokê CT</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Duração do acesso</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        {d.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Identificação (opcional)</label>
              <Input
                placeholder="Ex: Festa Ana, Evento X..."
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <Button
              onClick={onGenerate}
              disabled={createCodes.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createCodes.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Ticket className="mr-2 h-4 w-4" />
              Gerar Cupons
            </Button>
          </div>

          {/* Recently generated */}
          {createCodes.isSuccess && createCodes.data?.codes && (
            <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/30 space-y-2">
              <p className="text-sm font-medium text-primary">Cupons gerados com sucesso:</p>
              <div className="flex flex-wrap gap-2">
                {createCodes.data.codes.map((c: { code: string }) => (
                  <button
                    key={c.code}
                    onClick={() => copyCode(c.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background border border-border/40 hover:border-primary/50 transition-colors text-sm font-mono font-bold"
                  >
                    {copied === c.code ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {c.code}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Clique em qualquer código para copiar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* List */}
      <Card className="border-border/40 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Cupons Gerados
          </CardTitle>
          <CardDescription>Histórico de todos os códigos de acesso</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !codes || codes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
              Nenhum cupom gerado ainda.
            </div>
          ) : (
            <div className="rounded-md border border-border/40 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Identificação</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(codes as AccessCodeItem[]).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-bold text-base tracking-wider">
                        {c.code}
                      </TableCell>
                      <TableCell>{statusBadge(c.status)}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(c.durationMinutes)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.label || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.redeemerName || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.redeemerEmail || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.redeemerWhatsapp || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(c.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {c.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => copyCode(c.code)}
                          >
                            {copied === c.code ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            Copiar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
