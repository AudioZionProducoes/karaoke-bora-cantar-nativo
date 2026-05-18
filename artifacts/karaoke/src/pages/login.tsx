import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useTemporaryAccess } from "@/contexts/temporary-access-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic2, ArrowLeft, LogIn, Lock, Mail, Ticket, Clock, ArrowRight, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  // Coupon form fields
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cWhatsapp, setCWhatsapp] = useState("");
  const [cCode, setCCode] = useState("");

  const { login, loading, error, user } = useAuth();
  const { redeemCode, hasAccess } = useTemporaryAccess();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  if (user || hasAccess) {
    navigate("/");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    const ok = await login(email.trim(), password.trim());
    if (ok) navigate("/");
  }

  async function handleRedeem() {
    if (!cName.trim() || !cEmail.trim() || !cWhatsapp.trim() || !cCode.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setRedeeming(true);
    const result = await redeemCode(cCode.trim(), cName.trim(), cEmail.trim(), cWhatsapp.trim());
    setRedeeming(false);
    if (result.success) {
      toast({ title: "Cupom ativado!", description: result.message || "Acesso liberado com sucesso." });
      navigate("/");
    } else {
      toast({ title: "Erro ao ativar cupom", description: result.error || "Verifique o código e tente novamente.", variant: "destructive" });
    }
  }

  const canRedeem = cName.trim() && cEmail.trim() && cWhatsapp.trim() && cCode.trim().length >= 4;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/15 mb-2 overflow-hidden">
            <img src="/logo.jpeg" alt="Karaokê Bora Cantar" className="h-10 w-auto rounded" />
          </div>
          <h1 className="text-2xl font-bold">Karaokê Bora Cantar</h1>
          <p className="text-sm text-muted-foreground">
            Entre com email e senha da sua assinatura para liberar o sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 pl-10 text-base"
              autoFocus
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pl-10 text-base"
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
            disabled={loading || !email.trim() || !password.trim()}
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

        {/* Coupon redeem section */}
        <div className="space-y-3">
          {!showCoupon ? (
            <button
              type="button"
              onClick={() => setShowCoupon(true)}
              className="w-full text-center text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-2 py-2"
            >
              <Ticket className="h-4 w-4" />
              Tenho um cupom de acesso temporário
            </button>
          ) : (
            <div className="space-y-3 border border-border/40 rounded-xl p-4 bg-muted/20">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                Usar cupom de acesso
              </div>
              <p className="text-xs text-muted-foreground">
                Preencha seus dados para ativar o acesso. Seus dados serão usados para envio de promoções e novidades.
              </p>

              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome completo"
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    className="h-11 pl-10 text-base"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    className="h-11 pl-10 text-base"
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="WhatsApp (ex: 11999999999)"
                    value={cWhatsapp}
                    onChange={(e) => setCWhatsapp(e.target.value)}
                    className="h-11 pl-10 text-base"
                  />
                </div>

                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Código do cupom"
                    value={cCode}
                    onChange={(e) => setCCode(e.target.value.toUpperCase())}
                    className="h-11 pl-10 text-base uppercase tracking-widest font-mono"
                    maxLength={8}
                  />
                </div>
              </div>

              <Button
                onClick={handleRedeem}
                disabled={redeeming || !canRedeem}
                className="w-full h-11 bg-primary hover:bg-primary/90 font-bold"
              >
                {redeeming ? (
                  <span className="animate-pulse">Ativando...</span>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Ativar Cupom
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setShowCoupon(false)}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Voltar para login com senha
              </button>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar ao catálogo
            </Button>
          </Link>
        </div>

        <p className="text-xs text-center text-muted-foreground/60">
          Acesso exclusivo para assinantes. Sua conta pode ser usada em apenas 1 dispositivo por vez.
        </p>
      </div>
    </div>
  );
}
