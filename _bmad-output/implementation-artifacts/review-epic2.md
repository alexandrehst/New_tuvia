# Epic 2 (parcial: 2.1 + 2.2) — Code Review

**Verdict: Approve-with-nits** — código sólido e aderente às regras; 1 medium de a11y (controles inertes) + 1 low defensivo. Nenhuma regressão; dívida de status do Epic 1 quitada (PlanoTree removido).

Escopo: diff congelado `/tmp/epic2-review.diff` (10 arquivos; −293 = remoção do PlanoTree). Lentes: Blind Hunter, Edge Case Hunter, Acceptance Auditor.

---

## Medium

### M1 — Botões "Editar" e "Histórico" do KRCard são controles inertes até as Stories 2.4/2.6
- **File:** `src/features/key-result/components/KRCard.tsx` (ações no hover).
- **Lens:** Edge Case Hunter (a11y/UX).
- **Issue:** `onEditar`/`onHistorico` não são passados pelo `ObjetivosBoard` (só `onAtualizar`). Os botões renderizam com `onClick={undefined}` → focáveis por teclado mas sem ação (dead controls), semelhante ao L1 do review do Epic 1.
- **Fix:** `disabled={!onEditar}` / `disabled={!onHistorico}` (e idem Atualizar) — ou omitir os botões sem handler. Quando 2.4/2.6 ligarem os handlers, ficam ativos.

---

## Low

### L1 — `statusLabel`/`statusPillClasses` sem fallback para valor desconhecido
- **File:** `src/features/key-result/lib/status.ts`.
- **Lens:** Edge Case Hunter.
- **Issue:** Se `kr.status` vier fora dos 4 valores de `StatusRisco` (improvável — enum `StatusResultadoChave` é restrito no schema), `statusPillClasses` retorna `undefined` → classe "undefined" na pílula. Baixo risco.
- **Fix (opcional):** fallback neutro (`?? 'bg-muted text-muted-foreground'` / rótulo cru) para robustez.

---

## Notas (não-defeitos)

- **Atualização in-place do KR:** após salvar valor no `KRPanel` inline, o `KRCard` não recalcula na hora (progresso/status só atualizam ao recarregar). **Esperado** — preserva o comportamento anterior; o recálculo otimista + `aria-live` é a Story 2.3 (UX-DR12). Não regressão.
- **Avatar no KR card:** o FR-20 cita "avatar do responsável" no KR, mas o schema só tem responsável por Objetivo → avatares no cabeçalho da coluna (FR-24). Decisão documentada na story.

## What's solid
- **Disciplina Base UI/tokens:** `StatusPill`/`KRProgress` consomem a fonte única; zero cor de status hardcoded; `KRProgress` usa `@base-ui/react/progress` direto (sem Radix, sem asChild). PlanoTree (com `StatusBadge` divergente "Em dia/Atrasado") **removido** — NFR-7 cumprido, dívida do review do Epic 1 quitada.
- **Fonte única testada:** `status.ts` e `tempo.ts` com testes no gate `features/**` (status: rótulos+classes+sem hex; tempo: agora/min/h/dias/data/inválido). 162 testes verdes.
- **Sem regressão:** atualizar valor segue funcional via KRPanel; estado vazio e faixa de resumo (2.1) preservados; `clamp` de progresso em KRCard/KRProgress.
- **Responsivo + a11y:** colunas `lg:flex-row`+overflow / empilha em `sm`; ações reveladas em `group-hover` **e** `focus-within` (alcançáveis por teclado); StatusPill com rótulo textual.
- **Build/types:** typecheck ✓, build ✓, lint exit 0 (deletar PlanoTree removeu 1 warning).

---

## Resolução (2026-06-18)
- **M1 — RESOLVIDO:** botões Atualizar/Editar/Histórico do `KRCard` agora `disabled` quando sem handler (sem dead controls; ativam ao ligar nas Stories 2.3/2.4/2.6).
- **L1 — RESOLVIDO:** `statusLabel`/`statusPillClasses` com fallback (`?? String(status)` / `?? 'bg-muted text-muted-foreground'`).
- **Revalidação:** typecheck ✓ · 162 testes ✓ · lint exit 0 · build ✓. **Veredito final: Approve.**
