import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateMusica, useListUsers, useRevokeUserAccess, getSearchMusicasQueryKey, getGetMusicasStatsQueryKey, useCreateUserPassword } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Settings, Music, Users, Loader2, KeyRound, Smartphone, Ticket } from "lucide-react";
import { CuponsTab } from "@/components/cupons-tab";

const songFormSchema = z.object({
  id: z.coerce.number().min(1, "O ID deve ser maior que 0"),
  artista: z.string().min(1, "O nome do artista é obrigatório"),
  musica: z.string().min(1, "O título da música é obrigatório"),
  inicio: z.string().optional()
});

const statusLabel: Record<string, string> = {
  active: "Ativo",
  cancelled: "Cancelado",
  expired: "Expirado"
};

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof songFormSchema>>({
    resolver: zodResolver(songFormSchema),
    defaultValues: {
      id: undefined,
      artista: "",
      musica: "",
      inicio: ""
    }
  });

  const createMusica = useCreateMusica();

  function onSubmit(values: z.infer<typeof songFormSchema>) {
    createMusica.mutate({ data: values }, {
      onSuccess: () => {
        toast({
          title: "Música cadastrada",
          description: `"${values.musica}" de ${values.artista} foi adicionada ao catálogo.`
        });
        form.reset();
        queryClient.invalidateQueries({ queryKey: getSearchMusicasQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMusicasStatsQueryKey() });
      },
      onError: (error) => {
        toast({
          title: "Erro ao cadastrar música",
          description: (error as {message?:string}).message || String(error) || "Ocorreu um erro desconhecido.",
          variant: "destructive"
        });
      }
    });
  }

  const { data: users, isLoading: isLoadingUsers } = useListUsers();
  const revokeAccess = useRevokeUserAccess();
  const generatePassword = useCreateUserPassword();
  const [generatedPassword, setGeneratedPassword] = useState<{ email: string; password: string } | null>(null);

  function onGeneratePassword(userId: number, email: string) {
    generatePassword.mutate({ id: userId }, {
      onSuccess: (data) => {
        setGeneratedPassword({ email, password: data.temporaryPassword ?? "" });
        toast({
          title: "Senha gerada",
          description: `Nova senha temporária criada para ${email}.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      },
      onError: (error) => {
        toast({
          title: "Erro ao gerar senha",
          description: (error as {message?:string}).message || String(error) || "Ocorreu um erro.",
          variant: "destructive"
        });
      }
    });
  }

  function onRevokeAccess(userId: number, email: string) {
    if (confirm(`Tem certeza que deseja revogar o acesso de ${email}?`)) {
      revokeAccess.mutate({ id: userId }, {
        onSuccess: () => {
          toast({
            title: "Acesso revogado",
            description: `O acesso de ${email} foi revogado com sucesso.`
          });
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        },
        onError: (error) => {
          toast({
            title: "Erro ao revogar acesso",
            description: (error as {message?:string}).message || String(error) || "Ocorreu um erro desconhecido.",
            variant: "destructive"
          });
        }
      });
    }
  }

  return (
    <Layout>
      <div className="py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 text-primary">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerencie o catálogo, assinantes e cupons de acesso</p>
          </div>
        </div>

        <Tabs defaultValue="catalog" className="space-y-6">
          <TabsList className="bg-muted/50 border border-border/40 p-1">
            <TabsTrigger value="catalog" className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6">
              <Music className="h-4 w-4 mr-2" />
              Catálogo
            </TabsTrigger>
            <TabsTrigger value="subscribers" className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6">
              <Users className="h-4 w-4 mr-2" />
              Assinantes
            </TabsTrigger>
            <TabsTrigger value="cupons" className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6">
              <Ticket className="h-4 w-4 mr-2" />
              Cupons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Cadastrar Nova Música</CardTitle>
                <CardDescription>Adicione uma nova música ao catálogo. O ID deve ser igual ao ID do vídeo no Bunny Stream.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID do Bunny Stream</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Ex: 12345" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="artista"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Artista</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Jorge & Mateus" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="musica"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Titulo da Musica</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Amo Noite E Dia" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="inicio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frase de Inicio (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Tem um pedaço do meu peito..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" disabled={createMusica.isPending} className="w-full md:w-auto">
                      {createMusica.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Cadastrar Musica
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscribers" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Assinantes</CardTitle>
                <CardDescription>Gerencie o acesso e as assinaturas dos usuarios. Sessão única: apenas 1 dispositivo por conta.</CardDescription>
              </CardHeader>
              <CardContent>
                {generatedPassword && (
                  <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="text-sm font-medium text-primary mb-1">Senha temporária gerada para {generatedPassword.email}</div>
                    <div className="text-2xl font-mono font-bold text-foreground tracking-widest">{generatedPassword.password}</div>
                    <p className="text-xs text-muted-foreground mt-1">Compartilhe esta senha com o assinante. Ele pode trocar depois.</p>
                    <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs" onClick={() => setGeneratedPassword(null)}>Ocultar</Button>
                  </div>
                )}
                {isLoadingUsers ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !users || users.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                    Nenhum assinante cadastrado ainda.
                  </div>
                ) : (
                  <div className="rounded-md border border-border/40 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>E-mail</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Acesso</TableHead>
                          <TableHead>Expira em</TableHead>
                          <TableHead className="text-right">Acoes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={
                                user.subscriptionStatus === 'active' ? 'default' :
                                user.subscriptionStatus === 'cancelled' ? 'secondary' : 'destructive'
                              }>
                                {statusLabel[user.subscriptionStatus] ?? user.subscriptionStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.accessGranted ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Liberado</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Revogado</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {user.expiresAt ? format(new Date(user.expiresAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Sem expiração'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                {!user.hasPassword ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                                    onClick={() => onGeneratePassword(user.id, user.email)}
                                    disabled={generatePassword.isPending}
                                  >
                                    <KeyRound className="h-3.5 w-3.5 mr-1" />
                                    Gerar Senha
                                  </Button>
                                ) : (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground" title={user.hasActiveSession ? "Sessão ativa em 1 dispositivo" : "Sem sessão ativa"}>
                                    <Smartphone className="h-3 w-3" />
                                    {user.hasActiveSession ? "Online" : "Offline"}
                                  </div>
                                )}
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => onRevokeAccess(user.id, user.email)}
                                  disabled={!user.accessGranted || revokeAccess.isPending}
                                >
                                  Revogar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cupons" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <CuponsTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
