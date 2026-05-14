import { Link } from "wouter";
import { Mic2, Settings, FolderOpen, FolderCheck, X } from "lucide-react";
import { useLocalMusic } from "@/contexts/local-music-context";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { folderName, selectFolder, clearFolder } = useLocalMusic();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="bg-primary/10 p-2 rounded-lg text-primary ring-1 ring-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
              <Mic2 className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Karaoke CT</span>
          </Link>

          <nav className="flex items-center gap-3">
            {folderName ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1.5">
                  <FolderCheck className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium max-w-[140px] truncate">{folderName}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={clearFolder}
                  title="Remover pasta"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50"
                onClick={selectFolder}
              >
                <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                Pasta de Músicas
              </Button>
            )}

            <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Administração</span>
            </Link>
          </nav>
        </div>
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
