# Stories 2.5 + 2.6 + 2.7 + 2.8 — Code Review (fecha o Epic 2)

**Verdict: Approve-with-nits** — as 4 stories estão corretas, testadas no gate e aderentes (Base UI, tokens, boundaries). Nenhum achado bloqueante; 5 nits Low (todos follow-up).

Escopo: diff congelado `/tmp/epic2-2578.diff` (11 arquivos, +1368/−75). Lentes: Blind Hunter, Edge Case Hunter, Acceptance Auditor. Actions novas todas testadas: `deleteKeyResult`, `getKRHistorico`, `updateKeyResult`, `updatePlano` (176 testes).

---

## Low (follow-ups, não bloqueiam)

### L1 — `updatePlano`: detecção de mudança de data sensível a precisão/timezone
- **File:** `src/features/plano/actions.ts` (`datasMudaram`) + `PlanoEditButton` (`toInputDate`/`new Date(str)`).
- **Lens:** Edge Case Hunter.
- **Issue:** o form envia datas como `new Date("YYYY-MM-DD")` (meia-noite UTC). Se as datas armazenadas tiverem componente de hora diferente, editar só o título dispara recálculo de **todos os KRs** desnecessariamente (e normaliza as datas para meia-noite UTC). Dados continuam válidos — é desperdício, não corrupção. Na prática `createPlanoCorporativo` também grava via coerce.date (provável meia-noite UTC), então raro.
- **Fix sugerido:** comparar por dia (normalizar para `YYYY-MM-DD`) antes de decidir o recompute.

### L2 — Não dá para limpar datas (plano) nem descrições via edição
- **Files:** `updatePlano`, `updateKeyResult`/`updateObjetivo` (padrão `undefined` → Prisma ignora).
- **Lens:** Edge Case Hunter.
- **Issue:** enviar campo opcional vazio vira `undefined` e o update não limpa o valor existente. Cross-cutting, baixo impacto.

### L3 — `ConfirmDialog`/exclusão: falha silenciosa
- **Files:** `src/components/confirm-dialog.tsx`, `ObjetivosBoard` (`onConfirm`).
- **Lens:** Blind Hunter.
- **Issue:** se `deleteObjetivo`/`deleteKeyResult` lançar, o diálogo não fecha e nenhuma mensagem de erro aparece (o `await onConfirm()` falha dentro do `startTransition`). Usuário fica sem feedback.
- **Fix sugerido:** `try/catch` no `onConfirm` com estado de erro inline.

### L4 — `HistoricoPanelContent`: sem estado de erro no fetch
- **File:** `src/features/plano/components/ObjetivosBoard.tsx`.
- **Lens:** Blind Hunter.
- **Issue:** `getKRHistorico(...).then(...)` sem `.catch` — se a busca falhar, fica em `Skeleton` para sempre. Adicionar tratamento de erro.

### L5 — Datas do gráfico/inputs em UTC (off-by-one em fusos negativos)
- **Files:** `historico-chart.tsx` (`fmtData`), `PlanoEditButton` (`toInputDate` via `toISOString`).
- **Lens:** Edge Case Hunter.
- **Issue:** uso de UTC para formatar/preencher datas pode exibir o dia anterior em fusos negativos. Cosmético.

---

## What's solid
- **2.5:** `deleteKeyResult` (cascata do schema confirmada) testado; `ConfirmDialog` reutilizável em Base UI AlertDialog (foco/Esc/destructive); textos de consequência fiéis; objetivo+KR ligados.
- **2.6:** `getKRHistorico` normaliza `dataRegistro`→`data` e ordena (testado, com e sem dados); `HistoricoChart` SVG dumb com guardas de escala (min===max), estado vazio, `role="img"`+`aria-label`; painel com fetch lazy + `Skeleton`.
- **2.7:** `updateKeyResult` recomputa progresso/status + progresso ponderado do objetivo + regenera tendência (reusa calculos; testado com e sem datas); `KRSheet` separa payload create/update; tipo de KR estendido corretamente (dados do Prisma).
- **2.8:** `updatePlano` implementa a decisão do usuário (recompute de risco+tendência de todos os KRs só quando datas mudam; `progresso`/`valorAtual` intactos; testado nos 3 caminhos); `PlanoEditButton` com datas/frequência; imports órfãos removidos da página.
- **Disciplina:** Base UI (sem Radix/asChild), tokens (sem hex), Server Actions testadas no gate `features/**`, `router.refresh()` consistente, `parse`/zod nas fronteiras. typecheck ✓, 176 testes ✓, lint exit 0, build ✓.

## False alarms checked
- `updateKeyResult` recompute não toca `valorAtual` (correto — valor é 2.3).
- `getKRHistorico` como Server Action (read) — exceção de convenção justificada (lazy load do client).
- Múltiplos `Sheet`/`Dialog` montados no board — só um abre por vez; todos keyed.
- `datasMudaram` com `?? NaN` — trata corretamente datas anteriores nulas.

---

## Resolução (2026-06-18)
- **L1–L5 — ACEITOS como nits documentados** (Low, follow-up; nenhum corrompe dados nem bloqueia). **Veredito: Approve.** Stories 2.5–2.8 → `done`; **Epic 2 → done**.
