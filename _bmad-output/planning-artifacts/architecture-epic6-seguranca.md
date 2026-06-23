---
title: Solution Design — Epic 6 (Segurança & Ciclo de Vida)
status: decided
created: 2026-06-22
scope: reconciliação focada (não arquitetura geral) das Stories 6.4/6.5/6.6
related:
  - implementation-artifacts/6-4-ciclo-de-vida-do-plano.md
  - implementation-artifacts/6-5-enforcement-de-papel-por-plano.md
  - implementation-artifacts/6-6-rls-no-postgres.md
  - prds/prd-okr-2026-06-18/prd.md (§13 CB-1..CB-7)
---

# Solution Design — Epic 6: Segurança & Ciclo de Vida

Reconciliação das decisões deixadas em aberto pelas Stories 6.4/6.5/6.6, para que sejam implementadas como **um contrato coerente**, não três guards soltos. Decisões tomadas com o usuário em 2026-06-22.

## D1 — Contrato de autorização unificado

Um único ponto de entrada em `src/features/auth/guards.ts`, componível, que **resolve na ordem `tenant → papel → estado`**:

```
assertPodeMutarPlano(planoId, user, operacao)
```

- Resolve o `Plano` (e seu `clienteId` + `status`) e o papel do `user` naquele plano.
- Aplica `assertMesmoTenant` (já existente) primeiro.
- Depois checa **papel** (D-papel) e **estado** (D-estado) conforme a operação.
- `requireUser`/`requireAdmin`/`assertMesmoTenant` permanecem; este helper os compõe.

### Hierarquia de papel
`viewer < editor < owner`. **`tipoUser === 'admin'` (global) = `owner` implícito** em todos os planos do próprio tenant (curto-circuita sem exigir linha `PlanoUsuario`). **Sem linha `PlanoUsuario` e não-admin ⇒ default-deny** (não concede viewer grátis).

### Matriz operação → (papel mínimo × estado permitido)

| Operação | Papel mínimo | Estados permitidos |
|---|---|---|
| Ler (queries) | viewer | qualquer |
| **Atualizar valor de KR** (`updateKeyResultValor`) | editor | `edicao` ou `publicado` (não `arquivado`) |
| **Editar estrutura** (create/update/delete Objetivo; create/update/delete KR; `updatePlano` metadados/datas) | editor | **somente `edicao`** |
| **Transições de estado** (ativar/arquivar/reabrir) | owner | conforme máquina de estado (D3) |
| **Criar plano de apoio** / excluir plano | owner | `edicao` |
| **Gerir membros** (`updatePapel`, `removerMembroDoPlano`) | owner (ou admin) | qualquer |

> A regra "estrutura só em `edicao`" é o que materializa o item 3b ("Atualizar vs Editar"). `updateKeyResultValor` é a única mutação permitida em `publicado`.

## D2 — Vínculo de dono na criação do plano  ✅ DECIDIDO: SIM

`createPlanoCorporativo` e `createPlanoDepartamento` (`features/plano/actions.ts`) passam a criar, na mesma transação, uma linha `PlanoUsuario { planoId, userId: criador, papel: 'owner' }`. **Pré-requisito** para o enforcement de papel (6.5) fazer sentido — sem isso, ninguém além de admin teria papel em plano algum. Interage com o onboarding (6.3): o primeiro plano do tenant já nasce com seu dono.

## D3 — Máquina de estado do Plano (Ciclo de vida)  ✅ DECIDIDO

Rótulos pt-BR (sem renomear o enum `StatusPlano`):

| Enum | Rótulo pt-BR | Regra de edição |
|---|---|---|
| `edicao` | **Em planejamento** | edição estrutural livre |
| `publicado` | **Ativo** | só **atualização de valores** de KR |
| `arquivado` | **Arquivado** | somente leitura |

### Transições (todas exigem papel `owner`/admin)

```
        Ativar                 Arquivar
edicao ──────────► publicado ──────────► arquivado
  ▲                    │
  └────────────────────┘
     "Editar" (reabre)
```

- `edicao → publicado` — ação **"Ativar"**.
- `publicado → edicao` — ação **"Editar"**: editar um plano **Ativo** o **reabre para "Em planejamento"** (decisão do usuário — substitui um "Despublicar" explícito; resolve a confusão Atualizar-vs-Editar: em **Ativo** a ação primária é "Atualizar valor"; "Editar" é deliberado e reabre).
- `publicado → arquivado` — ação **"Arquivar"**.
- `edicao → arquivado` — ação **"Arquivar"** (descartar rascunho). *(incluída por simetria; confirmar se indesejada)*
- `arquivado → *` — **terminal** por ora (reabrir de arquivado fica fora de escopo).

UI: em **Ativo**, "Editar" deve sinalizar que reabrirá o plano (ex.: confirmação "Editar reabre o plano para planejamento").

## D4 — RLS (defesa em profundidade)  ✅ DECIDIDO: Opção C

**Contexto:** o acesso a dados é 100% via **Prisma** conectando como role `postgres` (que tem `BYPASSRLS`); `supabase-js` só faz Auth. Logo, RLS sozinho **não** cobre as queries do Prisma hoje.

**Decisão (Opção C — baseline documentado):**
- Escrever as policies RLS por `clienteId` (incluindo tabelas-filhas via FK) como **migração versionada** — introduzir `prisma/migrations/` (ou `prisma/sql/`) para a DDL, já que o projeto usa `db:push` e RLS não pode ficar fora de versionamento.
- O **guard de aplicação permanece a defesa PRIMÁRIA** (`assertMesmoTenant` + filtro `clienteId` no `where`, ex.: o fix do IDOR em `features/plano/queries.ts`). A RLS é **rede secundária** que só atua se algo passar a acessar via supabase-js.
- A frase otimista do `project-context.md` ("RLS reforça") é ajustada: hoje RLS não cobre o caminho Prisma; isso é documentado.
- **Opção B** (Prisma sob role não-privilegiado + `SET LOCAL app.current_tenant` por request) fica registrada como **endurecimento futuro** (story dedicada), não neste epic.

## Impacto nas stories

- **6.4:** rótulos = Em planejamento/Ativo/Arquivado; transição `publicado→edicao` via "Editar" **incluída**; guard de estado via `assertPodeMutarPlano` (D1).
- **6.5:** criar vínculo owner na criação do plano (D2); admin = owner global; default-deny; enforcement via `assertPodeMutarPlano` (D1).
- **6.6:** Opção C; migração versionada; guard de app como defesa primária; Opção B como follow-up.
