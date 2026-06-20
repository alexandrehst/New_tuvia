---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 2.4: Criar e editar Objetivo (com responsáveis)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a gestor,
I want criar e editar objetivos (incluindo atribuir responsáveis) num painel sobre o acompanhamento,
so that eu monte e ajuste o plano sem sair da tela.

> **Escopo (correct course):** a 2.4 original cobria objetivo+KR+plano, mas as actions de update e a query de usuários não existiam. Foi dividida por entidade — **esta story é só Objetivo**. KR-edit = Story 2.7; Plano-edit = Story 2.8.

## Acceptance Criteria

1. **`updateObjetivo` (nova Server Action)** em `features/objetivo/actions.ts`: recebe `id` + dados (`updateObjetivoSchema`), atualiza `titulo`/`descricao`/`numero` e **reconcilia responsáveis** (`ObjetivoResponsavel`: remove os atuais e recria a partir de `responsaveisIds`). Testada (gate 90%). (FR-25)
2. **`getClienteUsuarios(clienteId)` (nova query)** em `features/usuarios/queries.ts`: lista os usuários do cliente (`id`, `nome`, `email`) para o seletor de responsáveis. Testada (gate 90%). (FR-24)
3. **Painel de Objetivo em `Sheet`** (criar e editar): campos título, descrição, número e **seletor de responsáveis** (multi-seleção entre os usuários do cliente). Usa `createObjetivo`/`updateObjetivo`. Forms com `Input`/`Label`/`Button` shadcn + validação dos schemas Zod. (FR-22, FR-24, FR-25, UX-DR9/13)
3. **Triggers ligados**: "Novo objetivo" (cabeçalho da seção em `planos/[id]/page.tsx`) abre o painel em modo criar (número pré-preenchido = próximo); "Editar objetivo" (cabeçalho da coluna no `ObjetivosBoard`) abre em modo editar com os dados atuais (incl. responsáveis). (FR-22/25)
4. **Reflexo**: após salvar, a tela reflete a mudança (revalidação via `router.refresh()`); o painel fecha. (UX-DR13)
5. **Sem regressão / escopo**: NÃO editar KR (2.7) nem plano (2.8) nem excluir (2.5); preservar a função de atualizar valor (2.3). `pnpm typecheck/lint/test/build` passam.
6. **Transversais**: paridade dark; pt-BR; a11y (labels, foco no Sheet, Esc); Base UI (sem asChild).

## Tasks / Subtasks

- [x] **Task 1 — `updateObjetivo` + teste** (AC: 1) — `features/objetivo/actions.ts`, `features/objetivo/__tests__/actions.test.ts`
  - [x] `export async function updateObjetivo(id: string, data: UpdateObjetivoInput)`: `updateObjetivoSchema.parse(data)`; `prisma.objetivo.update` (titulo/descricao/numero); reconciliar responsáveis: `prisma.objetivoResponsavel.deleteMany({ where: { objetivoId: id } })` + `createMany` dos `responsaveisIds`. Retornar o objetivo.
  - [x] Teste: mockar Prisma; verificar update dos campos + deleteMany/createMany de responsáveis (incl. caso sem responsáveis).
- [x] **Task 2 — `getClienteUsuarios` + teste** (AC: 2) — `features/usuarios/queries.ts`, `features/usuarios/__tests__/queries.test.ts`
  - [x] `export async function getClienteUsuarios(clienteId: string)`: `prisma.user.findMany({ where: { clienteId }, select: { id, nome, email }, orderBy: { nome: 'asc' } })`.
  - [x] Teste: mockar Prisma; verificar where `clienteId` e select.
- [x] **Task 3 — `ObjetivoSheet`** (AC: 3, 4, 6) — novo `features/objetivo/components/ObjetivoSheet.tsx` (`'use client'`)
  - [x] Props: `mode` ('criar'|'editar'), `planoId`, `usuarios` (lista p/ responsáveis), valores iniciais (no editar: id, titulo, descricao, numero, responsaveisIds), `open`/`onOpenChange`. Form em `Sheet` com `Input`/`Label`/`Button`. Multi-seleção de responsáveis (checkboxes ou lista togglável — sem dependência nova). `useTransition` para o submit; erro inline; ao sucesso `router.refresh()` + fechar.
- [x] **Task 4 — Ligar triggers** (AC: 3, 4) — `src/app/(app)/planos/[id]/page.tsx` + `src/features/plano/components/ObjetivosBoard.tsx`
  - [x] A página busca `getClienteUsuarios(plano.clienteId)` (Server Component) e passa `usuarios` + `planoId` ao `ObjetivosBoard`. "Novo objetivo" abre `ObjetivoSheet` modo criar (numero = maior numero + 1). "Editar objetivo" (coluna) abre modo editar com os dados do objetivo (mapear `responsaveis` → `responsaveisIds`).
- [x] **Task 5 — Validação** (AC: 5) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Dev Notes

### Estado atual (LER)
- **`features/objetivo/actions.ts`**: tem `createObjetivo(data)` (cria objetivo + `objetivoResponsavel.createMany` dos `responsaveisIds`) e `deleteObjetivo(id)`. **Falta `updateObjetivo`** — criar espelhando o create + reconciliação de responsáveis. `'use server'` no topo do arquivo.
- **`features/objetivo/schemas.ts`**: `createObjetivoSchema` = { planoId(cuid), titulo(min3), descricao?, numero(int+), responsaveisIds?: cuid[], objetivoVinculadoId? }. `updateObjetivoSchema = createObjetivoSchema` (mesmos campos; o `id` vem como argumento separado, não no schema).
- **`features/usuarios/`**: só tem `__tests__/` e `components/` — **sem `queries.ts`/`actions.ts`**. Criar `queries.ts` com `getClienteUsuarios`.
- **`prisma` ObjetivoResponsavel**: `@@unique([objetivoId, userId])`, cascade. Reconciliar = deleteMany + createMany.
- **`ObjetivosBoard`** (Story 2.2/2.3): cliente; tem o botão "Editar objetivo" (hoje sem ação) no cabeçalho da coluna; KRCard já existe; Sheet já é usado para o KRPanel (mesmo padrão para o ObjetivoSheet). Objetivo tem `responsaveis?: {user:{nome}}[]` — para editar, precisa também dos ids; o painel recebe `responsaveisIds`.
- **`planos/[id]/page.tsx`**: Server Component; tem `objetivos` e o `plano` (com `clienteId`). Cabeçalho "Objetivos (N)" + botão "Novo objetivo" (hoje sem ação). Pode buscar `getClienteUsuarios(plano.clienteId)`.

### Revalidação
- Após create/update, usar `router.refresh()` (next/navigation) no client após o sucesso para o Server Component refazer o fetch. (Alternativa: `revalidatePath` na action — mas a action não tem o path; `router.refresh()` é mais simples aqui.) `next/navigation` já é mockado globalmente nos testes.

### Guardrails / escopo
- **NÃO** implementar updateKeyResult (2.7) nem updatePlano (2.8) nem excluir (2.5). Só Objetivo.
- Reutilizar `Sheet`/`Input`/`Label`/`Button` (Base UI/shadcn). Sem dependência nova (multi-seleção via lista togglável simples).
- Lógica/validação em `features/**` (actions/query testadas); componente em `features/objetivo/components` (fora do gate).
- Action: `redirect` não se aplica; retorna o objetivo. Não engolir erros de validação do `parse` (lança — o client trata com try/catch e mostra erro inline).

### Testes / verificação
- `updateObjetivo` e `getClienteUsuarios` → `features/**` → testes obrigatórios (gate 90%). Mockar Prisma (`vi.mock('@/lib/prisma')`), padrão dos testes existentes (`objetivo/__tests__/actions.test.ts` já existe com createObjetivo/deleteObjetivo).
- ObjetivoSheet/page/board → fora do gate; build/typecheck/visual.

### Project Structure Notes
- NEW: `src/features/usuarios/queries.ts` (+ `__tests__/queries.test.ts`), `src/features/objetivo/components/ObjetivoSheet.tsx`.
- UPDATE: `src/features/objetivo/actions.ts` (+ `__tests__/actions.test.ts`), `src/app/(app)/planos/[id]/page.tsx`, `src/features/plano/components/ObjetivosBoard.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2 / Story 2.4 (FR-22/24/25, UX-DR9/13) + nota de correção de curso]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/EXPERIENCE.md#Component Patterns (criar/editar em Sheet), DESIGN.md#Components]
- [Source: src/features/objetivo/actions.ts, src/features/objetivo/schemas.ts (createObjetivo, updateObjetivoSchema)]
- [Source: prisma/schema.prisma — Objetivo, ObjetivoResponsavel, User.clienteId]
- [Source: src/features/plano/components/ObjetivosBoard.tsx, src/features/key-result/components/KRPanel.tsx (padrão de Sheet/form — Story 2.3)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-18):**
- **`updateObjetivo(id, data)`** (nova action): `updateObjetivoSchema` (descobri que é `.omit({planoId}).partial()` — não inclui planoId) → `objetivo.update` (titulo/descricao/numero) + reconcilia responsáveis (`objetivoResponsavel.deleteMany` + `createMany`). 3 testes (com/sem responsáveis, validação).
- **`getClienteUsuarios(clienteId)`** (nova query em `features/usuarios/queries.ts`): `user.findMany` select id/nome/email, orderBy nome. 2 testes. **167 testes verdes** (+5).
- **`ObjetivoSheet`** (`features/objetivo/components`): Sheet criar/editar com `Input`/`Label`/`Button`, multi-seleção de responsáveis (checkboxes dos usuários do cliente), `useTransition`, erro inline, `router.refresh()` no sucesso. Payload de update sem planoId; create com planoId.
- **`ObjetivosBoard`**: passou a receber `planoId`+`usuarios`; renderiza top bar "Objetivos (N)" + "Novo objetivo", estado vazio, e liga "Editar objetivo" (mapeia `responsaveis[].user.id` → `responsaveisIds`). `ObjetivoSheet` remonta por `key` para resetar o form.
- **Página**: busca `getClienteUsuarios(plano.clienteId)` e delega a seção de objetivos ao `ObjetivosBoard` (removidos botão/estado-vazio inertes da página).
- **Escopo:** só Objetivo. KR-edit (2.7), Plano-edit (2.8), excluir (2.5) seguem como triggers/inertes.
- **Verificação:** `pnpm typecheck` ✓ · `pnpm test` 167/167 ✓ · `pnpm lint` exit 0 · `pnpm build` ✓.

### Change Log
- 2026-06-18 — Story 2.4: updateObjetivo + getClienteUsuarios (+5 testes); ObjetivoSheet (criar/editar + responsáveis); ObjetivosBoard com Novo/Editar objetivo + estado vazio. typecheck/test/lint/build verdes.

### File List
- `src/features/objetivo/actions.ts` (MODIFIED) — nova action `updateObjetivo`.
- `src/features/objetivo/__tests__/actions.test.ts` (MODIFIED) — 3 testes de updateObjetivo.
- `src/features/usuarios/queries.ts` (NEW) — `getClienteUsuarios`.
- `src/features/usuarios/__tests__/queries.test.ts` (NEW) — testes de getClienteUsuarios.
- `src/features/objetivo/components/ObjetivoSheet.tsx` (NEW) — painel criar/editar objetivo.
- `src/features/plano/components/ObjetivosBoard.tsx` (MODIFIED) — top bar, estado vazio, Novo/Editar objetivo.
- `src/app/(app)/planos/[id]/page.tsx` (MODIFIED) — busca usuários + delega ao board.
