# Karaoke Bora Cantar - App Mobile (Play Store)

## Resumo Completo da Conversa

Data: 20 de Maio de 2026

---

## O que e possivel?

Sim, e totalmente viavel criar um app nativo Android para o Karaoke Bora Cantar na Google Play Store. O backend (API + banco de dados com 80k musicas) ja esta pronto e seria 100% reutilizado.

---

## Vantagens do App na Play Store

1. **Alcance enorme** - bilhoes de usuarios Android podem encontrar e instalar
2. **Profissionalismo** - passa mais credibilidade para bares e restaurantes
3. **Atualizacoes automaticas** - usuarios recebem novas versoes sem fazer nada
4. **Funciona offline parcialmente** - cache local de musicas, busca, fila
5. **Melhor na TV** - app nativo em TVs Android roda mais fluido que navegador
6. **Notificacoes push** - "Sua vez esta chegando", "Musica pausada", etc.
7. **QR Code continua** - o controle remoto via QR funciona do mesmo jeito

---

## Tecnologia: Expo + React Native

- Aproveita todo o React que ja existe no web app
- Mesma API backend (Express) - nada muda no servidor
- Mesmo banco PostgreSQL com 80k musicas
- Player Bunny Stream funciona via WebView nativo
- QR Code via camera do Expo

---

## Telas do App (Mockups ja criados no Canvas)

1. **Buscar Musicas** - Busca com filtros, lista com botao "+" para adicionar
2. **Fila da Sessao** - Quem esta tocando, proximos, trocar de lugar, remover
3. **Controle Remoto** - Player com play/pause/pular, barra de progresso

---

## Tempo Estimado de Desenvolvimento

| Fase | Descricao | Tempo |
|------|-----------|-------|
| Setup + telas principais | Busca, fila, navegacao | 2-3 dias |
| Player Bunny Stream | Video em tela cheia, controles | 2-3 dias |
| QR Code + sessao | Ler QR, conectar, controle | 1-2 dias |
| Branding + Play Store | Logo, icone, splash, APK | 2-3 dias |
| **Total** | | **7 a 10 dias** |

---

## Custos Google Play Store

| Item | Valor | Observacao |
|------|-------|------------|
| Taxa de desenvolvedor Google | **$25 (USD)** | **Paga uma vez so, valida para sempre** |
| Atualizacoes do app | **GRATIS** | Nao paga nada para enviar updates |
| Taxa sobre vendas in-app | 15-30% | So se vender assinatura/pacote pelo app |

**Observacao importante**: Atualizar musicas no Bunny.net NAO exige atualizar o app. O app le do seu backend/API, que por sua vez le do Bunny.net. As musicas sao dinamicas.

---

## Codigo - Quem e o Dono?

**O codigo e 100% seu. O Replit nao disponibiliza para outras pessoas.**

- Projeto no Replit: **privado por padrao** - so voce e quem voce convidar ve
- GitHub: voce subiu para **seu proprio repositorio** (AudioZionProducoes/karaoke-Bora-Cantar)
- App na Play Store: **seu APK**, sua marca, ninguem mais tem acesso
- Sem marca d'agua do Replit no app publicado

---

## Modelo de Negocio para Comercio (Bares, Restaurantes)

### Como o dono do bar ativa o app:

| Opcao | Como funciona |
|-------|---------------|
| **WooCommerce** (online) | Paga no seu site -> recebe cupom/codigo -> digita no app |
| **Voce pessoalmente** | Voce vai no local, recebe em dinheiro/pix -> gera cupom no admin |
| **Assinatura recorrente** | Paga mensal -> sistema ativa automaticamente via webhook |

### Fluxo completo:

1. Dono do bar **baixa o app gratis** na Play Store
2. Abre o app -> tela de "ativar acesso"
3. Digita o **cupom de ativacao** (recebido via WooCommerce ou voce)
4. Acesso liberado pelo **tempo pago** (1 mes, 3 meses, 1 ano)
5. Abre na TV e os clientes escaneiam QR para entrar na fila

### Compatibilidade com TVs:

| Tipo de TV | O que acontece |
|------------|--------------|
| **TV com Android TV** (Sony, TCL, Philips) | App roda **diretamente na TV** - ideal! |
| **TV Samsung (Tizen)** | Baixa no celular e **espelha** a tela para a TV |
| **TV comum + Chromecast** | App no celular + Chromecast - transmite com um toque |
| **TV + TV Box Android** | Instala no TV Box -> TV vira um "celular grande" |

### Espelhamento (quando a TV nao e Android):

Qualquer celular Android consegue espelhar para quase qualquer Smart TV:
- **Smart View** (Samsung) - nativo Samsung -> Samsung
- **Chromecast** - botao "Transmitir" no celular -> TV com Chromecast
- **Miracast** - padrao universal, funciona em varias TVs
- **Cabo HDMI** - USB-C -> HDMI direto na TV

**O app roda no celular** e a TV so mostra a tela. Nao precisa instalar nada na TV.

---

## Decisao Tomada

**Projeto mobile e ADIADO** ate o web app estar 100% pronto, testado e funcionando.

**Codigo de ativacao**: "App Play Store" ou "Aplicativo Play Store"

Quando o usuario falar essa frase, iniciar a Task #11 do projeto e comecar a construir o app nativo Expo/React Native.

---

## Tarefas do Projeto Relacionadas

- **Task #11**: "Add a mobile app so singers can browse and queue songs from their phone" (status: Rascunho)
- **Task #14**: "Push codebase to GitHub" (status: CONCLUIDA)

---

## Proximos Passos (quando ativar)

1. Aceitar Task #11
2. Criar artefato Expo no projeto
3. Reaproveitar API existente
4. Adaptar telas do mockup para React Native
5. Testar player Bunny Stream em WebView
6. Implementar scanner de QR
7. Gerar APK e publicar na Play Store

---

## Links Importantes

- Repositorio GitHub: https://github.com/AudioZionProducoes/karaoke-Bora-Cantar
- Mockups no Canvas: 3 telas mobile ja criadas (Buscar, Fila, Player)

---

## Resumo Final

| Pergunta | Resposta |
|----------|----------|
| Quanto custa publicar? | $25 USD (uma vez) |
| Precisa pagar Replit? | Nao |
| Codigo e meu? | Sim, 100% |
| Tem marca d'agua? | Nao |
| Atualizar musicas requer update? | Nao |
| Funciona em todas as TVs? | Sim (direto ou espelhando) |
| Modelo de pagamento? | WooCommerce + cupom de ativacao |
