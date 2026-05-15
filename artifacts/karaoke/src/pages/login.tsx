import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic2, ArrowLeft, LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const { login, loading, error, user } = useAuth();
  const [, navigate] = useLocation();

  // If already logged in, redirect to home
  if (user) {
    navigate("/");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    const ok = await login(email.trim());
    if (ok) navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/15 mb-2">
            <Mic2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Karaokê CT</h1>
          <p className="text-sm text-muted-foreground">
            Entre com o email da sua assinatura para liberar o sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base"
              autoFocus
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 bg-primary hover:bg-primary/90 font-bold text-base"
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <span className="animate-pulse">Verificando...</span>
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-2" />
                Entrar
              </>
            )}
          </Button>
        </form>

        <div className="text-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar ao catálogo
            </Button>
          </Link>
        </div>

        <p className="text-xs text-center text-muted-foreground/60">
          Acesso exclusivo para assinantes. Não tem assinatura?{" "}
          <a href="#" className="text-primary hover:underline">Fale conosco</a>.
        </p>
      </div>
    </div>
  );
}
