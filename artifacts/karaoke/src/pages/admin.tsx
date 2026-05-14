import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateMusica, useListUsers, useRevokeUserAccess, getSearchMusicasQueryKey, getGetMusicasStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Settings, Music, Users, Loader2 } from "lucide-react";

const songFormSchema = z.object({
  id: z.coerce.number().min(1, "ID must be greater than 0"),
  artista: z.string().min(1, "Artist is required"),
  musica: z.string().min(1, "Title is required"),
  inicio: z.string().optional()
});

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
          title: "Track added",
          description: `Successfully added "${values.musica}" by ${values.artista}`
        });
        form.reset();
        // Invalidate catalog queries
        queryClient.invalidateQueries({ queryKey: getSearchMusicasQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMusicasStatsQueryKey() });
      },
      onError: (error) => {
        toast({
          title: "Error adding track",
          description: error.error || "An unknown error occurred",
          variant: "destructive"
        });
      }
    });
  }

  const { data: users, isLoading: isLoadingUsers } = useListUsers();
  const revokeAccess = useRevokeUserAccess();

  function onRevokeAccess(userId: number, email: string) {
    if (confirm(`Are you sure you want to revoke access for ${email}?`)) {
      revokeAccess.mutate({ id: userId }, {
        onSuccess: () => {
          toast({
            title: "Access revoked",
            description: `Successfully revoked access for ${email}`
          });
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        },
        onError: (error) => {
          toast({
            title: "Error revoking access",
            description: error.error || "An unknown error occurred",
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
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage catalog and subscribers</p>
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
          </TabsList>
          
          <TabsContent value="catalog" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Add New Track</CardTitle>
                <CardDescription>Add a new karaoke track to the database. The ID must match the Bunny Stream video ID.</CardDescription>
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
                            <FormLabel>Bunny Stream ID</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g. 12345" {...field} />
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
                            <FormLabel>Artista (Artist)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Jorge & Mateus" {...field} />
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
                            <FormLabel>Título (Title)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Amo Noite E Dia" {...field} />
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
                            <FormLabel>Frase de Início (Starting Lyrics) - Optional</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Tem um pedaço do meu peito bem colado ao teu" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button type="submit" disabled={createMusica.isPending} className="w-full md:w-auto">
                      {createMusica.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Track to Catalog
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subscribers" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Subscribers</CardTitle>
                <CardDescription>Manage user access and subscriptions.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !users || users.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                    No subscribers found.
                  </div>
                ) : (
                  <div className="rounded-md border border-border/40 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Access</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
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
                                {user.subscriptionStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.accessGranted ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Granted</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Revoked</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {user.expiresAt ? format(new Date(user.expiresAt), "MMM d, yyyy") : 'Never'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => onRevokeAccess(user.id, user.email)}
                                disabled={!user.accessGranted || revokeAccess.isPending}
                              >
                                Revoke Access
                              </Button>
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
        </Tabs>
      </div>
    </Layout>
  );
}
