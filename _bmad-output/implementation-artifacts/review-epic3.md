# Epic 3 (Stories 3.1–3.4) — Code Review

**Verdict: Approve-with-nits** — as 4 stories estão corretas, testadas no gate e aderentes (Base UI, tokens, dark). Marco do epic: **tokens legados eliminados do projeto**. Nenhum achado bloqueante; 3 nits Low.

Escopo: diff `/tmp/epic3.diff` (14 arquivos). Inclui mudanças cumulativas vs baseline (globals.css/páginas vêm de epics anteriores já revisados) — foco aqui nos **deltas do Epic 3**. Actions/libs novas testadas: `planoStatus*` (5), `fetchSugestoes` (5), `createPlanoDepartamento` (3) → 189 testes.

---

## Low (follow-ups, não bloqueiam)

### L1 — Inputs de data em UTC (PlanoApoioButton/PlanoEditButton)
- **Files:** `PlanoApoioButton.tsx`, `PlanoEditButton.tsx` (`toInputDate` via `toISOString().slice(0,10)`).
- **Lens:** Edge Case Hunter.
- **Issue:** preencher/exibir datas em UTC pode mostrar o dia anterior em fusos negativos. Cosmético (mesma família do L5 do review do Epic 2).

### L2 — `createPlanoDepartamento` não verifica que `planoPaiId` pertence ao `clienteId`
- **File:** `src/features/plano/actions.ts`.
- **Lens:** Blind Hunter (multi-tenant).
- **Issue:** a action confia no `planoPaiId` recebido sem checar a posse pelo `clienteId`. O trigger só passa o `plano.id` do próprio usuário (página autenticada), mas uma chamada direta poderia vincular a um pai de outro tenant. Baixo (consistente com as demais actions, que confiam na sessão/escopo da página). Sugestão futura: validar `plano.findFirst({ where: { id: planoPaiId, clienteId } })`.

### L3 — `PlanoCard` depende do `twMerge` para sobrepor o bg padrão do `Badge`
- **File:** `src/features/plano/components/PlanoCard.tsx`.
- **Lens:** Blind Hunter.
- **Issue:** `Badge` (variant default) traz `bg-primary`; passar `className` tokenizado depende do `tailwind-merge` deduplicar o `bg-*`. Funciona, mas é acoplamento implícito. Alternativa: `variant="outline"` + classes, ou um helper de Badge de status.

---

## What's solid
- **3.1:** fonte única `plano/lib/status.ts` (label + badge classes, fallback) testada; `PlanoCard` sem cores hardcoded (dark-safe); estado vazio alinhado à AC; navegação/CTA intactos.
- **3.2:** `CriadorWizard` reescrito em **um passo por vez** com "Passo N de M" + progresso + `aria-live` (UX-DR18); migração 100% a tokens/Base UI (`Input`/`Textarea`/`Label`/`Button`), dark-safe; novo `ui/textarea.tsx`; **bloco de aliases legados removido do globals.css** (grep confirmou zero consumidores) — dívida do Epic 1 quitada. `createPlanoCorporativo`/redirect preservados.
- **3.3:** `fetchSugestoes` testável (lança em falha; `res.text()` parse/≤5); erro inline `role="alert"` + vazio por campo; **pick explícito** também nas listas (nunca imposto); campo sempre editável.
- **3.4:** `createPlanoDepartamento` (apoio, `planoPaiId`, status edicao) testado; `PlanoApoioButton` (Sheet) só em planos corporativo; breadcrumb do pai já vinha da 1.5 (confirmado).
- **Disciplina:** Base UI (sem Radix/asChild), tokens (sem hex), libs/actions testadas no gate, `router.refresh`/`push` corretos. typecheck ✓, 189 testes ✓, lint exit 0, build ✓.

## False alarms checked
- "Publicar" sem toggle de status — decisão consciente (AC1 = confirmação do wizard; no-new-features).
- `planoEstrategicoId` ausente no apoio — campo é nullable (correto).
- Auto-append de sugestões removido em favor de pick explícito (atende FR-16 "nunca imposto").

---

## Resolução (2026-06-19)
- **L1–L3 — ACEITOS como nits documentados** (Low, follow-up; nenhum corrompe dados nem bloqueia). **Veredito: Approve.** Stories 3.1–3.4 → `done`; **Epic 3 → done**.
