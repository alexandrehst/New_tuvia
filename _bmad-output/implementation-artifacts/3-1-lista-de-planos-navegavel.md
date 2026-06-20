---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 3.1: Lista de planos navegável

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a usuário,
I want ver meus planos como cartões e abrir cada um,
so that eu acesse o acompanhamento rapidamente e crie novos planos.

> Primeira story do Epic 3. A lista e o card já existem (brownfield) — esta story **alinha ao novo design system** (tokens/dark + fonte única de status de plano) e confirma os ACs.

## Acceptance Criteria

1. Em `(app)/planos`, os planos aparecem como **cartões navegáveis** (não árvore inline); clicar abre `(app)/planos/[id]`. (FR-10/11) — *já existe; manter.*
2. **Sem planos**: estado vazio "Nenhum plano ainda. Crie o primeiro." + CTA que leva ao wizard. (FR-12, UX-DR17)
3. **Ação primária de criar plano sempre acessível** no cabeçalho (leva a `/criador`). (FR-13) — *já existe; manter.*
4. **Status do plano tokenizado** (fonte única, dark-safe): `PlanoCard` deixa de usar cores hardcoded (`bg-green-100 text-green-800`) e passa a consumir `features/plano/lib/status.ts` (label + classes por `StatusPlano = edicao|publicado|arquivado`). Testado (gate 90%).
5. **Sem regressão / escopo**: não mexer no wizard (3.2/3.3) nem em publicar (3.4); navegação/CTA intactos. `pnpm typecheck/lint/test/build` passam.
6. **Transversais**: paridade dark; pt-BR; a11y (cartão é link com rótulo claro); Base UI.

## Tasks / Subtasks

- [x] **Task 1 — Fonte única de status de plano + teste** (AC: 4) — novo `src/features/plano/lib/status.ts` + `__tests__/status.test.ts`
  - [x] `export type StatusPlano = 'edicao' | 'publicado' | 'arquivado'`; `PLANO_STATUS_LABELS` { edicao:'Edição', publicado:'Publicado', arquivado:'Arquivado' }; `planoStatusLabel(s)` (fallback `String(s)`); `planoStatusBadgeClasses(s)` → classes de token (publicado = `bg-status-no-prazo-bg text-status-no-prazo`; edicao/arquivado = `bg-muted text-muted-foreground`). Fallback seguro para status desconhecido.
  - [x] Teste: labels, classes por status, e fallback de status desconhecido. (Espelha o padrão de `features/key-result/lib/status.ts`.)
- [x] **Task 2 — `PlanoCard` consome a fonte única** (AC: 1, 4, 6) — `src/features/plano/components/PlanoCard.tsx`
  - [x] Remover `statusConfig` hardcoded; usar `planoStatusLabel`/`planoStatusBadgeClasses`. `Badge` com `className` tokenizado (uma forma só, sem o branch `'className' in status`). Manter título, dataFim e contagem de objetivos. Hover/transição com tokens.
- [x] **Task 3 — Estado vazio e cabeçalho** (AC: 2, 3) — `src/app/(app)/planos/page.tsx`
  - [x] Alinhar a cópia do estado vazio a "Nenhum plano ainda. Crie o primeiro." + CTA para `/criador`. Confirmar o botão primário "Novo plano" no cabeçalho. Tokens (sem cor hardcoded).
- [x] **Task 4 — Validação** (AC: 5) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Dev Notes

### Estado atual (LER)
- **`src/app/(app)/planos/page.tsx`**: Server Component; auth via Supabase + `prisma.user`; `getPlanos(user.clienteId)`; cabeçalho "Bem-vindo(a), {nome}" + Button "Novo plano" (`render={<Link href="/criador"/>}`); grid de `PlanoCard`; estado vazio já presente (cópia "Ainda sem planos / Crie o seu primeiro plano estratégico" → **alinhar** à AC). Mantém `force-dynamic`.
- **`src/features/plano/components/PlanoCard.tsx`**: card com `Badge` de status; **problema**: `publicado` usa `bg-green-100 text-green-800` hardcoded (sem token, sem dark) + branch `'className' in status`. Refatorar para a fonte única. Card já é `<Link href="/planos/{id}">` com hover.
- **`getPlanos`** (`features/plano/queries.ts`): retorna os planos do cliente com `status`, `dataFim`, `_count.objetivos` (PlanoCard já consome). Não alterar a query nesta story.
- **`StatusPlano`** (enum no schema): `edicao | publicado | arquivado` (distinto do risco de KR `no_prazo|...`). Tokens de status existem em `globals.css` (`--status-no-prazo` verde, etc.) — reusar para `publicado`.

### Padrão a espelhar
- `features/key-result/lib/status.ts` (Story 2.1): `STATUS_LABELS` + `statusLabel` + `statusPillClasses` com fallback. Replicar a forma para `StatusPlano`. Esse é o "home" testável (gate) da lógica; o `PlanoCard`/página ficam fora do gate.

### Guardrails / escopo
- Só a lista/navegação + tokenização. **Não** tocar `/criador` (wizard = 3.2/3.3) nem publicar (3.4). **Não** alterar `getPlanos`.
- Base UI (sem asChild — Button já usa `render`); tokens, sem hex/cores hardcoded; dark paridade.
- Lógica em `features/plano/lib/status.ts` (gate — testar); `PlanoCard`/página fora do gate.

### Dívida relacionada (NÃO nesta story)
- `CriadorWizard` ainda usa tokens legados (aliases em globals.css) — migrar quando o wizard entrar (3.2/3.3).

### Project Structure Notes
- NEW: `src/features/plano/lib/status.ts` (+ `__tests__/status.test.ts`).
- UPDATE: `src/features/plano/components/PlanoCard.tsx`, `src/app/(app)/planos/page.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3 / Story 3.1 (FR-10/11/12/13, UX-DR17)]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/EXPERIENCE.md (lista de planos, estado vazio) + DESIGN.md (tokens/badges)]
- [Source: src/app/(app)/planos/page.tsx, src/features/plano/components/PlanoCard.tsx, src/features/plano/queries.ts (getPlanos)]
- [Source: src/features/key-result/lib/status.ts (padrão de fonte única de status) — Story 2.1]
- [Source: prisma/schema.prisma — enum StatusPlano]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-18):**
- **`features/plano/lib/status.ts`** (NEW): fonte única do status de plano — `planoStatusLabel` + `planoStatusBadgeClasses` (publicado → token de sucesso `bg-status-no-prazo-bg`; edicao/arquivado → muted; fallback seguro). 5 testes → **181 verdes**.
- **`PlanoCard`**: removido `statusConfig` hardcoded (`bg-green-100 text-green-800`) e o branch `'className' in status`; agora consome a fonte única (tokenizado, dark-safe).
- **Página `/planos`**: estado vazio alinhado à AC ("Nenhum plano ainda" / "Crie o primeiro plano estratégico"); CTA "Novo plano" e navegação dos cartões mantidos.
- **Escopo:** lista/navegação + tokenização; wizard (3.2/3.3) e publicar (3.4) intactos; `getPlanos` não alterado.
- **Verificação:** `pnpm typecheck` ✓ · `pnpm test` 181/181 ✓ · `pnpm lint` exit 0 · `pnpm build` ✓.

### Change Log
- 2026-06-18 — Story 3.1: fonte única de status de plano (+5 testes); PlanoCard tokenizado/dark-safe; estado vazio alinhado. typecheck/test/lint/build verdes.

### File List
- `src/features/plano/lib/status.ts` (NEW) — fonte única do status de plano.
- `src/features/plano/lib/__tests__/status.test.ts` (NEW) — testes.
- `src/features/plano/components/PlanoCard.tsx` (MODIFIED) — consome a fonte única.
- `src/app/(app)/planos/page.tsx` (MODIFIED) — cópia do estado vazio alinhada à AC.
