import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4 bg-card border-border/40">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold">404 — Página não encontrada</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            A página que você tentou acessar não existe.
          </p>
          <Link href="/">
            <Button className="mt-6 w-full">Voltar ao Catálogo</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
