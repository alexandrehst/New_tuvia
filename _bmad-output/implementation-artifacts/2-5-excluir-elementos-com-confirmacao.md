---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 2.5: Excluir elementos com confirmação

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a gestor,
I want excluir objetivos e resultados-chave com uma confirmação clara,
so that eu não remova dados por engano.

> Escopo: Objetivo e KR (no acompanhamento). Excluir **Plano** fica com a Story 2.8/Epic 3 (gestão de plano).

## Acceptance Criteria

1. **`deleteKeyResult` (nova Server Action)** em `features/key-result/actions.ts`: `prisma.resultadoChave.delete({ where: { id } })` (cascata do schema remove `HistoricoValores` e `LinhaTendencia`). Testada (gate 90%). (FR-27)
2. **`ConfirmDialog` reutilizável** (`src/components/confirm-dialog.tsx`, Base UI `@base-ui/react/alert-dialog`, sem dependência nova): props `open`/`onOpenChange`/`title`/`description`/`confirmLabel`/`onConfirm`/`destructive`. Foco preso, `Esc` fecha, botão de confirmar em estilo `destructive`. (UX-DR20, NFR-4)
3. **Excluir Objetivo**: ação de excluir no cabeçalho da coluna (ObjetivosBoard) abre o ConfirmDialog com consequência explícita ("Excluir o objetivo '{título}'? Os resultados-chave também serão removidos."). Ao confirmar → `deleteObjetivo(id)` + `router.refresh()`. (FR-27)
4. **Excluir KR**: ação "Excluir" no `KRCard` (novo `onExcluir`) abre o ConfirmDialog ("Excluir o resultado-chave '{descrição}'? O histórico de valores será removido."). Ao confirmar → `deleteKeyResult(id)` + `router.refresh()`. (FR-27)
5. **Cancelar não muda nada**; após excluir, a lista reflete a remoção. (FR-27)
6. **Sem regressão / escopo**: NÃO excluir plano (2.8); criar/editar/atualizar intactos. `pnpm typecheck/lint/test/build` passam.
7. **Transversais**: paridade dark; pt-BR; a11y (dialog com título/descrição, foco, Esc); Base UI (sem asChild).

## Tasks / Subtasks

- [x] **Task 1 — `deleteKeyResult` + teste** (AC: 1) — `features/key-result/actions.ts`, `__tests__/actions.test.ts`
  - [x] `export async function deleteKeyResult(id: string) { await prisma.resultadoChave.delete({ where: { id } }) }`.
  - [x] Teste: mockar `resultadoChave.delete`; verificar chamada com `{ where: { id } }`. (Cascata é do banco; não precisa mockar historico/tendencia.)
- [x] **Task 2 — `ConfirmDialog`** (AC: 2, 7) — novo `src/components/confirm-dialog.tsx` (`'use client'`)
  - [x] Base UI AlertDialog (`@base-ui/react/alert-dialog`): `AlertDialog.Root open onOpenChange` → `Portal` → `Backdrop` (overlay) → `Popup` centrado (tokens: `bg-popover`, `rounded-lg`, sombra) → `Title` + `Description` + ações (`Close` Cancelar + Button `destructive` Confirmar que chama `onConfirm`). Props conforme AC2. `useTransition` opcional para pending no confirmar.
- [x] **Task 3 — Excluir KR no `KRCard`** (AC: 4, 7) — `src/features/key-result/components/KRCard.tsx`
  - [x] Adicionar prop `onExcluir?` e um botão "Excluir" (lucide `Trash2`, `aria-label`) nas ações do hover (mesmo padrão de Editar/Histórico, `disabled` se sem handler).
- [x] **Task 4 — Ligar no `ObjetivosBoard`** (AC: 3, 4, 5) — `src/features/plano/components/ObjetivosBoard.tsx`
  - [x] Estado de confirmação: `confirm: { tipo: 'objetivo'|'kr'; id; label } | null`. Botão de excluir (Trash2) no cabeçalho da coluna do objetivo (ao lado do Editar). `KRCard onExcluir` → set confirm tipo 'kr'. Render `ConfirmDialog` com texto por tipo; `onConfirm` chama `deleteObjetivo`/`deleteKeyResult` + `router.refresh()` + fecha.
- [x] **Task 5 — Validação** (AC: 6) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Dev Notes

### Estado atual (LER) / fatos verificados
- **`features/objetivo/actions.ts`**: `deleteObjetivo(id)` JÁ existe (`prisma.objetivo.delete`). Reutilizar.
- **`features/key-result/actions.ts`**: tem create/update/updateKeyResultValor; **falta `deleteKeyResult`** — criar (1 linha).
- **Cascatas (schema, confirmadas):** `Objetivo → ResultadoChave` (onDelete Cascade) → excluir objetivo remove os KRs. `ResultadoChave → HistoricoValores` e `→ LinhaTendencia` (Cascade) → excluir KR remove histórico+tendência. Portanto os deletes são limpos no banco; os textos de confirmação são fiéis.
- **Base UI:** `@base-ui/react/alert-dialog` e `/dialog` disponíveis. Usar **AlertDialog** (semântica de confirmação). Espelhar o padrão do `sheet.tsx` (Portal/Backdrop/Popup + `render` prop em `Close`).
- **`KRCard`**: ações Atualizar/Editar/Histórico no hover (Editar/Histórico `disabled` sem handler — Histórico segue inerte, é a 2.6). Adicionar Excluir.
- **`ObjetivosBoard`**: já tem `Sheet` (valor), `ObjetivoSheet`, `KRSheet` e estado por tipo. Adicionar o estado de confirmação + `ConfirmDialog`. Cabeçalho da coluna tem o botão "Editar objetivo" (Pencil) — adicionar Trash2 ao lado.

### Guardrails / escopo
- **NÃO** excluir plano (2.8) nem implementar o histórico (2.6). Só objetivo + KR.
- `deleteObjetivo`/`deleteKeyResult` são Server Actions chamadas do cliente no `onConfirm`; após sucesso, `router.refresh()` (next/navigation) para o Server Component refazer o fetch.
- `ConfirmDialog` genérico em `src/components` (fora do gate). Action em `features/**` (gate — testar `deleteKeyResult`).
- Base UI (render prop, nunca asChild); tokens, sem hex. Botão de confirmar usa variant `destructive` do Button.

### Testes / verificação
- `deleteKeyResult` → `features/**` → teste obrigatório (gate 90%). `deleteObjetivo` já testado.
- `ConfirmDialog`/board/card → fora do gate; build/typecheck/visual.

### Project Structure Notes
- NEW: `src/components/confirm-dialog.tsx`.
- UPDATE: `src/features/key-result/actions.ts` (+ `__tests__/actions.test.ts`), `src/features/key-result/components/KRCard.tsx`, `src/features/plano/components/ObjetivosBoard.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2 / Story 2.5 (FR-27, UX-DR20)]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/EXPERIENCE.md#Component Patterns (Confirmar exclusão), State Patterns]
- [Source: prisma/schema.prisma — cascatas Objetivo→ResultadoChave, ResultadoChave→HistoricoValores/LinhaTendencia]
- [Source: src/features/objetivo/actions.ts (deleteObjetivo), src/features/key-result/actions.ts]
- [Source: src/components/ui/sheet.tsx (padrão Base UI Portal/Backdrop/Popup), src/features/key-result/components/KRCard.tsx, src/features/plano/components/ObjetivosBoard.tsx]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-18):**
- **`deleteKeyResult(id)`** (nova action): `resultadoChave.delete` (cascata do schema remove HistoricoValores/LinhaTendencia). +1 teste → **171 verdes**. `deleteObjetivo` reutilizada.
- **`ConfirmDialog`** (`src/components/confirm-dialog.tsx`): Base UI `@base-ui/react/alert-dialog` (Root/Portal/Backdrop/Popup/Title/Description/Close), centrado, tokens, botão `destructive`, `useTransition` para pending, fecha no sucesso. Reutilizável.
- **`KRCard`**: nova prop `onExcluir` + botão Trash2 (disabled sem handler).
- **`ObjetivosBoard`**: estado `confirm` (objetivo|kr); Trash2 no cabeçalho da coluna (objetivo) + `onExcluir` do KRCard; `ConfirmDialog` com texto de consequência fiel (objetivo → remove KRs; KR → remove histórico); `onConfirm` chama `deleteObjetivo`/`deleteKeyResult` + `router.refresh()`.
- **Escopo:** só objetivo+KR (plano = 2.8). Sem dependência nova.
- **Verificação:** `pnpm typecheck` ✓ · `pnpm test` 171/171 ✓ · `pnpm lint` exit 0 · `pnpm build` ✓.

### Change Log
- 2026-06-18 — Story 2.5: deleteKeyResult (+teste); ConfirmDialog (Base UI AlertDialog); excluir objetivo/KR com confirmação no board. typecheck/test/lint/build verdes.

### File List
- `src/features/key-result/actions.ts` (MODIFIED) — nova action `deleteKeyResult`.
- `src/features/key-result/__tests__/actions.test.ts` (MODIFIED) — teste de deleteKeyResult + mock delete.
- `src/components/confirm-dialog.tsx` (NEW) — diálogo de confirmação reutilizável.
- `src/features/key-result/components/KRCard.tsx` (MODIFIED) — ação Excluir.
- `src/features/plano/components/ObjetivosBoard.tsx` (MODIFIED) — confirmação + exclusão de objetivo/KR.
