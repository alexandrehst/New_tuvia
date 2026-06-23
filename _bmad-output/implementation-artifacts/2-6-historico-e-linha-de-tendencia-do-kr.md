---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 2.6: Histórico e linha de tendência do KR

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a responsável/gestor,
I want ver o histórico de valores e a tendência de um KR num gráfico,
so that eu entenda a evolução e a projeção.

> Última story do Epic 2 (acompanhamento). Só visualização — sem editar pontos.

## Acceptance Criteria

1. **`getKRHistorico(krId)` (Server Action)** em `features/key-result/actions.ts`: retorna `{ historico: {data, valor}[], tendencia: {data, valor}[] }` ordenados por data asc. `historico` vem de `HistoricoValores` (campo de data = **`dataRegistro`**), `tendencia` de `LinhaTendencia` (campo `data`). Chamável do cliente (lazy load ao abrir o painel). Testada (gate 90%). (FR-28)
2. **`HistoricoChart` (componente dumb, SVG)** — recebe `historico` e `tendencia` por props; desenha duas linhas (valores reais + projeção/baseline) num eixo de tempo compartilhado, com escala min/max, rótulos de eixo legíveis e legenda. Estado vazio ("Sem histórico ainda."). Sem dependência de lib de gráfico. (UX-DR22)
3. **Painel de histórico em `Sheet`**: a ação "Histórico" do `KRCard` (hoje inerte) abre um `Sheet` que, ao abrir, busca `getKRHistorico(krId)` (estado de carregando → `Skeleton`) e renderiza o `HistoricoChart`. (FR-28, FR-21 trigger)
4. **Sem regressão / escopo**: NÃO editar/excluir; `gerarLinhaTendencia` (criação/edição de KR) intacto. `pnpm typecheck/lint/test/build` passam.
5. **Transversais**: paridade dark (cores via token — linha real em `primary`, tendência em `muted-foreground`/tracejada); pt-BR; a11y (Sheet com título; gráfico com `role="img"` + `aria-label` resumindo, ou tabela acessível alternativa); Base UI.

## Tasks / Subtasks

- [x] **Task 1 — `getKRHistorico` + teste** (AC: 1) — `features/key-result/actions.ts`, `__tests__/actions.test.ts`
  - [x] `export async function getKRHistorico(krId: string)`: `prisma.historicoValores.findMany({ where: { resultadoChaveId: krId }, orderBy: { dataRegistro: 'asc' }, select: { dataRegistro, valor } })` → mapear para `{ data, valor }`; `prisma.linhaTendencia.findMany({ where: { resultadoChaveId: krId }, orderBy: { data: 'asc' }, select: { data, valor } })`. Retornar `{ historico, tendencia }`.
  - [x] Teste: mockar `historicoValores.findMany` + `linhaTendencia.findMany`; verificar where/orderBy e o shape normalizado.
- [x] **Task 2 — `HistoricoChart`** (AC: 2, 5) — novo `src/components/historico-chart.tsx`
  - [x] SVG dumb: escala X por data (min..max das duas séries), escala Y por valor (0..max). Linha de tendência tracejada (`stroke` muted), linha de histórico sólida (`stroke` primary) + pontos. Rótulos de eixo (datas curtas, valores). Estado vazio. `role="img"` + `aria-label` com resumo (ex.: "Histórico do KR: N pontos, valor atual X").
- [x] **Task 3 — Painel de histórico** (AC: 3) — `src/features/plano/components/ObjetivosBoard.tsx`
  - [x] Estado `historico: { krId; descricao } | null`. `KRCard onHistorico` → set. `Sheet` que, ao abrir, faz `getKRHistorico(krId)` (via `useTransition`/`useEffect`), mostra `Skeleton` enquanto carrega e o `HistoricoChart` depois. Fechar limpa o estado.
- [x] **Task 4 — Validação** (AC: 4) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Dev Notes

### Fatos verificados
- **Sem lib de gráfico** no projeto → `HistoricoChart` é **SVG próprio** (dumb, dados via props). Sem nova dependência. (Recharts/visx ficam como opção futura para interatividade.)
- **Schema:** `HistoricoValores { valor: Float, comentario?, dataRegistro: DateTime, resultadoChaveId }` — atenção: o campo de data é **`dataRegistro`** (não `data`). `LinhaTendencia { data: DateTime, valor: Float, resultadoChaveId }`. Normalizar ambos para `{ data: Date; valor: number }`.
- **`getKRHistorico` como Server Action** (não query pura): precisa ser chamável do cliente ao abrir o painel; query em `queries.ts` não é invocável do client. Vive em `actions.ts` (`'use server'`), retorna dados (leitura). Anotar a exceção de convenção (read-as-action para lazy load).
- **`KRCard`**: o botão "Histórico" (lucide `LineChart`) já existe e fica `disabled` sem `onHistorico` — ligar via prop.
- **`ObjetivosBoard`**: já tem múltiplos `Sheet` (valor/objetivo/KR) + `ConfirmDialog`; adicionar o painel de histórico no mesmo padrão. `Skeleton` de `@/components/ui/skeleton`.
- A `LinhaTendencia` é gerada/regenerada na criação (createKeyResult) e edição (updateKeyResult, Story 2.7). O `HistoricoValores` é alimentado pelo `updateKeyResultValor` (Story 2.3). Esta story apenas LÊ.

### Guardrails / escopo
- Só visualização (sem editar pontos do histórico). Não mexer em `gerarLinhaTendencia`/cadeia.
- Base UI (sem asChild); cores via token (linha real `stroke-primary`, tendência `stroke-muted-foreground` tracejada). pt-BR.
- `getKRHistorico` em `features/**` (gate — testar). `HistoricoChart`/painel em `src/components`/`features/*/components` (fora do gate).

### Testes / verificação
- `getKRHistorico` → teste obrigatório (gate 90%): mock prisma, where/orderBy/shape.
- `HistoricoChart`/Sheet → fora do gate; build/typecheck/visual.

### Project Structure Notes
- NEW: `src/components/historico-chart.tsx`.
- UPDATE: `src/features/key-result/actions.ts` (+ `__tests__/actions.test.ts`), `src/features/key-result/components/KRCard.tsx` (passar onHistorico — já aceita a prop), `src/features/plano/components/ObjetivosBoard.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2 / Story 2.6 (FR-28, UX-DR22)]
- [Source: docs/architecture.md §4 (linha de tendência baseline)]
- [Source: prisma/schema.prisma — HistoricoValores (dataRegistro), LinhaTendencia (data)]
- [Source: src/features/key-result/actions.ts (gerarLinhaTendencia usado em create/update), src/features/key-result/components/KRCard.tsx (onHistorico)]
- [Source: src/features/plano/components/ObjetivosBoard.tsx (padrão de Sheet), src/components/ui/skeleton.tsx]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-18):**
- **`getKRHistorico(krId)`** (Server Action): `historicoValores.findMany` (orderBy `dataRegistro` asc → normaliza `{data,valor}`) + `linhaTendencia.findMany` (orderBy `data`). +2 testes → **173 verdes**.
- **`HistoricoChart`** (`src/components/historico-chart.tsx`): SVG dumb, escala min/max X(tempo)/Y(valor), linha **Realizado** (primary sólida + pontos) + **Tendência** (muted tracejada), eixos/rótulos, legenda, estado vazio, `role="img"` + `aria-label`. Sem lib de gráfico.
- **`ObjetivosBoard`**: painel `Sheet` de histórico; `HistoricoPanelContent` (keyed por krId) faz fetch lazy via `getKRHistorico` (`useEffect`) com `Skeleton` enquanto carrega; `onHistorico` do `KRCard` ligado (botão antes inerte).
- **Escopo:** só leitura; `gerarLinhaTendencia`/cadeia intactos.
- **Verificação:** `pnpm typecheck` ✓ · `pnpm test` 173/173 ✓ · `pnpm lint` exit 0 · `pnpm build` ✓.

### Change Log
- 2026-06-18 — Story 2.6: getKRHistorico (+2 testes); HistoricoChart (SVG); painel de histórico no board (fetch lazy + Skeleton); onHistorico do KRCard ligado. typecheck/test/lint/build verdes.

### File List
- `src/features/key-result/actions.ts` (MODIFIED) — Server Action `getKRHistorico`.
- `src/features/key-result/__tests__/actions.test.ts` (MODIFIED) — 2 testes de getKRHistorico + mocks findMany.
- `src/components/historico-chart.tsx` (NEW) — gráfico SVG de histórico/tendência.
- `src/features/plano/components/ObjetivosBoard.tsx` (MODIFIED) — painel de histórico (Sheet + fetch lazy) + onHistorico.
