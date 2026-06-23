---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 5.2: Login e reset de senha

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a usuário,
I want telas de login e reset limpas e com feedback claro,
so that eu acesse minha conta sem fricção.

> Reskin das telas `(auth)/login` e `(auth)/reset-senha` (já existem, com `useActionState`). Unifica o shell de auth (também serve a 5.3).

## Acceptance Criteria

1. `/login` e `/reset-senha` num **cartão centrado sobre fundo `brand-tint`**, padrão `useActionState`. (FR-8, UX-DR15)
2. **Erros de validação inline** sem navegar nem perder os dados já digitados. (FR-8)
3. Os **três estados** — carregando (botão desabilitado + indicador), erro e sucesso/redirecionamento — visíveis e consistentes entre as telas. (FR-9)
4. Tudo via **tokens** (sem `bg-green-*`/`bg-muted/30` hardcoded); paridade dark; marca consistente com a landing ("OKR", não "Tuvia OKR").
5. **Sem regressão**: actions `signIn`/`resetPassword` intactas; `pnpm typecheck/lint/test/build` passam.

## Tasks / Subtasks

- [x] **Task 1 — Shell de auth** (AC: 1, 4) — `src/app/(auth)/layout.tsx`
  - [x] Centralizar conteúdo numa coluna sobre `bg-brand-tint/40`, com **wordmark "OKR"** (link para `/`) acima e `max-w-sm` para o cartão. Serve login/reset/cadastro.
- [x] **Task 2 — Login em cartão** (AC: 1, 2, 3, 4) — `src/app/(auth)/login/page.tsx`
  - [x] Remover o split layout + ilustração "Tuvia OKR". Renderizar um `Card` (título "Entrar" + descrição) com o form (email/senha, links "Esqueci a senha"/"Criar conta", botão full-width com estado `isPending`). Manter `useActionState(signIn)` e o alerta de erro inline (tokenizado).
- [x] **Task 3 — Reset tokenizado** (AC: 1, 3, 4) — `src/app/(auth)/reset-senha/page.tsx`
  - [x] Remover o wrapper próprio (`bg-muted/30`) — o shell já centra. Manter o `Card` + `useActionState(resetPassword)`. Trocar o sucesso `bg-green-50 text-green-800` por tokens (`bg-status-no-prazo-bg text-status-no-prazo`). Estados carregando/erro/sucesso consistentes com o login.
- [x] **Task 4 — Validação** (AC: 5) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Dev Notes

### Estado atual (LER)
- **`(auth)/layout.tsx`**: passthrough (`<>{children}</>`). Transformar no shell centrado em `brand-tint` + wordmark.
- **`(auth)/login/page.tsx`**: `'use client'`, `useActionState(signIn, null)`, Input/Label/Button, erro inline tokenizado, `isPending`. **Mas** usa **split layout** (form à esquerda + painel `bg-primary` à direita com SVG e **"Tuvia OKR"**). Converter para `Card` centrado; remover a ilustração/branding divergente.
- **`(auth)/reset-senha/page.tsx`**: já é `Card` centrado com `useActionState(resetPassword)`, erro inline, **estado de sucesso** — mas no wrapper `bg-muted/30` e com sucesso em **verde hardcoded** (`bg-green-50 text-green-800 border-green-200`). Remover wrapper (shell cobre) e tokenizar o sucesso.
- **Actions** (`features/auth/actions.ts`): `signIn` (redireciona no sucesso) e `resetPassword` (retorna `{success}`/`{error}`) — **não alterar**. `signOut` também lá (1.3).
- **Tokens**: `brand-tint` (auth/marketing), `status-no-prazo`/`-bg` (verde dark-safe), `destructive`. Card/Input/Label/Button já tokenizados.

### Decisões / escopo
- **Cartão centrado** para ambos (AC1) — abandona o split do login. Consistência > ilustração.
- Login redireciona no sucesso (estado "sucesso" = navegação para o painel) — manter; o indicador de "carregando" cobre a transição. Reset tem sucesso explícito (e-mail enviado).
- Sem lógica nova testável (só apresentação) → gate inalterado.

### Guardrails
- `useActionState` preserva o form sem navegar em erro (dados mantidos). Base UI; tokens, sem hex/cores hardcoded; dark; pt-BR. Não tocar nas actions.

### Project Structure Notes
- UPDATE: `src/app/(auth)/layout.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/reset-senha/page.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5 / Story 5.2 (FR-8/9, UX-DR15)]
- [Source: src/app/(auth)/login/page.tsx, reset-senha/page.tsx, layout.tsx; src/features/auth/actions.ts (signIn/resetPassword)]
- [Source: src/app/globals.css (brand-tint, status tokens), src/components/ui/card.tsx/input.tsx/button.tsx]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-19):**
- **`(auth)/layout.tsx`**: shell de auth — coluna centrada sobre `bg-brand-tint/40` + wordmark "OKR" (link p/ `/`) + `max-w-sm`. Serve login/reset/cadastro.
- **`login/page.tsx`**: split layout + ilustração "Tuvia OKR" removidos → `Card` centrado (título "Entrar"), mantendo `useActionState(signIn)`, erro inline tokenizado, links e botão full-width com `isPending`.
- **`reset-senha/page.tsx`**: wrapper próprio (`bg-muted/30`) removido (shell cobre); sucesso re-tokenizado (`bg-status-no-prazo-bg text-status-no-prazo`, dark-safe). Estados carregando/erro/sucesso consistentes com o login.
- **Sem mudança** nas actions `signIn`/`resetPassword`.
- **Verificação:** `pnpm typecheck` ✓ · `pnpm lint` exit 0 · `pnpm build` ✓ · testes mantidos.

### Change Log
- 2026-06-19 — Story 5.2: shell de auth (brand-tint + wordmark); login em cartão centrado (remove split/"Tuvia OKR"); reset tokenizado. typecheck/lint/build verdes.

### File List
- `src/app/(auth)/layout.tsx` (MODIFIED) — shell de auth (brand-tint + wordmark).
- `src/app/(auth)/login/page.tsx` (REWRITTEN) — login em cartão centrado.
- `src/app/(auth)/reset-senha/page.tsx` (MODIFIED) — remove wrapper, tokeniza sucesso.
