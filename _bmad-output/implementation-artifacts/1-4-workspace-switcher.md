---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 1.4: Workspace switcher (identidade do tenant)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a usuário,
I want ver o nome real da minha organização (tenant) no topo da sidebar,
so that eu tenha certeza de em qual workspace estou operando.

> **Escopo ajustado pela realidade do modelo de dados (ver Dev Notes):** o schema define `User.clienteId` único e obrigatório — **um usuário pertence a exatamente um `Cliente`**. Não existe multi-membership, logo **não há troca de workspace**. Esta story entrega a **identidade correta do tenant** (substituindo o hack que deriva o nome do domínio do e-mail), não um seletor com múltiplos destinos. O FR-2 ("se pertence a mais de um cliente, permite trocar") fica como capacidade futura, condicionada a uma mudança de modelo.

## Acceptance Criteria

1. **Nome real do tenant**: o cabeçalho da sidebar exibe o `Cliente.nome` real do usuário (não mais `email.split('@')[1]` ). (FR-2)
2. **Dado disponível na fonte**: `getSidebarData` passa a retornar o nome do `Cliente` do usuário (via relação `user.cliente.nome`), mantendo o que já retorna.
3. **Inicial/avatar coerente**: a inicial mostrada no avatar do workspace deriva do `Cliente.nome` (não do e-mail).
4. **Sem troca (estado honesto)**: o cabeçalho é uma identidade estática (sem dropdown de troca), já que não há outros workspaces. Não introduzir affordance de troca que não faz nada.
5. **Sem regressão**: `pnpm typecheck`, `pnpm lint`, `pnpm test` (incl. teste atualizado de `getSidebarData`), `pnpm build` passam.
6. **Transversais**: tokens do design system; paridade dark; pt-BR; a11y (o bloco de identidade não é botão interativo enganoso).

## Tasks / Subtasks

- [x] **Task 1 — Estender `getSidebarData`** (AC: 2) — `src/features/plano/queries.ts`
  - [x] No `prisma.user.findUnique`, incluir o nome do cliente: `select: { id, nome, email, clienteId, cliente: { select: { nome: true } } }` (ou equivalente). Manter o retorno `{ user, planos }` compatível.
  - [x] Atualizar o teste em `src/features/plano/__tests__/queries.test.ts` para refletir o novo select/retorno (mock do `cliente.nome`).
- [x] **Task 2 — Passar o nome do cliente ao shell** (AC: 1, 3) — `src/app/(app)/layout.tsx`
  - [x] Extrair `clienteNome = sidebarData?.user?.cliente?.nome` e passar para `<AppSidebar clienteNome={...} userEmail={...} />`.
- [x] **Task 3 — Exibir identidade real na sidebar** (AC: 1, 3, 4) — `src/app/(app)/components/app-sidebar.tsx`
  - [x] Substituir `workspaceName` derivado do e-mail por `clienteNome` (fallback para e-mail se ausente). Inicial do avatar a partir do `clienteNome`.
  - [x] Manter o bloco como identidade estática (não-interativa); remover o comentário "workspace switcher (Story 1.4)" agora resolvido. Não adicionar dropdown de troca.
- [x] **Task 4 — Validação** (AC: 5) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`; visual: nome do tenant correto no topo da sidebar (claro/escuro).

## Dev Notes

### Descoberta de modelo (decisiva para o escopo)
- **`prisma/schema.prisma`**: `model User { clienteId String … cliente Cliente @relation(fields: [clienteId], references: [id]) … }` e `model Cliente { … usuarios User[] }`. Relação **1 Cliente : N Users**; cada User tem **um** `clienteId` obrigatório. **Não há como um usuário pertencer a múltiplos clientes.** Portanto, seletor de troca é inaplicável até o modelo mudar. Multi-tenant aqui = isolamento por `clienteId`, não pertencimento múltiplo.

### Estado atual (LER)
- **`src/app/(app)/components/app-sidebar.tsx`** (UPDATE, da Story 1.3): cabeçalho usa `const workspaceName = userEmail.split('@')[1]?.split('.')[0] ?? userEmail` e `initials = userEmail[0]`. **É o hack a corrigir.** Recebe prop `userEmail`. Adicionar prop `clienteNome`.
- **`src/features/plano/queries.ts`** → `getSidebarData(email)`: hoje `select: { id, nome, email, clienteId }` e retorna `{ user, planos }`. **Adicionar `cliente: { select: { nome: true } }`** ao select. (Prisma: relação `cliente` existe no model User.)
- **`src/app/(app)/layout.tsx`** (UPDATE, da Story 1.3): já chama `getSidebarData` e passa `userEmail`/`nome`. Adicionar `clienteNome`.

### Testes
- **`getSidebarData` é lógica de `features/**`** → o teste em `src/features/plano/__tests__/queries.test.ts` deve refletir o novo `select`/retorno (mockar `prisma.user.findUnique` retornando `cliente: { nome }`). Gate de 90% se aplica. Verificar `vi.clearAllMocks()` e padrão de mock já usados no arquivo.
- Sidebar/layout em `src/app/**` → fora do gate; verificação por build/typecheck/visual.

### Guardrails / escopo
- **NÃO** criar dropdown/seletor de troca (sem destinos — seria affordance falsa).
- **NÃO** alterar o schema nem a relação (fora de escopo; multi-membership é trabalho futuro).
- Reutilizar `Avatar`/`AvatarFallback` já no cabeçalho. Tokens do design system; Base UI (render prop).
- Manter `getSidebarData` retornando `planos` (mesmo que a sidebar não use mais; outras partes podem usar — não quebrar a assinatura).

### Project Structure Notes
- UPDATE: `src/features/plano/queries.ts`, `src/features/plano/__tests__/queries.test.ts`, `src/app/(app)/layout.tsx`, `src/app/(app)/components/app-sidebar.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1 / Story 1.4 (FR-2)]
- [Source: _bmad-output/planning-artifacts/prds/prd-okr-2026-06-18/prd.md#FR-2 (workspace switcher)]
- [Source: prisma/schema.prisma — model User (clienteId único), model Cliente]
- [Source: src/features/plano/queries.ts#getSidebarData, src/app/(app)/components/app-sidebar.tsx, src/app/(app)/layout.tsx (estado atual)]
- [Source: _bmad-output/implementation-artifacts/1-3-shell-autenticado.md — cabeçalho de workspace como ponto de extensão]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-18):** escopo confirmado pelo usuário — identidade do tenant (sem seletor de troca; modelo tem 1 Cliente/usuário).
- **`getSidebarData`** estendida: select do usuário agora inclui `cliente: { select: { nome: true } }`. Retorno `{ user, planos }` preservado (compatível). **3 testes novos** em `queries.test.ts` (select do cliente, retorno com `cliente.nome`+planos, null quando user inexistente). **151 testes verdes** (era 148).
- **`layout.tsx`**: extrai `clienteNome = sidebarData?.user?.cliente?.nome` e passa para `AppSidebar`.
- **`AppSidebar`**: prop `clienteNome`; cabeçalho usa o nome real do Cliente (fallback e-mail); inicial derivada do Cliente; removido `capitalize` (não distorcer nomes próprios) + `truncate`. Bloco segue estático (sem dropdown de troca).
- **Verificação:** `pnpm typecheck` ✓ · `pnpm test` 151/151 ✓ · `pnpm lint` exit 0 (2 warnings pré-existentes) · `pnpm build` ✓.

### Change Log
- 2026-06-18 — Story 1.4 implementada: getSidebarData traz cliente.nome (+3 testes); sidebar exibe a identidade real do tenant. Sem seletor de troca (modelo 1 Cliente/usuário). typecheck/test/lint/build verdes.

### File List
- `src/features/plano/queries.ts` (MODIFIED) — `getSidebarData` inclui `cliente.nome`.
- `src/features/plano/__tests__/queries.test.ts` (MODIFIED) — mock `user.findUnique` + 3 testes de `getSidebarData`.
- `src/app/(app)/layout.tsx` (MODIFIED) — passa `clienteNome` à sidebar.
- `src/app/(app)/components/app-sidebar.tsx` (MODIFIED) — exibe nome real do Cliente; remove hack do e-mail.
