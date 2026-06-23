---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 4.2: Convidar membro

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a administrador do cliente,
I want convidar um novo membro por e-mail,
so that minha equipe entre no workspace.

> Última story do Epic 4. Reusa a página `/usuarios` (4.1) e `lib/brevo`.

## Acceptance Criteria

1. Na tela de usuários, informo um e-mail e envio o convite → a action **`inviteUser`** cria o membro (`statusUser: pendente`, `temConvite: true`) e dispara o e-mail (template `CONVITE`); vejo feedback **"Convite enviado"**. (FR-29/30)
2. **Erros de validação inline**: e-mail inválido e e-mail **duplicado** (já membro) aparecem associados ao campo. (FR-30)
3. **Falha de e-mail é não-fatal**: o convidado é criado mesmo se o envio falhar; vejo mensagem apropriada ("Convite criado, mas o e-mail não pôde ser enviado."). (NFR — paridade com a cadeia de KR)
4. **Action testada** (gate 90%): sucesso, duplicado, e-mail inválido, falha de e-mail (não-fatal).
5. **Sem regressão / transversais**: `pnpm typecheck/lint/test/build` passam; pt-BR; dark; Base UI; a11y.

## Tasks / Subtasks

- [x] **Task 1 — Schema + `inviteUser` + teste** (AC: 1, 2, 3, 4) — `src/features/usuarios/schemas.ts`, `actions.ts` (+ `__tests__/actions.test.ts`)
  - [x] `inviteUserSchema = z.object({ email: z.string().email(), nome: z.string().optional() })`.
  - [x] `inviteUser(clienteId, data)` → resultado discriminado `{ ok: true; emailEnviado: boolean } | { ok: false; erro: string }`:
    - `safeParse` → e-mail inválido ⇒ `{ ok:false, erro:'E-mail inválido' }`.
    - `user.findUnique({ where:{ email } })` existente ⇒ `{ ok:false, erro:'Este e-mail já é membro' }`.
    - senão `user.create({ data: { clienteId, email, nome: nome||local-part, statusUser:'pendente', temConvite:true } })`; `try { sendEmail({ templateId: TEMPLATES.CONVITE, ... }) } catch {}` (não-fatal); retorna `{ ok:true, emailEnviado }`.
  - [x] Testes: sucesso (create + sendEmail + ok/emailEnviado true), duplicado (sem create), e-mail inválido, falha de e-mail (ok:true, emailEnviado:false, user criado).
- [x] **Task 2 — `ConvidarMembroButton` (client)** (AC: 1, 2, 3, 5) — novo `src/features/usuarios/components/ConvidarMembroButton.tsx`
  - [x] Botão "Convidar membro" (lucide `UserPlus`) + `Sheet` com e-mail (+ nome opcional). `useTransition`; chama `inviteUser`; em `ok:false` mostra `erro` inline (`role="alert"`); em `ok:true` mostra "Convite enviado" (ou aviso de e-mail não enviado) + `router.refresh()` e fecha após sucesso.
- [x] **Task 3 — Ligar na página** (AC: 1) — `src/app/(app)/usuarios/page.tsx`
  - [x] `ConvidarMembroButton clienteId={user.clienteId}` no cabeçalho (ao lado do título).
- [x] **Task 4 — Validação** (AC: 5) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Dev Notes

### Fatos verificados
- **`lib/brevo`**: `sendEmail(payload)` + `TEMPLATES.CONVITE = 5`. Padrão de envio não-fatal: ver `updateKeyResultValor` (try/catch que não derruba a operação).
- **`User`**: `email @unique`, `nome` (NOT NULL), `tipoUser default membro`, `statusUser default pendente`, `temConvite default false`, `clienteId`. Convite cria o User em `pendente`/`temConvite=true`. `nome` é obrigatório → derivar do local-part do e-mail se não informado.
- **`features/usuarios/actions.ts`** (4.1) já existe ('use server'); **adicionar** `inviteUser`. `schemas.ts` já existe; adicionar `inviteUserSchema`.
- **Página `/usuarios`** (4.1): Server Component com `user.clienteId`; `MembrosList`. Adicionar o trigger de convite no cabeçalho.
- Padrão de Sheet/form com resultado inline: ver `KRSheet`/`PlanoApoioButton`.

### Decisões / escopo
- **Resultado discriminado** (não throw) para erros de negócio (duplicado/inválido) → UI mostra inline. zod via `safeParse`.
- **`nome` opcional no form** (AC pede só e-mail); deriva do local-part se vazio.
- Aceitação do convite / fluxo de signup do convidado está fora desta story (cria o registro pendente + e-mail; o onboarding do convidado é do Epic 5/auth).

### Guardrails
- Action/schema em `features/usuarios` (gate — testar `inviteUser`). Componente fora do gate.
- E-mail não-fatal (try/catch); nunca derruba a criação. Base UI, tokens, dark, pt-BR.

### Project Structure Notes
- NEW: `src/features/usuarios/components/ConvidarMembroButton.tsx`.
- UPDATE: `src/features/usuarios/schemas.ts`, `actions.ts` (+ `__tests__/actions.test.ts`), `src/app/(app)/usuarios/page.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4 / Story 4.2 (FR-29/30)]
- [Source: src/lib/brevo.ts (sendEmail, TEMPLATES.CONVITE), src/features/key-result/actions.ts (envio não-fatal)]
- [Source: prisma/schema.prisma — User (email unique, statusUser, temConvite)]
- [Source: src/features/usuarios/actions.ts + schemas.ts (4.1), src/features/plano/components/PlanoApoioButton.tsx (padrão Sheet+resultado)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-19):**
- **`inviteUserSchema`** + **`inviteUser(clienteId, data)`**: resultado discriminado `{ok:true,emailEnviado}` | `{ok:false,erro}`. safeParse (e-mail inválido), checa duplicado (`user.findUnique`), cria `user` (pendente, temConvite), envia `TEMPLATES.CONVITE` em try/catch **não-fatal**; nome deriva do local-part se vazio. +5 testes (sucesso, derivação de nome, inválido, duplicado, falha de e-mail) → **201 verdes**.
- **`ConvidarMembroButton`**: botão "Convidar membro" + `Sheet` (e-mail + nome opcional); erro inline (`role="alert"`) para inválido/duplicado; sucesso (`role="status"`) "Convite enviado" / aviso de e-mail não enviado; `router.refresh()`.
- **Página `/usuarios`**: trigger no cabeçalho (ao lado do título).
- **Escopo:** cria registro pendente + e-mail; onboarding do convidado fica para auth/Epic 5.
- **Verificação:** `pnpm typecheck` ✓ · `pnpm test` 201/201 ✓ · `pnpm lint` exit 0 · `pnpm build` ✓.

### Change Log
- 2026-06-19 — Story 4.2: inviteUser (resultado discriminado, e-mail não-fatal, +5 testes); ConvidarMembroButton; trigger na página. typecheck/test/lint/build verdes. **Fecha o Epic 4.**

### File List
- `src/features/usuarios/schemas.ts` (MODIFIED) — `inviteUserSchema`.
- `src/features/usuarios/actions.ts` (MODIFIED) — `inviteUser`.
- `src/features/usuarios/__tests__/actions.test.ts` (MODIFIED) — 5 testes.
- `src/features/usuarios/components/ConvidarMembroButton.tsx` (NEW) — trigger + painel de convite.
- `src/app/(app)/usuarios/page.tsx` (MODIFIED) — liga o ConvidarMembroButton.
