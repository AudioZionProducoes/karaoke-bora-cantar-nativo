import { Link } from "wouter";
import { Mic2, Settings } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="bg-primary/10 p-2 rounded-lg text-primary ring-1 ring-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
              <Mic2 className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Karaokê CT</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto container p-4">
        {children}
      </main>
      
      <footer className="py-6 border-t border-border/40 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Karaokê CT. The stage is yours.</p>
      </footer>
    </div>
  );
}
