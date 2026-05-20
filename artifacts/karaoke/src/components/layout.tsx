import { Link } from "wouter";
import { Sun, Moon, LogIn, LogOut, AlertTriangle, ArrowRight, Search } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/contexts/auth-context";
import { useTemporaryAccess } from "@/contexts/temporary-access-context";
import { useSearch } from "@/contexts/search-context";
import { CountdownTimer } from "@/components/countdown-timer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { hasAccess, remainingMinutes, clearAccess } = useTemporaryAccess();
  const { searchTerm, setSearchTerm } = useSearch();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-7xl py-2">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
                  <img src="/logo.jpeg" alt="Karaokê Bora Cantar" className="h-10 w-auto rounded-lg ring-1 ring-white/10 shadow-[0_0_15px_rgba(250,204,21,0.15)]" />
                  <span className="font-bold text-xl tracking-tight text-foreground drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Karaokê Bora Cantar</span>
                </Link>
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
                <CountdownTimer />
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
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto container p-4">
        {children}
      </main>

      <footer className="py-6 border-t border-border/40 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Karaokê Bora Cantar. O palco é seu.</p>
      </footer>
    </div>
  );
}
