---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 3.2: Wizard de plano estratégico (estrutura em passos)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a administrador (Carla),
I want um wizard em passos com progresso visível,
so that eu monte o plano estratégico de forma guiada.

> Story densa: além da estrutura em passos, **quita a dívida dos tokens legados** — o `CriadorWizard` é o último consumidor de `var(--teal/--navy/--text-*)` e de hex hardcoded.

## Acceptance Criteria

1. Em `(app)/criador`, o wizard avança na ordem (descrição→visão→missão→valores→SWOT/começar-manter-parar→oportunidades→ameaças→datas) com **indicador "Passo N de M"** e progresso visível. (FR-14, UX-DR14)
2. **Avançar/voltar sem perder o que já foi preenchido** (estado preservado entre passos). (FR-14)
3. **Cada passo anuncia sua posição a leitores de tela** (`aria-live` "Passo N de M: {título}"; controles com rótulos). (UX-DR18)
4. **Migração ao design system (dívida):** zero `var(--teal/--navy/--text-*)` e zero hex/cores hardcoded no `CriadorWizard`; usa tokens + primitivos (`Button`, `Input`, `Label`, novo `Textarea`); paridade dark. Após a migração, **remover o bloco de aliases legados do `globals.css`** (CriadorWizard era o último consumidor; KRPanel já migrou na 2.3).
5. **Sem regressão**: geração via `createPlanoCorporativo` preservada (loading/sucesso/erro + redirect); a sugestão de IA por campo continua funcionando (o polimento dela é a 3.3). `pnpm typecheck/lint/test/build` passam.
6. **Transversais**: pt-BR; Base UI (sem asChild); a11y (foco, rótulos, anúncio de passo).

## Tasks / Subtasks

- [x] **Task 1 — Primitivo `Textarea`** (AC: 4) — novo `src/components/ui/textarea.tsx`
  - [x] `Textarea` shadcn/Base-UI-style, tokenizado (border-input, bg-transparent, focus ring), dark-safe. Espelha `ui/input.tsx`.
- [x] **Task 2 — Reescrever `CriadorWizard` (estrutura + tokens)** (AC: 1, 2, 3, 4, 6) — `src/features/criador-plano/components/CriadorWizard.tsx`
  - [x] Visão de **um passo por vez** com cabeçalho "Passo N de M" + barra de progresso (`Progress` ou div tokenizada) + título do passo. Navegação Voltar/Próximo (`Button`), estado em `WizardData` preservado entre passos (já existe). Último passo → bloco "Gerar plano".
  - [x] `aria-live="polite"` anunciando "Passo {N} de {M}: {título}" a cada mudança de passo. Controles com `aria-label`/`<Label>`.
  - [x] Substituir TODOS os estilos inline/legacy: campos via `Input`/`Textarea`/`Label`; botões via `Button`; listas (`ListInput`), sugestões e estados loading/done/error tokenizados (spinner/ícones em `text-primary`/`text-status-*`/`text-destructive`). Sem `style={{…}}` de cor, sem hex, sem `bg-blue-50`/`bg-gray-100`.
  - [x] Preservar: `fetchAI`/endpoints `/api/ai/*`, `SuggestButton`, `createPlanoCorporativo` (mesmos campos/fallbacks), redirect em sucesso.
- [x] **Task 3 — Remover aliases legados** (AC: 4) — `src/app/globals.css`
  - [x] Remover o bloco "Aliases legados" (`--navy/--navy-light/--teal/--teal-hover/--text-primary/--text-secondary/--text-muted`). Confirmar via grep que nada mais referencia esses nomes.
- [x] **Task 4 — Validação** (AC: 5) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Dev Notes

### Estado atual (LER)
- **`src/features/criador-plano/components/CriadorWizard.tsx`** (513 linhas, `'use client'`): hoje é um **acordeão** (lista todos os passos; expande o ativo). Usa `var(--teal)` (botões/spinner), `var(--navy)`, `var(--text-primary/secondary/muted)`, e hex (`#fef3c7/#92400e/#fde68a` no SuggestButton; `#f9fafb/#f3f4f6/#e5e7eb` em inputs/lista; `bg-blue-50`, `bg-gray-100`, `#d1fae5/#065f46`, `#fee2e2/#991b1b` nos estados). 11 passos em `STEPS`. Sub-componentes: `StepHeader`, `SuggestButton`, `ListInput`, `NavButtons`. Estado: `active`, `data: WizardData`, `loadingAI`, `suggestions`, `status`. `handleGenerate` chama `createPlanoCorporativo(clienteId, {...})` e redireciona. **Converter para um-passo-por-vez com "Passo N de M".**
- **`src/app/(app)/criador/page.tsx`**: monta o `CriadorWizard` (passa `clienteId`). Provavelmente não precisa mudar (confirmar tokens do cabeçalho se houver).
- **`src/components/ui/input.tsx`/`label.tsx`/`button.tsx`**: primitivos tokenizados a reutilizar. **Não há `textarea`** — criar.
- **`globals.css`**: bloco "Aliases legados" (linhas ~30-41) mapeando nomes antigos → tokens novos. **CriadorWizard é o ÚNICO consumidor restante** (grep confirmou) → remover após a migração.
- **Testes:** `criador-plano/__tests__/schemas.test.ts` cobre só o zod schema (não o componente) — a reescrita do componente não quebra testes. Sem teste de componente (consistente com KRSheet/ObjetivoSheet). `data-testid="sugestao-missao-item"` não é referenciado em teste; pode manter ou remover.

### Guardrails / escopo
- **3.2 = estrutura + tokens.** O polimento da sugestão de IA por campo é a **3.3**; a publicação é a **3.4**. Preservar o comportamento de IA atual sem reescrever a UX de sugestões além de tokenizar.
- Base UI (sem asChild; `Button` usa `render`); tokens, sem hex; dark paridade.
- Componente fora do gate; sem nova lógica testável de domínio (a action já é testada).

### Project Structure Notes
- NEW: `src/components/ui/textarea.tsx`.
- UPDATE: `src/features/criador-plano/components/CriadorWizard.tsx`, `src/app/globals.css` (remover aliases), eventualmente `src/app/(app)/criador/page.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3 / Story 3.2 (FR-14, UX-DR14/18)]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/EXPERIENCE.md (wizard, anúncio de passo) + DESIGN.md (tokens/inputs)]
- [Source: src/features/criador-plano/components/CriadorWizard.tsx, src/features/plano/actions.ts (createPlanoCorporativo)]
- [Source: src/app/globals.css (bloco de aliases legados a remover) — dívida do review do Epic 1]
- [Source: src/components/ui/input.tsx, label.tsx, button.tsx (padrão dos primitivos)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-18):**
- **`CriadorWizard` reescrito**: de acordeão → **um passo por vez** com "Passo N de M" + barra de progresso + `aria-live` anunciando "Passo N de M: {título}". Navegação Voltar/Próximo (`Button`), estado `WizardData` preservado entre passos (passo 0 trava Próximo sem empresa/ramo).
- **Migração total ao design system**: zero `var(--teal/--navy/--text-*)`, zero hex/`bg-blue-50`/`bg-gray-100`. Campos via `Input`/`Textarea`/`Label`; botões via `Button`; ícones lucide; estados loading/done/error tokenizados (`text-primary`/`text-status-no-prazo`/`text-destructive`). Dark-safe.
- **Novo primitivo `ui/textarea.tsx`** (tokenizado, espelha `input.tsx`).
- **Dívida quitada**: removido o bloco de "Aliases legados" do `globals.css` (`--teal/--navy/--gold/--bg/--text-*`) — grep confirmou zero consumidores (CriadorWizard era o último; KRPanel já migrou na 2.3).
- **Preservado**: `fetchAI`/`/api/ai/*`, sugestões por campo (polimento é 3.3), `createPlanoCorporativo` (mesmos campos/fallbacks/redirect).
- **Verificação:** `pnpm typecheck` ✓ · `pnpm test` 181/181 ✓ · `pnpm lint` exit 0 · `pnpm build` ✓.

### Change Log
- 2026-06-18 — Story 3.2: CriadorWizard reescrito (passos + "Passo N de M" + aria-live, tokens/Base UI, dark); novo Textarea; aliases legados removidos do globals.css. typecheck/test/lint/build verdes.

### File List
- `src/components/ui/textarea.tsx` (NEW) — primitivo Textarea tokenizado.
- `src/features/criador-plano/components/CriadorWizard.tsx` (REWRITTEN) — wizard em passos, design system, a11y.
- `src/app/globals.css` (MODIFIED) — removido o bloco de aliases legados (dívida quitada).
