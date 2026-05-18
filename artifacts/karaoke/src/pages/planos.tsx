import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Crown, Zap, Star, Music } from "lucide-react";

const PLANOS = [
  {
    id: "mensal",
    nome: "Mensal",
    preco: "R$ 29,90",
    periodo: "/mês",
    descricao: "Acesso ilimitado por 30 dias",
    destaque: false,
    recursos: [
      "Catálogo completo de ~80.000 músicas",
      "Player Bunny Stream em HD",
      "Fila de espera ilimitada",
      "1 dispositivo por vez",
      "Suporte por WhatsApp",
    ],
  },
  {
    id: "trimestral",
    nome: "Trimestral",
    preco: "R$ 79,90",
    periodo: "/3 meses",
    descricao: "Economize 11% no plano de 3 meses",
    destaque: true,
    recursos: [
      "Tudo do plano Mensal",
      "Economia de R$ 9,80",
      "Prioridade na fila de espera",
      "Acesso antecipado a novidades",
      "Suporte prioritário",
    ],
  },
  {
    id: "anual",
    nome: "Anual",
    preco: "R$ 249,90",
    periodo: "/ano",
    descricao: "Economize 30% no plano anual",
    destaque: false,
    recursos: [
      "Tudo do plano Trimestral",
      "Economia de R$ 108,90",
      "2 dispositivos simultâneos",
      "Conta familiar (até 4 pessoas)",
      "Suporte VIP 24h",
    ],
  },
];

// URL do checkout WooCommerce - pode ser configurada via variável de ambiente
const CHECKOUT_URL = import.meta.env.VITE_WOOCOMMERCE_STORE_URL || "https://karaokect.com.br";

function getCheckoutLink(planoId: string) {
  // Mapeia IDs de plano para IDs de produto WooCommerce
  const productIds: Record<string, string> = {
    mensal: "123",
    trimestral: "124",
    anual: "125",
  };
  const productId = productIds[planoId] || "";
  return `${CHECKOUT_URL}/checkout/?add-to-cart=${productId}`;
}

export default function PlanosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center max-w-7xl">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <img src="/logo.jpeg" alt="Karaokê Bora Cantar" className="h-9 w-auto rounded-lg ring-1 ring-white/10" />
            <span className="font-bold text-xl tracking-tight text-foreground">Karaokê Bora Cantar</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Hero */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Crown className="h-4 w-4" />
            Escolha seu plano
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Liberte sua voz sem limites
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Acesso ilimitado ao catálogo completo do Karaokê Bora Cantar. Cante quando quiser,
            onde quiser, com qualidade profissional.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANOS.map((plano) => (
            <Card
              key={plano.id}
              className={`relative border-border/40 bg-card/50 backdrop-blur transition-all hover:border-primary/40 ${
                plano.destaque
                  ? "ring-2 ring-primary/30 shadow-[0_0_30px_rgba(250,204,21,0.1)] scale-[1.02]"
                  : ""
              }`}
            >
              {plano.destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground border-0 px-3 py-1">
                    <Zap className="h-3 w-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  {plano.id === "mensal" && <Music className="h-6 w-6 text-primary" />}
                  {plano.id === "trimestral" && <Star className="h-6 w-6 text-primary" />}
                  {plano.id === "anual" && <Crown className="h-6 w-6 text-primary" />}
                </div>
                <CardTitle className="text-xl">{plano.nome}</CardTitle>
                <CardDescription>{plano.descricao}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <span className="text-3xl font-bold text-foreground">{plano.preco}</span>
                  <span className="text-muted-foreground text-sm">{plano.periodo}</span>
                </div>

                <ul className="space-y-3">
                  {plano.recursos.map((recurso, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{recurso}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`w-full ${
                    plano.destaque
                      ? "bg-primary hover:bg-primary/90 font-bold"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  <a href={getCheckoutLink(plano.id)} target="_blank" rel="noopener noreferrer">
                    Assinar {plano.nome}
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Back */}
        <div className="text-center mt-12">
          <Link href="/">
            <Button variant="ghost" className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Karaokê Bora Cantar
            </Button>
          </Link>
        </div>

        {/* FAQ / Trust */}
        <div className="mt-16 max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold">Perguntas Frequentes</h2>
          <div className="text-left space-y-4 mt-6">
            <div className="p-4 rounded-lg bg-muted/40 border border-border/30">
              <h3 className="font-medium mb-1">Como funciona a assinatura?</h3>
              <p className="text-sm text-muted-foreground">
                Após o pagamento, você recebe um email com login e senha. Acesse o Karaokê Bora Cantar
                em qualquer dispositivo com 1 conta por vez.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/40 border border-border/30">
              <h3 className="font-medium mb-1">Posso cancelar quando quiser?</h3>
              <p className="text-sm text-muted-foreground">
                Sim! O cancelamento pode ser feito a qualquer momento pelo painel da sua conta.
                O acesso permanece ativo até o fim do período pago.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/40 border border-border/30">
              <h3 className="font-medium mb-1">E se eu tiver um cupom de acesso temporário?</h3>
              <p className="text-sm text-muted-foreground">
                Cupons são ótimos para experimentar! Quando o tempo acabar, assine um plano
                para continuar cantando sem interrupções.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-border/40 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Karaokê Bora Cantar. O palco é seu.</p>
      </footer>
    </div>
  );
}
