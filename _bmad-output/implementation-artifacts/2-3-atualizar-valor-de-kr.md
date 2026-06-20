---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 2.3: Atualizar valor de KR (painel + cadeia de recálculo)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a responsável por um KR (Bruno),
I want atualizar o valor de um KR num painel rápido sobre o contexto,
so that o progresso e o status reflitam a realidade na hora, sem eu trocar de página.

## Acceptance Criteria

1. **Painel como Sheet**: a ação "Atualizar" do `KRCard` abre o painel num **`Sheet`** (`@/components/ui/sheet`, Base UI) sobre o acompanhamento — não mais inline. Fecha por overlay/Esc/botão, com foco preso e retorno ao gatilho. (UX-DR12, NFR-4)
2. **Cadeia preservada**: ao salvar, a action `updateKeyResultValor` grava `HistoricoValores`, recalcula progresso/risco do KR e o progresso ponderado do Objetivo, e dispara o e-mail Brevo (não-fatal). **Não reimplementar** — reutilizar a action existente. (FR-26)
3. **Reflexo otimista**: ao salvar com sucesso, o **`KRCard` na coluna** atualiza progresso (`KRProgress`) e **`StatusPill`** na hora (sem recarregar a página), e o painel fecha (ou mostra sucesso). (UX-DR12)
4. **`aria-live`**: a mudança de status é anunciada por região `aria-live` (ex.: "Resultado-chave atualizado: No prazo, 70%"). (NFR-4)
5. **Erro**: falha ao salvar mostra alerta inline (role="alert") tokenizado; o **valor digitado é preservado**. (UX-DR12) — _sem lib de toast no projeto; usar alerta inline (não adicionar dependência)._
6. **Migração de tokens**: o `KRPanel` deixa de usar tokens legados (`var(--teal)`, `var(--text-*)`) e hex hardcoded; passa a usar tokens novos + primitivos shadcn (`Input`, `Label`, `Button`) + `StatusPill`/`KRProgress`/`statusLabel` (fonte única). Remove os `statusLabel`/`statusStyle` duplicados internos. (NFR-1/NFR-7 — quita dívida do review do Epic 1)
7. **Sem regressão**: `pnpm typecheck/lint/test/build` passam; os testes existentes da action seguem verdes.
8. **Transversais**: paridade dark; pt-BR; a11y (label associado ao input, foco, Esc).

## Tasks / Subtasks

- [x] **Task 1 — Reescrever `KRPanel` como conteúdo de painel tokenizado** (AC: 5, 6, 8) — `src/features/key-result/components/KRPanel.tsx`
  - [x] Trocar estilos inline/legados por classes de token + `Input`/`Label`/`Button` (shadcn). Substituir o pill/label internos por `StatusPill` + `statusLabel` (de `features/key-result/lib/status`) e a barra por `KRProgress`. Manter a assinatura/contrato (`kr`, `onClose`, `onUpdate`) e a chamada a `updateKeyResultValor`.
  - [x] Erro: alerta inline `role="alert"` com tokens (`bg-destructive/10 text-destructive`); preservar `valor` no estado em caso de erro. Estado de carregando no botão (`isPending`).
- [x] **Task 2 — Abrir em `Sheet` + reflexo otimista** (AC: 1, 3, 4) — `src/features/plano/components/ObjetivosBoard.tsx`
  - [x] Substituir o render inline do `KRPanel` por um `Sheet` controlado por `openKR` (`open`/`onOpenChange`), `SheetContent` lateral com `SheetHeader`/`SheetTitle`.
  - [x] Manter overrides otimistas por KR: ao `onUpdate` do painel, aplicar `{progresso, status, valorAtual}` ao KR correspondente no estado local → o `KRCard` re-renderiza com o novo `StatusPill`/`KRProgress`. Fechar o Sheet (ou manter com sucesso).
  - [x] Adicionar região `aria-live="polite"` que anuncia o novo status/progresso após salvar.
- [x] **Task 3 — Validação** (AC: 7) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`; conferir que `features/key-result/__tests__/actions.test.ts` (cadeia) segue verde.

## Dev Notes

### Estado atual — `KRPanel.tsx` (LER; UPDATE)
- `'use client'`, `useState`+`useTransition`. `handleSubmit`: `parseFloat(valor)` → `updateKeyResultValor({ krId, valor, comentario })` → em `result.ok`, monta `updated = {...currentKR, valorAtual, progresso: result.progresso, status: result.status}`, chama `onUpdate(updated)`, limpa campos, mostra toast inline 3s. Em erro: `setError`.
- **Dívidas a corrigir:** usa `var(--teal)`/`var(--text-*)` e hex (`#d1fae5`...); tem `statusLabel`/`statusStyle` **duplicados** (l.147-162) → substituir por `StatusPill` + `statusLabel` da fonte única. Inputs/botões são `<input>`/`<button>` crus → usar `Input`/`Label`/`Button`.
- **Preservar:** contrato `{ kr, onClose, onUpdate }`, a chamada à action e o shape `KRData` (id, descricao, valorAtual, progresso, status, unidade). Preservar valor em erro.

### Action (NÃO reimplementar) — `src/features/key-result/actions.ts`
- `updateKeyResultValor({ krId, valor, comentario? })`: valida (zod), busca KR + objetivo + plano, `calcularProgresso` + `calcularRisco`, atualiza `ResultadoChave`, grava `HistoricoValores`, recalcula progresso ponderado do Objetivo, dispara e-mail Brevo (não-fatal). Retorna `{ ok, progresso, status }`. **Já testada** (`__tests__/actions.test.ts`). Apenas consumir.

### Estado atual — `ObjetivosBoard.tsx` (UPDATE, Story 2.2)
- Client; `openKR` state; hoje renderiza `KRPanel` inline num `<div>` abaixo do card. Trocar por `Sheet`. Para o reflexo otimista, manter um estado de overrides por KR (ex.: `Record<krId, {progresso,status,valorAtual}>`) e aplicar no `kr` passado ao `KRCard`. O `KRCard` já mostra `StatusPill(kr.status)` + `KRProgress(kr.progresso)` → re-renderiza sozinho ao mudar as props.

### ui/sheet (Base UI) — disponível
- Exporta `Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription`. Usar `Sheet open={...} onOpenChange={...}` + `SheetContent` (lateral). Foco preso/Esc já vêm do primitivo. Sem `SheetTrigger` (abertura é programática pelo `KRCard`).

### Guardrails / escopo
- **Sem nova dependência** (sem sonner/toast lib) — erro como alerta inline. Se o usuário quiser toast global depois, é outra story.
- **NÃO** criar/editar objetivo/KR nem excluir (Stories 2.4/2.5); **NÃO** o gráfico de histórico (2.6). Só atualizar valor.
- Base UI (render prop, nunca asChild); tokens, sem hex de status; `redirect` não se aplica aqui (a action retorna objeto, não redireciona).
- **CM1:** atualizar valor deve continuar funcionando (agora via Sheet) — é o mesmo fluxo, melhor empacotado.

### Testes / verificação
- Lógica da cadeia já testada na action (gate 90%) — não duplicar. Componentes (KRPanel/ObjetivosBoard) em `features/*/components` ficam fora do gate; verificação por build/typecheck + rodar a suíte (não regredir) + visual.
- Se extrair um helper puro de merge otimista para `features/**`, testá-lo; caso fique inline no client, sem teste de gate.

### Project Structure Notes
- UPDATE: `src/features/key-result/components/KRPanel.tsx`, `src/features/plano/components/ObjetivosBoard.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2 / Story 2.3 (FR-21 ação, FR-26, UX-DR12)]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/EXPERIENCE.md#State Patterns (Salvou KR / Falha), Interaction Primitives]
- [Source: docs/architecture.md §3.3 (cadeia de atualização) e §6 (updateKeyResultValor)]
- [Source: src/features/key-result/components/KRPanel.tsx, src/features/key-result/actions.ts (estado atual)]
- [Source: src/features/plano/components/ObjetivosBoard.tsx — Story 2.2]
- [Source: src/components/ui/sheet.tsx, src/components/status-pill.tsx, src/components/kr-progress.tsx, src/features/key-result/lib/status.ts]
- [Source: _bmad-output/implementation-artifacts/review-epic1.md — dívida: migrar KRPanel dos tokens legados]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-18):**
- **`KRPanel` reescrito**: tokens novos + `Input`/`Label`/`Button` shadcn + `StatusPill`/`KRProgress`/`statusLabel` (fonte única). Removidos `statusLabel`/`statusStyle` duplicados e **todos os tokens legados** (`var(--teal)`/`var(--text-*)`/hex) — `grep` confirma limpo. Contrato `{kr,onClose,onUpdate}` e chamada a `updateKeyResultValor` preservados. Erro = alerta inline `role="alert"` (`bg-destructive/10`), valor preservado. Fecha no sucesso (`onClose`).
- **`ObjetivosBoard`**: painel agora abre em **`Sheet`** lateral (foco preso/Esc do primitivo) controlado por `openKR`. **Reflexo otimista**: `onUpdate` grava override por KR (`{progresso,status,valorAtual}`) → `KRCard` re-renderiza `StatusPill`/`KRProgress` na hora, sem recarregar. Região `aria-live="polite"` anuncia "Resultado-chave atualizado: {status}, {n}%".
- **Cadeia preservada**: action `updateKeyResultValor` (HistoricoValores→recalc KR→objetivo→email Brevo não-fatal) reutilizada, não reimplementada. Testes da action seguem verdes.
- **Dívida do review do Epic 1:** KRPanel migrado dos tokens legados (resta só o CriadorWizard → Epic 3).
- **Sem dependência nova** (erro inline, sem lib de toast).
- **Verificação:** `pnpm typecheck` ✓ · `pnpm test` 162/162 ✓ · `pnpm lint` exit 0 · `pnpm build` ✓.

### Change Log
- 2026-06-18 — Story 2.3: KRPanel redesenhado em Sheet (tokens novos + StatusPill/KRProgress), reflexo otimista no card + aria-live, cadeia preservada. typecheck/test/lint/build verdes.

### File List
- `src/features/key-result/components/KRPanel.tsx` (MODIFIED) — redesenho tokenizado + StatusPill/KRProgress; remove tokens legados e duplicações.
- `src/features/plano/components/ObjetivosBoard.tsx` (MODIFIED) — Sheet + override otimista + aria-live.
