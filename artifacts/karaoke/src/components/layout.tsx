import { useState } from "react";
import { Link } from "wouter";
import { Mic2, Settings, FolderOpen, FolderCheck, X, Sun, Moon, ListMusic, Trash2, UserRound, LogIn, LogOut, Ticket, Clock, AlertTriangle, ArrowRight, Search } from "lucide-react";
import { useLocalMusic } from "@/contexts/local-music-context";
import { useTheme } from "@/components/theme-provider";
import { useQueue } from "@/contexts/queue-context";
import { useAuth } from "@/contexts/auth-context";
import { useTemporaryAccess } from "@/contexts/temporary-access-context";
import { useSearch } from "@/contexts/search-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Layout({ children }: { children: React.ReactNode }) {
  const { folderName, selectFolder, clearFolder } = useLocalMusic();
  const { theme, setTheme } = useTheme();
  const { queue, removeFromQueue, clearQueue } = useQueue();
  const { user, logout } = useAuth();
  const { hasAccess, remainingMinutes, clearAccess } = useTemporaryAccess();
  const { searchTerm, setSearchTerm } = useSearch();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [queueOpen, setQueueOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-7xl py-2">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary ring-1 ring-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] dark:shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                    <Mic2 className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-xl tracking-tight text-foreground drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Karaoke CT</span>
                </Link>

                {/* Queue toggle button */}
                <Button
                  variant={queueOpen ? "default" : "outline"}
                  size="sm"
                  className={`relative text-xs border-border/50 transition-all ${queueOpen ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:text-foreground hover:border-primary/50"}`}
                  onClick={() => setQueueOpen((o) => !o)}
                  title={queueOpen ? "Ocultar fila" : "Ver fila de espera"}
                >
                  <ListMusic className="h-3.5 w-3.5 mr-1.5" />
                  Fila
                  {queue.length > 0 && (
                    <span className={`absolute -top-1.5 -right-1.5 text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none ${queueOpen ? "bg-white text-primary" : "bg-primary text-white"}`}>
                      {queue.length}
                    </span>
                  )}
                </Button>
              </div>

              {/* Search bar below logo */}
              <div className="relative group w-72">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg transition-all group-hover:bg-primary/30 group-focus-within:bg-primary/40 dark:bg-yellow-400/20 dark:group-hover:bg-yellow-400/30 dark:group-focus-within:bg-yellow-400/40 -z-10" />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white dark:text-black pointer-events-none z-10" />
                <Input
                  type="text"
                  placeholder="Buscar música..."
                  className="w-full h-9 pl-9 pr-4 rounded-full bg-black border-white/30 text-white placeholder:text-white/60 text-sm shadow-sm focus-visible:ring-white focus-visible:border-white dark:bg-[hsl(55,100%,50%)] dark:border-black/30 dark:text-black dark:placeholder:text-black/60 dark:focus-visible:ring-black dark:focus-visible:border-black transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

          <nav className="flex items-center gap-3">

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground border border-border/50 rounded-lg"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              title={isDark ? "Mudar para fundo branco" : "Mudar para fundo preto"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {hasAccess ? (
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1 border ${
                  remainingMinutes <= 10
                    ? "text-amber-400 bg-amber-500/10 border-amber-500/30 animate-pulse"
                    : "text-primary bg-primary/10 border-primary/20"
                }`}>
                  <Clock className="h-3 w-3" />
                  <span>{remainingMinutes}min</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
                  onClick={clearAccess}
                  title="Encerrar acesso temporário"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline" title={user.email}>
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
                  onClick={logout}
                  title="Sair"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-medium text-primary dark:text-[hsl(55,100%,50%)] hover:text-primary/80 dark:hover:text-[hsl(55,100%,60%)] transition-colors flex items-center gap-1.5">
                <LogIn className="h-4 w-4" />
                <span>Entrar</span>
              </Link>
            )}
          </nav>
          </div>
        </div>

        {/* Warning banner when temporary access is about to expire */}
        {hasAccess && remainingMinutes <= 10 && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2">
            <div className="container mx-auto max-w-7xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-amber-400 font-medium">
                  Seu tempo está acabando! Faltam apenas {remainingMinutes} minutos.
                </span>
              </div>
              <Link href="/planos">
                <Button
                  size="sm"
                  className="h-7 text-xs bg-amber-500 hover:bg-amber-500/90 text-black font-bold shrink-0"
                >
                  Assinar plano
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Slide-out queue panel from the right */}
        {queueOpen && (
          <div className="fixed inset-0 z-50 flex" onClick={() => setQueueOpen(false)}>
            <div className="flex-1" />
            <div
              className="w-full max-w-md bg-background/98 border-l border-border/40 animate-in slide-in-from-right duration-200 flex flex-col max-h-[calc(100vh-4rem)] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border/40 sticky top-0 bg-background/98 backdrop-blur">
                <div className="flex items-center gap-2">
                  <ListMusic className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-base">Fila de espera</span>
                  <span className="text-sm text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">{queue.length}/30</span>
                </div>
                <div className="flex items-center gap-2">
                  {queue.length > 0 && (
                    <Button variant="ghost" size="sm"
                      className="text-sm text-muted-foreground hover:text-destructive h-8"
                      onClick={clearQueue}>
                      <Trash2 className="h-4 w-4 mr-1" />Limpar
                    </Button>
                  )}
                  <Button variant="ghost" size="sm"
                    className="text-sm text-muted-foreground hover:text-foreground h-8 gap-1"
                    onClick={() => setQueueOpen(false)}>
                    <X className="h-4 w-4" />Fechar
                  </Button>
                </div>
              </div>

              <div className="p-4 flex-1">
                {queue.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-base">
                    <ListMusic className="h-6 w-6 opacity-40" />
                    <p>A fila está vazia. Clique em <strong className="text-foreground/60">+</strong> em qualquer música para adicionar.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queue.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-4 px-4 py-3 rounded-lg bg-muted/40 border border-border/30 hover:border-primary/30 transition-colors">
                        <span className="text-sm font-mono text-muted-foreground w-6 shrink-0 text-center">{index + 1}</span>
                        <div className="bg-primary/15 rounded-full p-1.5 shrink-0">
                          <UserRound className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-white line-clamp-1">{item.singerName}</div>
                          <div className="text-sm text-foreground line-clamp-1">{item.musica}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">{item.artista}</div>
                        </div>
                        <Button variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => removeFromQueue(item.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto container p-4">
        {children}
      </main>

      <footer className="py-6 border-t border-border/40 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Karaoke CT. O palco é seu.</p>
      </footer>
    </div>
  );
}
