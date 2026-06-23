# Story 6.6: RLS no Postgres (defesa em profundidade)

Status: done (Opção C — escopo base entregue; Opção B é follow-up)

> **Reconciliação (2026-06-22) — ver `_bmad-output/planning-artifacts/architecture-epic6-seguranca.md`.** Decisão D1 (profundidade) FECHADA = **Opção C**: escrever as policies RLS por `clienteId` como **migração versionada** (introduzir `prisma/migrations/` ou `prisma/sql/`, pois o projeto usa `db:push`), mantendo o **guard de aplicação como defesa PRIMÁRIA** (`assertMesmoTenant` + filtro `clienteId`); RLS é rede secundária (só atua via supabase-js, hoje quase nada). **Opção B** (Prisma sob role não-privilegiado + `SET LOCAL app.current_tenant`) sai do escopo desta story e vira endurecimento futuro — as ACs/Tasks condicionais a B devem ser marcadas como out-of-scope/follow-up. Ajustar o `project-context.md` (a frase "RLS reforça" é otimista hoje).

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

> ⚠️ **Esta story exige uma decisão de arquitetura ANTES de codar.** A investigação (Task 1) é pré-requisito bloqueante: o resultado dela define se as Tasks 3–4 entram no escopo ou ficam adiadas. Ver **Dev Notes → Análise crítica: Prisma vs. RLS** e **Decisões em Aberto**. Não pule para a implementação sem fechar a Decisão D1.

## Story

As a responsável pela isolação multi-tenant,
I want políticas RLS por `clienteId` no Postgres,
so that o isolamento não dependa só de lembrar o guard na aplicação — quando um guard for esquecido (como no IDOR já corrigido), o banco ainda nega o vazamento.

## Acceptance Criteria

> As ACs 1–4 são o **escopo base garantido** (opção recomendada C — ver Dev Notes). As ACs 5–6 só entram em escopo se a Decisão **D1** escolher também ligar o caminho do Prisma sujeito a RLS (opção B). Se D1 = "só base", marcar 5–6 como fora de escopo desta story e abrir follow-up.

1. **Given** as tabelas com `clienteId` (`User`, `Departamento`, `PlanoEstrategico`, `Plano`, `Dominio`) **e** as tabelas filhas sem `clienteId` próprio mas pertencentes ao tenant via FK (`PlanoUsuario`, `Objetivo`, `ObjetivoResponsavel`, `ResultadoChave`, `HistoricoValores`, `LinhaTendencia`), **When** a migração é aplicada, **Then** `ROW LEVEL SECURITY` está **habilitada** (`ENABLE ROW LEVEL SECURITY`) em todas essas tabelas e na tabela `Cliente`, e existe ao menos uma policy por tabela. (A tabela `Cliente` é o tenant raiz — `id` é o próprio `clienteId`.)

2. **Given** as policies criadas, **Then** elas restringem as linhas ao tenant corrente derivado do **contexto da conexão** — `auth.uid()`/`auth.jwt()` para conexões via supabase-js (role `authenticated`) **e/ou** `current_setting('app.current_tenant', true)` para conexões que injetam o tenant por request (ver Dev Notes). A fonte do tenant em cada policy está documentada num comentário SQL na própria migração.

3. **Given** o cliente **anônimo** do Supabase (role `anon`), **When** ele tenta ler/escrever qualquer tabela de domínio, **Then** **nenhuma linha** é retornada e nenhuma escrita é permitida (RLS nega por padrão quando não há policy aplicável ao role).

4. **Given** a migração de RLS, **Then** ela é **versionada no repositório** como migração SQL Prisma (`prisma/migrations/<timestamp>_rls_tenant_isolation/migration.sql`) e é **idempotente/segura para reaplicar** (`ENABLE … ` é idempotente; usar `DROP POLICY IF EXISTS` antes de `CREATE POLICY`). A aplicação (`pnpm db:migrate` / deploy) não quebra: `pnpm build`, `pnpm typecheck`, `pnpm test` e o app continuam funcionando após aplicar (ver AC-6 para o caso Prisma-sob-RLS).

5. **❌ OUT-OF-SCOPE (condicional a D1 = opção B; ver follow-up).** ~~Given que o app lê dados via Prisma (não supabase-js), When a conexão do Prisma passa a usar um role sujeito a RLS e cada request injeta `SET app.current_tenant = '<clienteId>'` (via `prisma.$executeRaw` na fronteira da action/query, dentro de transação), Then uma query de domínio executada com o tenant A não retorna linhas do tenant B — provado por um teste de integração que tenta o cenário IDOR e recebe vazio.~~ → **Opção B**, não entregue nesta story. As policies já foram escritas para `current_setting('app.current_tenant', true)`, prontas para quando a Opção B for ativada.

6. **❌ OUT-OF-SCOPE (condicional a D1 = opção B; ver follow-up).** ~~Given as queries/actions existentes que hoje filtram por `clienteId` no `where` do Prisma, Then elas continuam funcionando após o Prisma passar a operar sob RLS... Conexões de migração/seed/admin continuam usando um role que bypassa RLS (`DIRECT_URL`).~~ → **Opção B**. Nesta story, o Prisma segue como role `postgres` (BYPASSRLS); nenhuma regressão possível porque a RLS não toca o caminho atual.

## Tasks / Subtasks

- [x] **Task 1 — INVESTIGAÇÃO (pré-requisito bloqueante; produz a Decisão D1)** (AC: 1, 2, 5, 6)
  - [x] Confirmado: **todo** acesso a dados de domínio é via **Prisma** (`src/lib/prisma.ts`), connection string (`DATABASE_URL`/`DIRECT_URL`). `supabase-js` (`src/lib/supabase.ts`) é só Auth. → RLS "ligada e nada mais" **não** protege as queries do Prisma.
  - [x] Confirmado: `DATABASE_URL`/`DIRECT_URL` apontam para o usuário `postgres` (superuser Supabase) → **BYPASSRLS**. Documentado no SQL e em `docs/architecture.md §7.1`.
  - [x] Tabelas e origem do `clienteId` enumeradas (ver Dev Notes / mapa). 6 com `clienteId` direto (incl. `Cliente` raiz via `id`); 6 filhas via FK (1–3 saltos).
  - [x] **Decisão D1 = Opção C** (fechada na reconciliação de arquitetura, ver banner no topo + `architecture-epic6-seguranca.md` §D4). Registrada no Completion Notes.
  - [x] Confirmado: `prisma/migrations/` **não existe** — projeto usa `db:push`. D2 resolvida adotando `prisma/sql/` (ver Completion Notes).

- [x] **Task 2 — Migração base: habilitar RLS + policies (escopo garantido)** (AC: 1, 2, 3, 4)
  - [x] Criado `prisma/sql/rls_tenant_isolation.sql` (D2 = arquivo SQL versionado, pois o projeto usa `db:push` e não tem `prisma/migrations/` baselined — ver `prisma/sql/README.md`).
  - [x] `ALTER TABLE "<Tabela>" ENABLE ROW LEVEL SECURITY;` em todas as 12 tabelas de domínio + `Cliente`. `FORCE ROW LEVEL SECURITY` **deliberadamente NÃO aplicado** (só necessário sob Opção B, quando o Prisma rodar como owner sujeito a RLS — nota explicativa no fim do SQL).
  - [x] Policies por tabela: `clienteId` direto → `USING/WITH CHECK ("clienteId" = app_current_tenant())`; filhas → `EXISTS` subindo a cadeia de FK até `Plano.clienteId` (1, 2 ou 3 saltos).
  - [x] `<tenant_corrente>` = `current_setting('app.current_tenant', true)` (via helper `app_current_tenant()`, retorna NULL quando não setado → nega por padrão). Fonte comentada no SQL (AC-2).
  - [x] Negação para `anon` (AC-3): `REVOKE ALL ... FROM anon` (condicional à existência do role) + RLS nega quando nenhuma policy casa.
  - [x] Idempotente: `CREATE OR REPLACE FUNCTION`, `DROP POLICY IF EXISTS … ; CREATE POLICY …`, `ENABLE …` idempotente nativo, tudo em `BEGIN/COMMIT`.

- [~] **Task 3 — ❌ OUT-OF-SCOPE (Opção B; follow-up)** (AC: 5, 6)
  - Não implementada. As policies já estão escritas para `current_setting('app.current_tenant', true)`, prontas para a Opção B. Ver "Follow-up: Opção B" no Completion Notes.

- [~] **Task 4 — ❌ OUT-OF-SCOPE (Opção B; follow-up)** (AC: 5, 6)
  - Não implementada (exige Postgres real, fora do gate de 90% / Prisma mockado). Ver "Limitação de teste" no Completion Notes.

- [x] **Task 5 — Documentação e operação** (AC: 1, 2, 4)
  - [x] Documentado em `docs/architecture.md §7.1 "Isolamento multi-tenant: aplicação (primária) + RLS (secundária)"` + linha da tabela de decisões corrigida. Cobre (a) guard primário, (b) RLS secundária, (c) Opção C e porquê, (d) como aplicar + quem bypassa (`prisma/sql/README.md`).
  - [x] `project-context.md` ajustado cirurgicamente (a frase "RLS reforça" virou "defesa primária é o código; RLS é rede secundária").
  - [x] `pnpm typecheck` e `pnpm lint` rodados (sem impacto em TS — nenhum arquivo `src/**` tocado). `pnpm build` **não** rodado a pedido (outra frente usa o `.next`).

## Dev Notes

### Por que esta story existe
Fecha o **CB-6 do PRD** ("Isolamento multi-tenant em profundidade: RLS no Postgres por `clienteId`, redundante aos guards de aplicação"). O motivador concreto é o **IDOR cross-tenant** já corrigido: `getPlanoWithObjetivos` passou a filtrar por `clienteId` no `where` (ver `src/features/plano/queries.ts:40-42`), mas isso prova que **esquecer um único filtro vaza dados de outro tenant**. RLS no banco é a rede de segurança para quando a aplicação esquecer. [Source: `_bmad-output/planning-artifacts/prds/prd-okr-2026-06-18/prd.md#13-CB-6`; `_bmad-output/planning-artifacts/epics.md#Epic-6-Story-6.6`]

### ⭐ Análise crítica: Prisma vs. RLS (LEIA ANTES DE TUDO)

**O fato que muda tudo:** este app lê e grava dados de domínio **via Prisma** (`src/lib/prisma.ts`), que conecta direto ao Postgres por connection string (`DATABASE_URL`). **Não** usa `supabase-js` para dados — o `supabase-js` (`src/lib/supabase.ts`) é usado **apenas para Auth** (`auth.getUser()` em `src/features/auth/guards.ts`).

RLS no Postgres é avaliada com base no **role da conexão** e no contexto (`auth.uid()`, `auth.jwt()`, `current_setting(...)`). O Supabase popula `auth.uid()`/`auth.jwt()` automaticamente **apenas** para conexões via PostgREST/supabase-js com o JWT do usuário (roles `authenticated`/`anon`). 

A connection string deste projeto (`DATABASE_URL`/`DIRECT_URL` em `.env.local.example`) aponta para o usuário **`postgres`** — o **superuser** do Supabase, que tem o atributo **`BYPASSRLS`**. Conexões superuser/owner **ignoram RLS por completo**. 

**Conclusão honesta:** ligar RLS sem mais nada **NÃO protegeria nenhuma query do Prisma** — todas passam pelo role `postgres` que bypassa RLS. RLS sozinha aqui é **teatro de segurança** se o Prisma continuar como está.

#### As três opções (honestas)

| Opção | O que é | Protege o Prisma? | Custo/invasividade | Risco |
|---|---|---|---|---|
| **(A) RLS pura** | Habilitar RLS + policies baseadas em `auth.uid()`/`auth.jwt()`, sem mexer no Prisma | **Não** — só cobriria acessos via supabase-js, que hoje são ~zero (só Auth). Valor real ≈ nulo para o caminho de dados atual | Baixíssimo | Falsa sensação de segurança. Defesa real continua sendo só o filtro de aplicação. |
| **(B) Prisma sob RLS** | RLS habilitada **+** o Prisma passa a conectar com um role **sem `BYPASSRLS`** **+** cada request injeta o tenant (`SET LOCAL app.current_tenant = '<clienteId>'` em transação) e as policies usam `current_setting('app.current_tenant', true)` | **Sim** — defesa em profundidade real | Alto: novo role, 2 connection strings (runtime sob RLS vs. `DIRECT_URL` superuser p/ DDL/seed), helper `withTenant`, transações em todas as queries, atenção a pgbouncer (`SET LOCAL` em transação) | Maior superfície de regressão; precisa de teste de integração com Postgres real (não exercível com Prisma mockado). |
| **(C) RLS como rede secundária + escopo de app primário (RECOMENDADO)** | Entregar a migração RLS (Task 2) habilitando RLS + policies (escrita para `current_setting('app.current_tenant', …)` já pensando em B), documentar claramente que **o guard de aplicação (`assertMesmoTenant` + filtro `clienteId` no `where`) é a defesa primária**, e deixar a ativação do Prisma-sob-RLS (B) como follow-up explícito e decidido | Parcialmente: entrega a infra e o caminho, ativa o enforcement real quando D1 aprovar B | Médio: faz o trabalho de banco agora, sem reescrever toda a camada de dados de uma vez | Honesto sobre o estado: não finge que RLS resolve sozinha. |

**Recomendação:** **opção C** como entrega desta story (migração RLS pronta, policies escritas para `current_setting`, documentação dizendo a verdade), com a **opção B** como evolução imediatamente subsequente (Tasks 3–4), sujeita à **Decisão D1** do usuário/arquiteto. **Não** entregar (A) sozinha disfarçada de proteção — seria enganoso.

> O `epics.md` já recomendava **solution-design** (`bmad-create-architecture`) para 6.6 antes da story. [Source: `_bmad-output/planning-artifacts/epics.md:529`] Se essa arquitetura ainda não foi feita, a Decisão D1 abaixo **é** essa decisão — registre-a.

### Mapa de tabelas e origem do `clienteId` (para as policies)

| Tabela | `clienteId`? | Predicado da policy |
|---|---|---|
| `Cliente` | é o próprio (`id`) | `"id" = <tenant>` |
| `User` | direto | `"clienteId" = <tenant>` |
| `Departamento` | direto | `"clienteId" = <tenant>` |
| `PlanoEstrategico` | direto | `"clienteId" = <tenant>` |
| `Plano` | direto | `"clienteId" = <tenant>` |
| `Dominio` | direto | `"clienteId" = <tenant>` |
| `PlanoUsuario` | via `Plano` | `EXISTS (SELECT 1 FROM "Plano" p WHERE p.id = "planoId" AND p."clienteId" = <tenant>)` |
| `Objetivo` | via `Plano` | join `Plano` por `planoId` |
| `ObjetivoResponsavel` | via `Objetivo`→`Plano` | subquery em 2 saltos |
| `ResultadoChave` | via `Objetivo`→`Plano` | subquery em 2 saltos |
| `HistoricoValores` | via `ResultadoChave`→`Objetivo`→`Plano` | subquery em 3 saltos |
| `LinhaTendencia` | via `ResultadoChave`→`Objetivo`→`Plano` | subquery em 3 saltos |

[Source: `prisma/schema.prisma` — modelos e FKs]

> Nota de performance: as policies com subquery rodam em **toda** linha. Os índices `@@index([clienteId])` e `@@index([planoId])`/`@@index([objetivoId])`/`@@index([resultadoChaveId])` já existentes no schema cobrem os joins das policies — bom. Validar `EXPLAIN` em consultas quentes se a opção B for adotada.

### Como aplicar/versionar a SQL (Decisão D2)
- **Hoje não existe** `prisma/migrations/` — o projeto opera com `db:push` (`package.json`: `db:push: prisma db push`, `db:migrate: prisma migrate dev`). `db:push` **não** versiona SQL; RLS/policies são DDL que **precisam** ser versionadas e reproduzíveis em todos os ambientes. [Source: `package.json` scripts; ausência de `prisma/migrations/`]
- **Recomendação (D2):** adotar **migração SQL versionada** para esta mudança — ou migrando o projeto para `prisma migrate` (cria `prisma/migrations/`), ou versionando um arquivo SQL dedicado (`prisma/sql/rls_tenant_isolation.sql`) aplicado no deploy/Supabase e referenciado na doc. RLS não pode viver só no painel do Supabase sem estar no repo (perde-se em recriação de ambiente). Fechar D2 na Task 1.
- Roles de DDL/seed (`DIRECT_URL`, superuser) **devem** continuar bypassando RLS para não travar `migrate`/`db:seed`.

### Padrões do projeto a respeitar (project-context.md)
- **Multi-tenant por `clienteId`** — "RLS no Supabase reforça, mas o código também filtra". **Atenção:** essa frase é otimista para o estado atual (RLS não reforça o caminho Prisma hoje). Esta story existe justamente para tornar a primeira metade verdadeira. [Source: `_bmad-output/project-context.md#Modelo de Domínio`]
- Acesso a dados só via `features/<nome>/queries.ts` / `actions.ts`; **sem Prisma em componentes**. O helper `withTenant` (se B) vive em `src/lib/`. [Source: `_bmad-output/project-context.md#Framework`]
- Guards de aplicação atuais a respeitar e citar como defesa primária: `assertMesmoTenant`/`requireUser`/`requireAdmin` em `src/features/auth/guards.ts`; filtro `clienteId` no `where` (ex.: IDOR corrigido em `src/features/plano/queries.ts:40-42`). [Source: `src/features/auth/guards.ts`; `src/features/plano/queries.ts`]
- Testes mockam `@/lib/prisma` (`vi.mock`) — RLS **não é exercível** com mock; o teste de isolamento (Task 4) precisa de Postgres real e deve ser classificado como integração/CI-gated, fora do gate de 90% de `features/**`. [Source: `_bmad-output/project-context.md#Testes`]

### Arquivos a tocar
| Arquivo | Ação | Observação |
|---|---|---|
| `prisma/migrations/<ts>_rls_tenant_isolation/migration.sql` **ou** `prisma/sql/rls_tenant_isolation.sql` | NEW | DDL: `ENABLE ROW LEVEL SECURITY` + policies idempotentes (depende de D2) |
| `.env.local.example` | UPDATE | (se D1=B) documentar 2 connection strings: runtime sob RLS vs. `DIRECT_URL` superuser p/ DDL/seed |
| `src/lib/prisma-tenant.ts` (ou `src/lib/prisma.ts`) | NEW/UPDATE | (se D1=B) helper `withTenant(clienteId, fn)` que faz `SET LOCAL app.current_tenant` em transação — *especificar aqui, implementar na dev-story* |
| `docs/architecture.md` (ou `docs/database.md`) | UPDATE | seção "Isolamento multi-tenant: aplicação + RLS" — verdade sobre Prisma/RLS, opção adotada, roles que bypassam |
| `src/tests/integration/rls-isolation.test.ts` (ou e2e) | NEW | (se D1=B) teste de isolamento com Postgres real |

### Project Structure Notes
- A SQL de RLS é a primeira DDL versionada do projeto — formaliza a adoção de migrations (D2) ou de um diretório `prisma/sql/`. Variância proposital vs. o `db:push` atual; documentar o porquê.
- O helper `withTenant` (opção B) é um novo padrão transversal (`src/lib/`), análogo em espírito ao `assertMesmoTenant`, mas no nível de conexão. Documentar para que futuras queries o usem por padrão.

### References
- [Source: `_bmad-output/planning-artifacts/prds/prd-okr-2026-06-18/prd.md#13-CB-6`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Epic-6-Story-6.6`] (e linha 529 — recomendação de solution-design antes da story)
- [Source: `_bmad-output/project-context.md#Modelo-de-Domínio` — "RLS no Supabase reforça, mas o código também filtra"; `#Framework`; `#Testes`]
- [Source: `src/lib/prisma.ts` — Prisma conecta por connection string, não supabase-js]
- [Source: `src/lib/supabase.ts` — supabase-js só para Auth]
- [Source: `src/features/auth/guards.ts` — `assertMesmoTenant`, defesa primária de tenant]
- [Source: `src/features/plano/queries.ts:40-42` — IDOR corrigido (filtro `clienteId` no `where`)]
- [Source: `prisma/schema.prisma` — modelos com `clienteId` e cadeia de FKs]
- [Source: `.env.local.example` — `DATABASE_URL`/`DIRECT_URL` no role `postgres` (BYPASSRLS); `?pgbouncer=true`]
- [Source: `package.json` — `db:push` vs `db:migrate` vs `db:seed`; sem `prisma/migrations/`]

## Decisões em Aberto

> **Estas decisões devem ser fechadas na Task 1 (investigação), antes de codar as Tasks 3+.** Marque-as como bloqueantes.

- **D1 — Profundidade do enforcement (a decisão central).** Escolher entre:
  - **(A)** RLS pura sobre `auth.*` — **não recomendado isolada** (não protege o Prisma; valor ≈ nulo hoje).
  - **(B)** Prisma sob RLS com `current_setting('app.current_tenant')` — defesa em profundidade real, alto custo/risco (novo role, 2 connection strings, transações, pgbouncer, teste de integração).
  - **(C — recomendado)** Migração RLS + policies escritas para `current_setting` + documentação honesta, com a defesa primária explícita no código; ativar (B) como follow-up decidido.
  - → **Sem D1, a story entrega só as ACs 1–4 (escopo C base).** As ACs 5–6 dependem de D1=B.
- **D2 — Mecanismo de versionamento da SQL.** Adotar `prisma migrate` (cria `prisma/migrations/`, abandona `db:push` para mudanças versionadas) **ou** versionar `prisma/sql/*.sql` aplicado no Supabase/deploy? RLS **não** pode viver só no painel do Supabase. (Recomendação: migrar para `prisma migrate` ao menos para DDL de segurança.)
- **D3 — Role de aplicação (se D1=B).** Reusar o role `authenticated` do Supabase ou criar `app_user` dedicado sem `BYPASSRLS`? E como o tenant chega à policy: claim no JWT (`auth.jwt() ->> 'clienteId'`) vs. `SET LOCAL app.current_tenant` injetado pelo Prisma? (Recomendação: `SET LOCAL` injetado pelo Prisma, pois o JWT do Supabase não carrega `clienteId` por padrão e o app não usa supabase-js para dados.)
- **D4 — `FORCE ROW LEVEL SECURITY`?** Necessário se o Prisma rodar como **owner** das tabelas (owner ignora RLS sem `FORCE`). Decidir junto com D1/D3.
- **D5 — Estratégia de teste do isolamento.** RLS não é exercível com Prisma mockado (Vitest). O teste de isolamento real precisa de Postgres (integração/Playwright-DB/CI). Confirmar onde roda e se entra no gate ou fica CI-gated.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code)

### Debug Log References

### Completion Notes List

### File List
