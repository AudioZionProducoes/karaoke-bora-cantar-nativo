import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useTemporaryAccess } from "@/contexts/temporary-access-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, LogIn, Lock, Mail, Ticket, Clock, ArrowRight, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [tab, setTab] = useState<"assinante" | "cupom">("cupom");

  // Subscriber login fields
  const [sEmail, setSEmail] = useState("");
  const [sPassword, setSPassword] = useState("");

  // Coupon fields
  const [cEmail, setCEmail] = useState("");
  const [cCode, setCCode] = useState("");
  const [cName, setCName] = useState("");
  const [cWhatsapp, setCWhatsapp] = useState("");
  const [cConsent, setCConsent] = useState(false);
  const [couponUsed, setCouponUsed] = useState<boolean | null>(null); // null = unknown, true = already redeemed, false = new

  const [redeeming, setRedeeming] = useState(false);

  const { login, loading, error, user } = useAuth();
  const { redeemCode, reactivateCode, hasAccess } = useTemporaryAccess();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  if (user || hasAccess) {
    navigate("/");
    return null;
  }

  async function handleSubscriberLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!sEmail.trim() || !sPassword.trim()) return;
    const ok = await login(sEmail.trim(), sPassword.trim());
    if (ok) navigate("/");
  }

  async function checkCouponStatus(code: string) {
    if (!code.trim() || code.trim().length < 4) {
      setCouponUsed(null);
      return;
    }
    try {
      const res = await fetch(`/api/access-codes/validate?code=${encodeURIComponent(code.trim().toUpperCase())}`);
      const data = await res.json().catch(() => ({}));
      if (data.valid === true) {
        setCouponUsed(true); // already redeemed and still valid
      } else if (data.error?.includes("não foi resgatado")) {
        setCouponUsed(false); // new, not yet redeemed
      } else {
        setCouponUsed(null); // unknown / error
      }
    } catch {
      setCouponUsed(null);
    }
  }

  async function handleCouponSubmit() {
    if (!cEmail.trim() || !cCode.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setRedeeming(true);

    let result;
    if (couponUsed === true) {
      // Already redeemed → reactivate with email verification
      result = await reactivateCode(cCode.trim(), cEmail.trim());
    } else {
      // New or unknown → try full redeem
      if (!cName.trim() || !cWhatsapp.trim() || !cConsent) {
        setRedeeming(false);
        toast({ title: "Preencha todos os campos", description: "Nome, WhatsApp e consentimento são obrigatórios para cupons novos.", variant: "destructive" });
        return;
      }
      result = await redeemCode(cCode.trim(), cName.trim(), cEmail.trim(), cWhatsapp.trim(), cConsent);
      if (!result.success && result.error?.includes("já utilizado")) {
        // Fallback: try reactivation
        result = await reactivateCode(cCode.trim(), cEmail.trim());
      }
    }

    setRedeeming(false);
    if (result.success) {
      toast({ title: "Cupom ativado!", description: result.message || "Acesso liberado com sucesso." });
      navigate("/");
    } else {
      toast({ title: "Erro ao ativar cupom", description: result.error || "Verifique o código e tente novamente.", variant: "destructive" });
    }
  }

  const canSubmitCoupon = cEmail.trim() && cCode.trim().length >= 4 &&
    (couponUsed === true || (cName.trim() && cWhatsapp.trim() && cConsent));

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/15 mb-2 overflow-hidden">
            <img src="/logo.jpeg" alt="Karaokê Bora Cantar" className="h-10 w-auto rounded" />
          </div>
          <h1 className="text-2xl font-bold">Karaokê Bora Cantar</h1>
          <p className="text-sm text-muted-foreground">
            Escolha como deseja acessar o sistema.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg bg-muted/50 border border-border/30 p-1">
          <button
            type="button"
            onClick={() => setTab("assinante")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === "assinante"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LogIn className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Assinante
          </button>
          <button
            type="button"
            onClick={() => setTab("cupom")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === "cupom"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Ticket className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Cupom
          </button>
        </div>

        {/* Assinante tab */}
        {tab === "assinante" && (
          <form onSubmit={handleSubscriberLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="seu@email.com"
                value={sEmail}
                onChange={(e) => setSEmail(e.target.value)}
                className="h-12 pl-10 text-base"
                autoFocus
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Senha"
                value={sPassword}
                onChange={(e) => setSPassword(e.target.value)}
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
              disabled={loading || !sEmail.trim() || !sPassword.trim()}
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
        )}

        {/* Cupom tab */}
        {tab === "cupom" && (
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="seu@email.com"
                value={cEmail}
                onChange={(e) => setCEmail(e.target.value)}
                className="h-12 pl-10 text-base"
                autoFocus
              />
            </div>

            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Código do cupom"
                value={cCode}
                onChange={(e) => {
                  setCCode(e.target.value.toUpperCase());
                  setCouponUsed(null);
                }}
                onBlur={() => checkCouponStatus(cCode)}
                className="h-12 pl-10 text-base uppercase tracking-widest font-mono"
                maxLength={8}
              />
            </div>

            {/* Status indicator */}
            {couponUsed === true && (
              <div className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Cupom já usado — será reativado com o tempo restante.
              </div>
            )}
            {couponUsed === false && (
              <div className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-lg px-3 py-2 flex items-center gap-2">
                <Ticket className="h-3.5 w-3.5" />
                Cupom novo — preencha os dados abaixo.
              </div>
            )}

            {/* Extra fields for new coupons */}
            {(couponUsed === false || couponUsed === null) && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
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
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="WhatsApp (ex: 11999999999)"
                    value={cWhatsapp}
                    onChange={(e) => setCWhatsapp(e.target.value)}
                    className="h-11 pl-10 text-base"
                  />
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cConsent}
                    onChange={(e) => setCConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    Aceito receber promoções pelo meu e-mail e WhatsApp. <span className="text-red-400">*</span>
                  </span>
                </label>
              </div>
            )}

            <Button
              onClick={handleCouponSubmit}
              disabled={redeeming || !canSubmitCoupon}
              className="w-full h-12 bg-primary hover:bg-primary/90 font-bold text-base"
            >
              {redeeming ? (
                <span className="animate-pulse">Ativando...</span>
              ) : (
                <>
                  <ArrowRight className="h-5 w-5 mr-2" />
                  {couponUsed === true ? "Reativar Cupom" : "Ativar Cupom"}
                </>
              )}
            </Button>
          </div>
        )}

        <div className="text-center pt-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar ao catálogo
            </Button>
          </Link>
        </div>

        <p className="text-xs text-center text-muted-foreground/60">
          Acesso exclusivo. Sua conta pode ser usada em apenas 1 dispositivo por vez.
        </p>
      </div>
    </div>
  );
}
