# Karaokê CT

Plataforma profissional de karaokê com catálogo de ~80.000 músicas, player integrado com Bunny Stream, painel admin e integração WooCommerce.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run import-musicas -- --file /caminho/para/Dados_CT.ini` — importar catálogo de músicas
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `VITE_BUNNY_LIBRARY_ID` — Bunny Stream Video Library ID (set before deploying)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind CSS + shadcn/ui

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/musicas.ts` — tabela de músicas (id, artista, musica, inicio)
- `lib/db/src/schema/users.ts` — tabela de assinantes (karaoke_users)
- `artifacts/api-server/src/routes/musicas.ts` — busca, CRUD de músicas
- `artifacts/api-server/src/routes/users.ts` — gestão de assinantes
- `artifacts/api-server/src/routes/webhook.ts` — webhook WooCommerce
- `artifacts/karaoke/src/pages/home.tsx` — página principal com busca em tempo real
- `artifacts/karaoke/src/pages/player.tsx` — player Bunny Stream
- `artifacts/karaoke/src/pages/admin.tsx` — painel admin (catálogo + assinantes)
- `scripts/src/import-musicas.ts` — script de importação do arquivo .ini

## Architecture decisions

- Tabela `musicas` usa ID numérico como chave primária (igual ao nome do arquivo no Bunny Stream)
- Busca em tempo real com debounce de 300ms no frontend + paginação de 24 por página no backend
- Busca faz ILIKE nas colunas `artista`, `musica` e `inicio` simultaneamente
- Webhook WooCommerce processa `subscription_active`, `order_completed`, `subscription_cancelled`, `subscription_expired`
- Player usa iframe nativo do Bunny Stream: `https://iframe.mediadelivery.net/embed/{LIBRARY_ID}/{id}`

## Product

- Página principal: busca em tempo real com grid de cards de músicas e botão "Cantar Agora"
- Player: reprodução em tela cheia via iframe Bunny Stream
- Admin — Catálogo: formulário para adicionar músicas ao catálogo
- Admin — Assinantes: tabela com status de assinatura e botão de revogar acesso
- Webhook: integração automática com WooCommerce (criar/revogar acesso em pagamentos)

## User preferences

- Interface em Português (PT/BR)
- Design dark mode premium (padrão Spotify/Netflix)
- Suporte a ~80.000 músicas simultâneas

## Gotchas

- Configurar `VITE_BUNNY_LIBRARY_ID` antes do deploy para que o player funcione
- O script de importação usa `ON CONFLICT DO NOTHING` — pode importar sem risco de duplicatas
- O arquivo `.ini` pode estar em codificação Latin-1 — o script detecta automaticamente
- Após adicionar músicas ao Bunny Stream, o ID do arquivo .mp4 deve ser igual ao ID na tabela

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
