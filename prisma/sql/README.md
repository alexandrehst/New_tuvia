# `prisma/sql/` — DDL versionada (RLS)

Este diretório guarda DDL que **precisa estar versionada e ser reproduzível** em
todos os ambientes, mas que não é gerada/aplicada pelo fluxo padrão de schema do
projeto.

## Por que aqui e não em `prisma/migrations/`?

O projeto usa **`db:push`** (`prisma db push`) para sincronizar o schema e **não
possui** um diretório `prisma/migrations/` baselined. Introduzir
`prisma/migrations/` só para a RLS faria `prisma migrate deploy` tentar aplicar
um histórico contra um banco não-baselined — frágil e fora do fluxo atual.

A escolha (Decisão D2 da Story 6.6) é versionar a DDL de RLS como um arquivo SQL
dedicado e idempotente, aplicado explicitamente. Assim a RLS:

- vive no repositório (não se perde ao recriar o ambiente),
- pode ser reaplicada com segurança (`DROP POLICY IF EXISTS` + `CREATE POLICY`),
- não interfere no `db:push`/`db:generate` do dia-a-dia.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `rls_tenant_isolation.sql` | Habilita Row-Level Security e cria as policies de isolamento por `clienteId` em todas as tabelas de domínio (incl. tabelas-filhas via JOIN/EXISTS). Idempotente. |

## Como aplicar

> ⚠️ **Não** aplique via `prisma db push` nem `prisma migrate deploy` — esta DDL
> é aplicada explicitamente. Use a `DIRECT_URL` (role `postgres`, sem pgbouncer).

### Opção A — psql (local / CI)

```bash
psql "$DIRECT_URL" -f prisma/sql/rls_tenant_isolation.sql
```

### Opção B — Supabase SQL Editor

Cole o conteúdo de `rls_tenant_isolation.sql` no SQL Editor do projeto Supabase e
execute. O script é transacional (`BEGIN`/`COMMIT`) e idempotente.

### Opção C — Supabase CLI

```bash
supabase db execute --file prisma/sql/rls_tenant_isolation.sql
```

## Reaplicar após mudanças de schema

Sempre que **novas tabelas de domínio** forem adicionadas ao
`prisma/schema.prisma`, atualize `rls_tenant_isolation.sql` (habilitar RLS +
policy por `clienteId` ou por cadeia de FK) e reaplique. Rode o
`pnpm db:push`/`db:generate` **antes** de reaplicar a RLS, pois a RLS pressupõe
que as tabelas já existem.

## Quem bypassa a RLS (importante)

- O role **`postgres`** (usado pelo Prisma via `DATABASE_URL`/`DIRECT_URL`) tem
  **`BYPASSRLS`** — ignora estas policies. Hoje **todo** o acesso de dados é via
  Prisma, então a RLS é **rede secundária**; a defesa primária é o guard de
  aplicação (`assertMesmoTenant` + filtro `clienteId`). Ver
  `docs/architecture.md → Isolamento multi-tenant`.
- A RLS passa a valer de fato quando algo acessar o banco por uma conexão
  **sujeita a RLS** (supabase-js com role `authenticated`, ou Prisma sob um role
  não-privilegiado injetando `SET LOCAL app.current_tenant` — **Opção B**, um
  follow-up fora do escopo da Story 6.6).
