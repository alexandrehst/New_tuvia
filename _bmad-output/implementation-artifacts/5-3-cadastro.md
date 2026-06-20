---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 5.3: Cadastro

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a novo usuário,
I want criar minha conta numa tela clara,
so that eu comece a usar o produto.

> Última story do Epic 5 (e do redesenho). Reskin de `(auth)/cadastro` no padrão das outras telas de auth (5.2).

## Acceptance Criteria

1. `/cadastro` segue o **mesmo padrão de cartão centrado** (shell de auth em `brand-tint`) e os **estados FR-8/FR-9** (carregando/erro), via `useActionState(signUp)`. (FR-8/9, UX-DR15)
2. Ao criar a conta, o **e-mail de boas-vindas (Brevo) é disparado como hoje (não-fatal)** e o usuário é levado ao app — **comportamento preservado** (action `signUp` inalterada).
3. **Reutiliza os mesmos componentes** de formulário (`Card`/`Input`/`Label`/`Button`) das outras telas. (FR-9)
4. **Sem regressão / transversais**: `pnpm typecheck/lint/test/build` passam; pt-BR; dark; tokens (sem hex/branding divergente).

## Tasks / Subtasks

- [x] **Task 1 — Cadastro em cartão** (AC: 1, 3, 4) — `src/app/(auth)/cadastro/page.tsx`
  - [x] Remover o split layout + ilustração "Tuvia OKR". Renderizar um `Card` (título "Criar conta" + descrição com link "Entrar") com o form (nome/email/senha, botão full-width com `isPending`) e o alerta de erro inline tokenizado. Manter `useActionState(signUp, null)`.
- [x] **Task 2 — Validação** (AC: 4) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Dev Notes

### Estado atual (LER)
- **`(auth)/cadastro/page.tsx`**: `'use client'`, `useActionState(signUp, null)`, Input/Label/Button, erro inline tokenizado, `isPending` — **mas** usa o mesmo **split layout + "Tuvia OKR"** do login antigo. Converter para `Card` centrado (idêntico ao login da 5.2).
- **`(auth)/layout.tsx`** (5.2): já provê o shell centrado em `brand-tint` + wordmark — o cadastro só renderiza o `Card`.
- **`signUp`** (`features/auth/actions.ts`): cria a conta, dispara e-mail de boas-vindas (Brevo, não-fatal) e leva ao app — **não alterar**.
- Padrão alvo: ver `login/page.tsx` reescrito na 5.2.

### Guardrails / escopo
- Só apresentação (sem lógica nova testável → gate inalterado). Não tocar no `signUp`. Base UI; tokens, sem hex/"Tuvia OKR"; dark; pt-BR.

### Project Structure Notes
- UPDATE: `src/app/(auth)/cadastro/page.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5 / Story 5.3 (FR-8/9)]
- [Source: src/app/(auth)/cadastro/page.tsx, src/app/(auth)/login/page.tsx (padrão 5.2), src/features/auth/actions.ts (signUp)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-19):** `cadastro/page.tsx` reescrito — split + "Tuvia OKR" removidos → `Card` centrado no shell de auth (5.2), com nome/email/senha, erro inline tokenizado e `isPending`. `useActionState(signUp)` e o e-mail de boas-vindas (não-fatal) preservados. typecheck ✓ · lint exit 0 · build ✓ · testes mantidos.

### Change Log
- 2026-06-19 — Story 5.3: cadastro em cartão centrado (reuso dos componentes de auth). **Fecha o Epic 5 e o redesenho.**

### File List
- `src/app/(auth)/cadastro/page.tsx` (REWRITTEN) — cadastro em cartão.
