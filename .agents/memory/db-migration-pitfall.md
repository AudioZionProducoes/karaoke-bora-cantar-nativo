---
name: DB migration pitfall
description: Schema Drizzle atualizado sem rodar db push causa falha nas queries
---

## Regra

Toda vez que `lib/db/src/schema/*.ts` é alterado (nova coluna, tabela, índice), é obrigatório rodar:

```bash
pnpm --filter @workspace/db run push
```

**Why:** O Drizzle ORM gera queries com todas as colunas do schema TypeScript. Se a coluna existe no schema mas não no Postgres, a query falha com "column does not exist" — derrubando endpoints inteiros.

## How to apply

Após qualquer alteração de schema, verificar com `curl /api/<rota>` antes de considerar a tarefa concluída.
