---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 2.1: Faixa de resumo + componentes de status

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a gestor (Marina),
I want uma faixa de resumo e indicadores de status claros e consistentes no topo do plano,
so that eu leia o estado geral do plano num relance.

## Acceptance Criteria

1. **Fonte única de status** em `features/key-result/lib/status.ts`: para cada `StatusRisco` (`no_prazo|em_atraso|em_risco|risco_alto`), um rótulo pt-BR canônico ("No prazo" / "Em atraso" / "Em risco" / "Risco alto") e as classes de cor de **token** (`text-status-*` / `bg-status-*-bg`). Testado (gate 90%). (NFR-7)
2. **`StatusPill`** (componente de domínio, dumb): recebe `status: StatusRisco`, renderiza pílula com **rótulo textual + cor** (nunca só cor — a11y), consumindo a fonte única do AC1. 4 variantes 1:1 com `StatusRisco`. (UX-DR7)
3. **`ProgressBar`** de domínio: recebe `value` (0-100); trilha `muted`, preenchimento `primary`; a **100% → tratamento "concluído"** (preenchimento verde `status-no-prazo` + ícone de check), distinto do status de risco. (UX-DR10)
4. **Faixa de resumo** redesenhada no topo de `planos/[id]`: cartões com **gauge circular** de Progresso geral e Tempo decorrido + bloco de **contadores** Total / Abertos / Concluídos, números em `text-metric`/`text-metric-lg`. Usa `dataInicio`/`dataFim` (sem ciclo). (FR-18, UX-DR5)
5. **Consistência**: os componentes usam os tokens da Story 1.1; nenhum hex de status hardcoded novo. (NFR-1, NFR-7)
6. **Escopo**: NÃO redesenhar as colunas de Objetivo / cartões de KR (isso é a Story 2.2) — apenas a faixa de resumo + os componentes de status/progresso que a 2.2 vai consumir. Migrar `KRPanel`/`PlanoTree` para a fonte única é oportunístico/2.2+, não obrigatório aqui.
7. **Sem regressão**: `pnpm typecheck`, `pnpm lint`, `pnpm test` (incl. teste da fonte de status), `pnpm build` passam.
8. **Transversais**: paridade dark; pt-BR; responsivo (faixa empilha em telas menores); a11y.

## Tasks / Subtasks

- [x] **Task 1 — Fonte única de status** (AC: 1) — `src/features/key-result/lib/status.ts`
  - [x] `STATUS_LABELS: Record<StatusRisco, string>` = { no_prazo:'No prazo', em_atraso:'Em atraso', em_risco:'Em risco', risco_alto:'Risco alto' } e `statusLabel(s)`.
  - [x] `statusPillClasses(s)` retornando classes de token (`text-status-no-prazo bg-status-no-prazo-bg`, etc.). Reaproveita `StatusRisco` de `./calculos`.
  - [x] **Teste** `src/features/key-result/__tests__/status.test.ts`: cada um dos 4 valores → label e classes corretas (gate 90%).
- [x] **Task 2 — `StatusPill`** (AC: 2) — `src/components/status-pill.tsx`
  - [x] Props `{ status: StatusRisco; className? }`. Render `Badge` (de `@/components/ui/badge`, variante neutra) + classes da fonte única + texto do rótulo. Pílula (`rounded-full`). Base UI (sem asChild).
- [x] **Task 3 — `ProgressBar` de domínio** (AC: 3) — `src/components/kr-progress.tsx` (ou similar)
  - [x] Wrapper sobre `@/components/ui/progress` (Base UI): `value`; a 100% aplica preenchimento `status-no-prazo` + check (lucide `Check`). `aria-valuenow` correto.
- [x] **Task 4 — Faixa de resumo na página** (AC: 4, 8) — `src/app/(app)/planos/[id]/page.tsx`
  - [x] Redesenhar a seção de resumo (substituindo o `Card` atual com `CircularProgress` inline): gauges de Progresso geral e Tempo decorrido + contadores Total/Abertos/Concluídos, `text-metric*`. Reaproveitar/limpar o `CircularProgress` existente (usa `.progress-ring`). Preservar os cálculos já presentes (`overallProgress`, `timeElapsed`, `totalKRs/openKRs/completedKRs`). NÃO tocar na lista de objetivos abaixo (Story 2.2).
- [x] **Task 5 — Validação** (AC: 7) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Dev Notes

### Fonte de verdade do status
- **`src/features/key-result/lib/calculos.ts`**: `export type StatusRisco = 'no_prazo' | 'em_atraso' | 'em_risco' | 'risco_alto'`; `calcularRisco()` retorna esse tipo. **Importar `StatusRisco` daqui.**
- O `ResultadoChave` persiste `status: StatusResultadoChave` (enum idêntico) — o `StatusPill` recebe esse valor; não recalcula.

### ⚠️ Inconsistência existente a unificar (motivo do AC1/NFR-7)
Hoje há **três** mapeamentos divergentes — esta story cria a fonte única e os novos componentes a usam:
- `src/features/key-result/components/KRPanel.tsx` (l.147-159): `statusLabel` com rótulos certos MAS cores **hex hardcoded** (`#d1fae5`...).
- `src/features/plano/components/PlanoTree.tsx` (l.120-121): rótulos **divergentes** ("Em dia", "Em risco" para no_prazo/em_atraso) com classes `bg-green-100`/`bg-amber-100` hardcoded.
- Adotar os rótulos **"No prazo / Em atraso / Em risco / Risco alto"** (batem com a EXPERIENCE.md Voice & Tone e o KRPanel). "Em dia" do PlanoTree é o outlier a descartar.
- Migrar KRPanel/PlanoTree para a fonte única **não é obrigatório nesta story** (são reescritos no Epic 2/3); mas se for trivial, preferir. Não introduzir hex novo.

### Estado atual da página
- **`src/app/(app)/planos/[id]/page.tsx`** (UPDATE): Server Component. Já calcula `overallProgress` (média de `objetivos.progresso`), `timeElapsed` (via `calcTimeElapsed(dataInicio,dataFim)`), `totalKRs/openKRs/completedKRs` (de `kr.progresso >= 100`). Tem `CircularProgress` inline (svg + `.progress-ring`) e um `Card`/`CardContent` de resumo. **Redesenhar essa seção**; manter os cálculos. O breadcrumb (Story 1.5) e o `<h1>` ficam. **NÃO** mexer na lista de objetivos/`PlanoTree` abaixo (Story 2.2).
- Tokens prontos (Story 1.1): `--color-status-*`, `.text-metric`/`.text-metric-lg`, `.progress-ring`. Primitivos `ui/progress`, `ui/badge`, `ui/card` disponíveis (Base UI).

### Aprendizados (Epic 1)
- Base UI, não Radix (`render` prop; nunca `asChild`). Tokens via classes (`bg-status-*`), nunca hex. Componentes de domínio consomem libs de `features/*` (lógica testável no gate). `pnpm build`/`typecheck`/`test`/`lint` verdes a cada story.

### Localização dos componentes
- Lógica/mapas → `features/key-result/lib/status.ts` (gate 90%).
- Componentes apresentacionais (`StatusPill`, `ProgressBar`) → `src/components/` (fora do gate; dumb, recebem props).

### Project Structure Notes
- NEW: `src/features/key-result/lib/status.ts`, `src/features/key-result/__tests__/status.test.ts`, `src/components/status-pill.tsx`, `src/components/kr-progress.tsx`.
- UPDATE: `src/app/(app)/planos/[id]/page.tsx` (faixa de resumo).

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2 / Story 2.1 (FR-18, UX-DR5/7/10, NFR-7)]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/DESIGN.md#Components (Summary stat card, Status pill, Progress bar)]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/mockups/acompanhamento.html — faixa de resumo de referência]
- [Source: src/features/key-result/lib/calculos.ts — StatusRisco, calcularRisco]
- [Source: src/app/(app)/planos/[id]/page.tsx — cálculos e CircularProgress atuais]
- [Source: src/features/key-result/components/KRPanel.tsx, src/features/plano/components/PlanoTree.tsx — mapeamentos a unificar]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-18):**
- **Fonte única** `features/key-result/lib/status.ts`: `STATUS_LABELS`/`statusLabel` (No prazo/Em atraso/Em risco/Risco alto) + `statusPillClasses` (classes de token fg+bg, literais p/ o scanner do Tailwind). Resolve a inconsistência de mapeamentos (NFR-7). Teste `status.test.ts` cobre os 4 valores (rótulos + classes, sem hex) → **156 testes verdes** (+4).
- **`StatusPill`** (`src/components/status-pill.tsx`): span de pílula, sempre rótulo textual + cor de token (a11y). Dumb, consome a fonte única.
- **`KRProgress`** (`src/components/kr-progress.tsx`): Base UI `Progress` direto (não o wrapper padrão, p/ controlar a cor do indicador); trilha muted/preenchimento primary; a 100% → verde `status-no-prazo` + ícone Check.
- **Faixa de resumo** (`planos/[id]/page.tsx`): contadores Total/Em aberto/Concluídos agora em `.text-metric`. Gauges (CircularProgress) e cálculos preservados. **Lista de objetivos não tocada** (Story 2.2).
- **Nota:** `StatusPill`/`KRProgress` ainda não são renderizados em nenhuma tela — serão consumidos pelos cartões de KR na Story 2.2 (classes de status já detectadas pelo Tailwind via literais em status.ts).
- **Verificação:** `pnpm typecheck` ✓ · `pnpm test` 156/156 ✓ · `pnpm lint` exit 0 · `pnpm build` ✓.

### Change Log
- 2026-06-18 — Story 2.1: fonte única de status (lib+teste), StatusPill, KRProgress, faixa de resumo em text-metric. typecheck/test/lint/build verdes.

### File List
- `src/features/key-result/lib/status.ts` (NEW) — fonte única de rótulos/cores de status.
- `src/features/key-result/__tests__/status.test.ts` (NEW) — testes da fonte única.
- `src/components/status-pill.tsx` (NEW) — pílula de status.
- `src/components/kr-progress.tsx` (NEW) — barra de progresso de KR (tratamento 100%).
- `src/app/(app)/planos/[id]/page.tsx` (MODIFIED) — contadores da faixa de resumo em text-metric.
