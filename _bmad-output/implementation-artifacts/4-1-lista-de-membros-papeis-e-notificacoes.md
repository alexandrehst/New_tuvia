---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 4.1: Lista de membros, papéis e notificações

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a administrador do cliente,
I want listar membros e gerir papéis e notificações,
so that eu controle quem acessa e como é notificado.

> Primeira story do Epic 4. A página `/usuarios` hoje é placeholder.

## Acceptance Criteria

1. Em `(app)/usuarios`, vejo a **lista de membros do cliente** com seus **papéis (`PapelPlano`) por plano** (FR-29).
2. Posso **editar o papel inline** (por vínculo plano-usuário) e as **preferências de notificação** (e-mail de plano/objetivo/resultado), com **feedback de sucesso** (FR-29/30).
3. **Estados vazio e carregando** desenhados (FR-30, UX-DR17) — `loading.tsx` (skeleton) + empty state.
4. Posso **remover um usuário de um plano** com **confirmação** (`ConfirmDialog`).
5. **Actions testadas** (gate 90%): `updatePapel`, `updateNotificacao`, `removerMembroDoPlano`; query `getMembros` testada.
6. **Sem regressão / transversais**: `pnpm typecheck/lint/test/build` passam; pt-BR; dark; Base UI; a11y (labels, switches, confirm).

## Tasks / Subtasks

- [x] **Task 1 — Query `getMembros` + teste** (AC: 1, 5) — `src/features/usuarios/queries.ts` (+ `__tests__/queries.test.ts`)
  - [x] `getMembros(clienteId)`: `user.findMany({ where:{clienteId}, select:{ id, nome, email, tipoUser, statusUser, atualizacaoEmailPlano, atualizacaoEmailObjetivo, atualizacaoEmailResultado, planosUsuario: { select:{ id, papel, plano:{select:{id,titulo}} } } }, orderBy:{nome:'asc'} })`. Teste: mock prisma, where/select/orderBy.
- [x] **Task 2 — Schemas + actions + testes** (AC: 2, 4, 5) — `src/features/usuarios/schemas.ts`, `actions.ts` (+ `__tests__/actions.test.ts`)
  - [x] `papelSchema = z.enum(['owner','editor','viewer'])`; `notificacaoCampoSchema = z.enum(['plano','objetivo','resultado'])`.
  - [x] `updatePapel(planoUsuarioId, papel)`: parse papel → `planoUsuario.update`. `updateNotificacao(userId, campo, valor: boolean)`: parse campo → mapeia para `atualizacaoEmail{Plano|Objetivo|Resultado}` → `user.update`. `removerMembroDoPlano(planoUsuarioId)`: `planoUsuario.delete`.
  - [x] Testes: cada action (mock prisma; verifica args + validação de enum).
- [x] **Task 3 — Primitivo `Switch`** (AC: 2, 6) — novo `src/components/ui/switch.tsx`
  - [x] Base UI `@base-ui/react/switch` (Root + Thumb), tokenizado (on = `bg-primary`), dark-safe, acessível.
- [x] **Task 4 — `MembrosList` (client)** (AC: 1, 2, 4) — novo `src/features/usuarios/components/MembrosList.tsx`
  - [x] Card por membro: nome/email + badge de `tipoUser`/`statusUser`. **Notificações**: 3 `Switch` (Plano/Objetivo/Resultado) com estado local + `useTransition` → `updateNotificacao` + `router.refresh()`; `aria-live` de sucesso. **Planos**: por vínculo, `plano.titulo` + `<select>` de papel (tokenizado) → `updatePapel`; botão remover (`Trash2`) → `ConfirmDialog` → `removerMembroDoPlano` + `router.refresh()`. Empty state quando sem membros.
- [x] **Task 5 — Página + loading** (AC: 1, 3) — `src/app/(app)/usuarios/page.tsx` + `src/app/(app)/usuarios/loading.tsx`
  - [x] `page.tsx` (Server Component): auth (Supabase + prisma.user → clienteId), `getMembros`, render `MembrosList` (tokenizado; remover o placeholder/`text-gray-*`). `loading.tsx`: skeletons de cards.
- [x] **Task 6 — Validação** (AC: 6) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Dev Notes

### Estado atual (LER)
- **`src/app/(app)/usuarios/page.tsx`**: placeholder ("Gestão de usuários em breve") com `text-gray-900/500` hardcoded — **substituir** e tokenizar.
- **`src/features/usuarios/queries.ts`**: tem `getClienteUsuarios` (id/nome/email, p/ seletor de responsáveis — Story 2.4). **Adicionar `getMembros`** (mais rico). Não quebrar `getClienteUsuarios`.
- **Sem `features/usuarios/actions.ts`** — criar.
- **Schema:** `User { tipoUser: TipoUser, statusUser: StatusUser, atualizacaoEmailPlano/Objetivo/Resultado: Boolean, clienteId }`. `PlanoUsuario { id, planoId, userId, papel: PapelPlano(owner|editor|viewer), @@unique([planoId,userId]) }`. Remover vínculo = `planoUsuario.delete` (não apaga o User).
- **`ConfirmDialog`** (`src/components/confirm-dialog.tsx`, 2.5) reutilizável. **Avatar/Badge** já existem. Padrão de `<select>` tokenizado: ver `KRSheet`/`PlanoEditButton`. Padrão de auth na page: ver `planos/page.tsx`.
- **Base UI Switch** disponível (`@base-ui/react/switch`); criar `ui/switch.tsx`.

### Decisões / escopo
- **Gerir vínculos, não apagar usuários**: "remover usuário de um plano" = deletar o `PlanoUsuario`. Excluir o User em si está fora de escopo.
- Convidar membro = **4.2** (não nesta story).
- Feedback de sucesso: `router.refresh()` + região `aria-live` ("Alterações salvas"); sem lib de toast.
- Papel via `<select>` nativo tokenizado (consistente com o projeto; sem primitivo Select).

### Guardrails
- Lógica/validação em `features/usuarios` (gate — testar query + 3 actions). Componentes/página fora do gate.
- Base UI (sem asChild); tokens, sem hex/`text-gray-*`; dark; pt-BR. `parse` zod nas fronteiras das actions.

### Project Structure Notes
- NEW: `src/features/usuarios/schemas.ts`, `src/features/usuarios/actions.ts` (+ `__tests__/actions.test.ts`), `src/features/usuarios/components/MembrosList.tsx`, `src/components/ui/switch.tsx`, `src/app/(app)/usuarios/loading.tsx`.
- UPDATE: `src/features/usuarios/queries.ts` (+ teste), `src/app/(app)/usuarios/page.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4 / Story 4.1 (FR-29/30, UX-DR17)]
- [Source: prisma/schema.prisma — User (notificações/tipoUser), PlanoUsuario (papel), enum PapelPlano]
- [Source: src/features/usuarios/queries.ts (getClienteUsuarios), src/app/(app)/planos/page.tsx (auth pattern), src/components/confirm-dialog.tsx (2.5)]
- [Source: src/features/key-result/components/KRSheet.tsx (select tokenizado), src/components/ui/skeleton.tsx]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-19):**
- **`getMembros(clienteId)`** (query): membros + `planosUsuario` (papel + plano) + prefs de notificação. +1 teste.
- **Actions** (`features/usuarios/actions.ts` + schemas): `updatePapel` (planoUsuario.update), `updateNotificacao` (mapeia campo→coluna, user.update), `removerMembroDoPlano` (planoUsuario.delete). +6 testes (args + validação de enum) → **196 verdes**.
- **`ui/switch.tsx`** (NEW): Switch Base UI tokenizado (on=`bg-primary`), dark-safe.
- **`MembrosList`**: card por membro (avatar/nome/email + badge tipoUser/status); 3 `Switch` de notificação (estado local + `useTransition` → action); papel por vínculo via `<select>` tokenizado → `updatePapel`; remover do plano (Trash) → `ConfirmDialog` → `removerMembroDoPlano`. `router.refresh()` + `aria-live` "Alterações salvas". Empty state.
- **Página `/usuarios`** reescrita (auth Supabase + `getMembros`, tokenizada — removido placeholder/`text-gray-*`) + **`loading.tsx`** (skeletons).
- **Escopo:** remover = deletar vínculo (não o usuário); convidar = 4.2.
- **Verificação:** `pnpm typecheck` ✓ · `pnpm test` 196/196 ✓ · `pnpm lint` exit 0 · `pnpm build` ✓.

### Change Log
- 2026-06-19 — Story 4.1: getMembros + 3 actions (+7 testes); ui/switch; MembrosList (papel/notificação inline + remover c/ confirmação); página + loading. typecheck/test/lint/build verdes.

### File List
- `src/features/usuarios/queries.ts` (MODIFIED) — `getMembros`.
- `src/features/usuarios/__tests__/queries.test.ts` (MODIFIED) — teste getMembros.
- `src/features/usuarios/schemas.ts` (NEW) — papel/notificação enums.
- `src/features/usuarios/actions.ts` (NEW) — updatePapel/updateNotificacao/removerMembroDoPlano.
- `src/features/usuarios/__tests__/actions.test.ts` (NEW) — 6 testes.
- `src/components/ui/switch.tsx` (NEW) — primitivo Switch.
- `src/features/usuarios/components/MembrosList.tsx` (NEW) — lista de membros.
- `src/app/(app)/usuarios/page.tsx` (REWRITTEN) — página real (auth + getMembros).
- `src/app/(app)/usuarios/loading.tsx` (NEW) — skeleton de carregamento.
