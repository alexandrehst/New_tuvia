---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 2.8: Editar Plano (título, datas, frequência)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a gestor,
I want editar os dados do plano (título, intervalo de datas, frequência) num painel,
so that eu ajuste o plano sem sair do acompanhamento.

> Última story do Epic 2. Excluir plano fica para o Epic 3 (gestão/lista).

## Acceptance Criteria

1. **`updatePlano(id, data)` (Server Action)** em `features/plano/actions.ts`: `updatePlanoSchema` (parcial); atualiza `titulo`, `dataInicio`, `dataFim`, `frequenciaAtualizacao`. **Recálculo (decisão do usuário):** se `dataInicio`/`dataFim` mudarem, para **cada KR do plano** recalcula `status` (`calcularRisco`) e **regenera a `LinhaTendencia`** (deleteMany + `gerarLinhaTendencia`). `progresso` NÃO muda (independe de datas). Testada (gate 90%). (FR-23, FR-25)
2. **Painel de edição do plano em `Sheet`**: campos título, data início, data fim (inputs `date`), frequência (select semanal/quinzenal/mensal). Usa `updatePlano`. `router.refresh()` no sucesso. (FR-23, UX-DR13)
3. **Trigger ligado**: o botão "Editar plano" no cabeçalho de `planos/[id]/page.tsx` (hoje inerte) abre o painel com os dados atuais do plano. (FR-23)
4. **Sem regressão / escopo**: NÃO excluir plano; o CRUD de objetivo/KR (2.4/2.5/2.7) e atualizar valor (2.3) intactos. `pnpm typecheck/lint/test/build` passam.
5. **Transversais**: paridade dark; pt-BR; a11y (labels, foco no Sheet, Esc); Base UI.

## Tasks / Subtasks

- [x] **Task 1 — `updatePlano` + teste** (AC: 1) — `features/plano/actions.ts`, `__tests__/actions.test.ts`
  - [x] `export async function updatePlano(id, data: UpdatePlanoInput)`: `updatePlanoSchema.parse`; ler datas anteriores (`plano.findUniqueOrThrow select dataInicio/dataFim`); `plano.update` (titulo/dataInicio/dataFim/frequenciaAtualizacao). Se as datas mudaram E o plano tem datas: `resultadoChave.findMany({ where: { objetivo: { planoId: id } }, select: { id, tipoMetrica, valorInicial, valorAlvo, valorAtual } })`; para cada KR → `update status` (`calcularRisco`) + `linhaTendencia.deleteMany` + `createMany` (`gerarLinhaTendencia`).
  - [x] Teste: caso sem mudança de data (sem recompute), caso com mudança (recompute: update de status + regen tendência), validação de título curto.
- [x] **Task 2 — `PlanoEditButton` (trigger + Sheet)** (AC: 2, 3, 5) — novo `features/plano/components/PlanoEditButton.tsx` (`'use client'`)
  - [x] Renderiza o botão "Editar plano" (lucide `Settings2`, variant outline) + `Sheet` com o form. Props: dados atuais do plano (`id, titulo, dataInicio, dataFim, frequenciaAtualizacao`). Inputs `date` (converter `Date`↔`YYYY-MM-DD`), select de frequência. `useTransition`, erro inline, `router.refresh()` + fechar no sucesso.
- [x] **Task 3 — Ligar na página** (AC: 3) — `src/app/(app)/planos/[id]/page.tsx`
  - [x] Substituir o `<Button>` "Editar plano" inerte pelo `<PlanoEditButton plano={{...}} />` (Server Component passa os dados do plano).
- [x] **Task 4 — Validação** (AC: 4) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Dev Notes

### Fatos verificados
- **`features/plano/actions.ts`**: tem só `createPlanoCorporativo` (criador com IA); importa `gerarLinhaTendencia`. **Falta `updatePlano`** — criar. Adicionar import de `calcularRisco` (de `@/features/key-result/lib/calculos`).
- **`features/plano/schemas.ts`**: `createPlanoSchema` { titulo(min3), dataInicio(coerce.date), dataFim(coerce.date), frequenciaAtualizacao(enum semanal/quinzenal/mensal default mensal), … }. `updatePlanoSchema = createPlanoSchema.partial()`. Exportar/usar `UpdatePlanoInput`.
- **Model Plano**: campos editáveis `titulo`, `dataInicio? DateTime`, `dataFim? DateTime`, `frequenciaAtualizacao` (enum). `status` (StatusPlano) **não** é editado aqui.
- **`progresso` independe de datas** (calcularProgresso usa valorInicial/alvo/atual). Só `status` (risco) e `LinhaTendencia` precisam recomputar quando as datas mudam.
- **KRs do plano**: via relação `objetivo.planoId` → `resultadoChave.findMany({ where: { objetivo: { planoId: id } } })`. Reusar `calcularRisco`/`gerarLinhaTendencia` (mesmo padrão da Story 2.7 updateKeyResult).
- **`planos/[id]/page.tsx`**: cabeçalho tem `<Button variant="outline" size="sm"><Settings2/> Editar plano</Button>` inerte. O plano (de `getPlanoWithObjetivos`) tem `titulo/dataInicio/dataFim/frequenciaAtualizacao`. Passar ao `PlanoEditButton`.

### Decisão (usuário): recálculo ao mudar datas
- Mudar `dataInicio`/`dataFim` recomputa `status` + regenera `LinhaTendencia` de **todos os KRs do plano** (gate só na detecção: comparar datas anteriores vs novas; se iguais, não recomputa). Evita risco/tendência obsoletos. Não tocar `progresso` nem `valorAtual`.

### Guardrails / escopo
- **NÃO** excluir plano (Epic 3). Base UI (sem asChild); `router.refresh()` para refletir. Datas: `z.coerce.date()` aceita string `YYYY-MM-DD` enviada do input.
- Lógica em `features/**` (action testada); `PlanoEditButton` em `features/plano/components` (fora do gate).

### Testes / verificação
- `updatePlano` → teste obrigatório (gate 90%): mock `plano.findUniqueOrThrow/update`, `resultadoChave.findMany/update`, `linhaTendencia.deleteMany/createMany`. Cobrir sem-mudança-de-data, com-mudança (recompute), e validação.
- `PlanoEditButton`/página → fora do gate; build/typecheck/visual.

### Project Structure Notes
- NEW: `src/features/plano/components/PlanoEditButton.tsx`.
- UPDATE: `src/features/plano/actions.ts` (+ `__tests__/actions.test.ts`), `src/app/(app)/planos/[id]/page.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2 / Story 2.8 (FR-23/25) — split da 2.4]
- [Source: prisma/schema.prisma — Plano (titulo/dataInicio/dataFim/frequenciaAtualizacao), ResultadoChave via objetivo.planoId]
- [Source: src/features/plano/actions.ts, src/features/plano/schemas.ts (updatePlanoSchema), src/features/key-result/lib/calculos.ts (calcularRisco/gerarLinhaTendencia)]
- [Source: src/features/key-result/actions.ts — updateKeyResult (padrão de recompute+regen tendência)]
- [Source: src/app/(app)/planos/[id]/page.tsx (botão Editar plano)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-18):**
- **`updatePlano(id, data)`** (nova action): atualiza titulo/datas/frequência; **se as datas mudarem**, recomputa `status` (`calcularRisco`) + regenera `LinhaTendencia` de **todos os KRs do plano** (`resultadoChave.findMany` via `objetivo.planoId`). `progresso`/`valorAtual` intactos. +3 testes (sem-mudança, com-mudança, validação) → **176 verdes**.
- **`PlanoEditButton`** (`features/plano/components`): botão "Editar plano" + `Sheet` (título, datas `type=date`, select de frequência); `useTransition`, erro inline, `router.refresh()` no sucesso. Converte `Date`↔`YYYY-MM-DD`.
- **Página**: botão inerte do cabeçalho substituído pelo `PlanoEditButton` (imports `Settings2`/`Button` órfãos removidos).
- **Escopo:** sem excluir plano (Epic 3). Decisão do usuário (recálculo ao mudar datas) implementada.
- **Verificação:** `pnpm typecheck` ✓ · `pnpm test` 176/176 ✓ · `pnpm lint` exit 0 · `pnpm build` ✓.

### Change Log
- 2026-06-18 — Story 2.8: updatePlano (recálculo de risco+tendência de todos os KRs ao mudar datas, +3 testes); PlanoEditButton (Sheet); página liga o botão Editar plano. typecheck/test/lint/build verdes. **Fecha o Epic 2.**

### File List
- `src/features/plano/actions.ts` (MODIFIED) — nova action `updatePlano`.
- `src/features/plano/__tests__/actions.test.ts` (MODIFIED) — 3 testes de updatePlano + mocks.
- `src/features/plano/components/PlanoEditButton.tsx` (NEW) — botão + painel de edição do plano.
- `src/app/(app)/planos/[id]/page.tsx` (MODIFIED) — liga o PlanoEditButton; remove imports órfãos.
