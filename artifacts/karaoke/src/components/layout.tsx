import { useState } from "react";
import { Link } from "wouter";
import { Mic2, Settings, FolderOpen, FolderCheck, X, Sun, Moon, ListMusic, Trash2, UserRound, LogIn, LogOut } from "lucide-react";
import { useLocalMusic } from "@/contexts/local-music-context";
import { useTheme } from "@/components/theme-provider";
import { useQueue } from "@/contexts/queue-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { folderName, selectFolder, clearFolder } = useLocalMusic();
  const { theme, setTheme } = useTheme();
  const { queue, removeFromQueue, clearQueue } = useQueue();
  const { user, logout } = useAuth();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [queueOpen, setQueueOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="bg-primary/10 p-2 rounded-lg text-primary ring-1 ring-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] dark:shadow-[0_0_15px_rgba(250,204,21,0.2)]">
              <Mic2 className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Karaoke CT</span>
          </Link>

          <nav className="flex items-center gap-3">
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

            {user ? (
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

        {/* Slide-down queue panel */}
        {queueOpen && (
          <div className="border-t border-border/40 bg-background/98 animate-in slide-in-from-top duration-200">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <ListMusic className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Fila de espera</span>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{queue.length}/30</span>
                </div>
                <div className="flex items-center gap-2">
                  {queue.length > 0 && (
                    <Button variant="ghost" size="sm"
                      className="text-xs text-muted-foreground hover:text-destructive h-7"
                      onClick={clearQueue}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" />Limpar tudo
                    </Button>
                  )}
                  <Button variant="ghost" size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground h-7 gap-1"
                    onClick={() => setQueueOpen(false)}>
                    <X className="h-3.5 w-3.5" />Fechar
                  </Button>
                </div>
              </div>

              {queue.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
                  <ListMusic className="h-5 w-5 opacity-40" />
                  <p>A fila está vazia. Clique em <strong className="text-foreground/60">+</strong> em qualquer música para adicionar.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pb-3">
                  {queue.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40 border border-border/30 hover:border-primary/30 transition-colors">
                      <span className="text-xs font-mono text-muted-foreground w-5 shrink-0 text-center">{index + 1}</span>
                      <div className="bg-primary/15 rounded-full p-1 shrink-0">
                        <UserRound className="h-3 w-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-primary line-clamp-1">{item.singerName}</div>
                        <div className="text-xs text-foreground line-clamp-1">{item.musica}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{item.artista}</div>
                      </div>
                      <Button variant="ghost" size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeFromQueue(item.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
