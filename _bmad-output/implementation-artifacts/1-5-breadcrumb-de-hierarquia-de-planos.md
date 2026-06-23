---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 1.5: Breadcrumb de hierarquia de planos

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a usuário navegando entre planos corporativo e de apoio,
I want um breadcrumb que mostre a hierarquia no topo do plano,
so that eu entenda onde estou (e suba de nível) sem uma árvore aninhada.

## Acceptance Criteria

1. **Plano de apoio** (`planoPaiId != null`): o breadcrumb mostra **`Planos › {Plano corporativo} › {Plano atual}`**, com "Planos" (→ `/planos`) e o corporativo (→ `/planos/{paiId}`) clicáveis; o atual é o item final (não-link). (FR-5)
2. **Plano corporativo** (`planoPaiId == null`): o breadcrumb mostra **`Planos › {Plano atual}`** (sem nível intermediário). (FR-5)
3. **Componente reutilizável** `Breadcrumb` em `src/components/ui/breadcrumb.tsx` (padrão shadcn/Base UI, semântico: `nav`/`ol`/`li`, separador acessível), usando tokens do design system.
4. **Dado disponível**: `getPlanoWithObjetivos` passa a incluir `planoPai { id, titulo }` (sem 2ª query); retorno permanece compatível.
5. **Sem árvore**: nenhuma árvore aninhada introduzida; o breadcrumb substitui o header ad-hoc atual ("Todos os planos /").
6. **Topbar**: para `/planos/[id]` a topbar não duplica o título genérico "Plano" (o contexto passa a vir do breadcrumb da página).
7. **Sem regressão**: `pnpm typecheck`, `pnpm lint`, `pnpm test` (incl. teste atualizado de `getPlanoWithObjetivos`), `pnpm build` passam.
8. **Transversais**: tokens do design system; paridade dark; pt-BR; a11y — breadcrumb com `nav aria-label`, item atual com `aria-current="page"`, foco visível nos links.

## Tasks / Subtasks

- [x] **Task 1 — Componente `Breadcrumb`** (AC: 3, 8) — novo `src/components/ui/breadcrumb.tsx`
  - [x] Componentes: `Breadcrumb` (`nav` com `aria-label="breadcrumb"`), `BreadcrumbList` (`ol`), `BreadcrumbItem` (`li`), `BreadcrumbLink` (link estilizado — usar `useRender` do Base UI como em `badge.tsx`, default `<a>`, para aceitar `render={<Link/>}`), `BreadcrumbPage` (`span` do item atual, `aria-current="page"`), `BreadcrumbSeparator` (`›`/chevron, `aria-hidden`). `cn()` + tokens (`text-muted-foreground`, hover `text-foreground`).
- [x] **Task 2 — Incluir `planoPai` na query** (AC: 4, 7) — `src/features/plano/queries.ts`
  - [x] Em `getPlanoWithObjetivos`, adicionar ao `include`: `planoPai: { select: { id: true, titulo: true } }`. Manter o resto.
  - [x] Atualizar `src/features/plano/__tests__/queries.test.ts`: asserir que o `include.planoPai` está presente no argumento de `findUnique` (gate 90%).
- [x] **Task 3 — Renderizar breadcrumb na página** (AC: 1, 2, 5) — `src/app/(app)/planos/[id]/page.tsx`
  - [x] Substituir o header ad-hoc (linhas ~74-80: Link "Todos os planos" + `/` + titulo) por `<Breadcrumb>` montado a partir de `plano.planoPai` e `plano.titulo`: itens `Planos` (→`/planos`), opcional `{planoPai.titulo}` (→`/planos/{planoPai.id}`), e `BreadcrumbPage` com o título atual. Manter o `<h1>` e o botão "Editar plano".
- [x] **Task 4 — Topbar sem título redundante** (AC: 6) — `src/app/(app)/components/topbar.tsx`
  - [x] No `titleFor`, retornar string vazia para `/planos/[id]` (a página mostra o breadcrumb). Não renderizar o `<h1>` quando o título for vazio.
- [x] **Task 5 — Validação** (AC: 7) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`; visual: abrir um plano corporativo (Planos › X) e um de apoio (Planos › Corp › Apoio), checar links e dark.

## Dev Notes

### Estado atual (LER)
- **`src/app/(app)/planos/[id]/page.tsx`** (UPDATE, Server Component): chama `getPlanoWithObjetivos(id)`. Header atual (≈ linhas 71-87): `<div>` com nav ad-hoc — `<Link href="/planos">Todos os planos</Link> / <span>{plano.titulo}</span>` — e `<h1>{plano.titulo}</h1>` + botão "Editar plano". **Substituir só o bloco do nav ad-hoc pelo `<Breadcrumb>`**; preservar `<h1>` e botão. (Obs.: a redesenho completa desta tela é do Epic 2; aqui só o breadcrumb.)
- **`src/features/plano/queries.ts`** → `getPlanoWithObjetivos(id)`: usa `prisma.plano.findUnique({ where:{id}, include:{ objetivos:{...}, planosFilhos:{...} } })`. **Adicionar `planoPai: { select: { id, titulo } }`** ao `include`.
- **`src/app/(app)/components/topbar.tsx`** (UPDATE, da Story 1.3): `titleFor()` retorna "Plano" para `/planos/[id]`. Trocar para `''` e condicionar o `<h1>`.
- **`src/components/ui/sidebar.tsx`** etc. não envolvidos. Não há componente breadcrumb ainda (criar).

### Modelo
- **`prisma/schema.prisma`**: `Plano.planoPai Plano? @relation("PlanoHierarquia", fields:[planoPaiId], references:[id])`, `planoPaiId String?`. Corporativo = `planoPaiId == null`; apoio aponta para o pai. Hierarquia é de **um nível** no uso atual (corporativo → apoio); o breadcrumb cobre esse caso (não precisa recursão profunda).

### Aprendizados das stories anteriores
- 1.1: tokens prontos; usar classes de token, sem cor hardcoded. Base UI (render prop, nunca `asChild`). `badge.tsx` é o exemplo de `useRender` para criar primitivos que aceitam `render`.
- 1.3: topbar criada com `titleFor` (mapa pathname→título) e ponto de extensão para breadcrumb. Componentes `ui/` em kebab; componentes React em PascalCase nos exports.
- 1.4: padrão de estender query + teste no gate (queries.test.ts) já estabelecido.

### Guardrails / escopo
- **NÃO** redesenhar a tela de acompanhamento (Epic 2) — só o breadcrumb substitui o nav ad-hoc.
- **NÃO** criar árvore de navegação. **NÃO** introduzir dependência nova (breadcrumb é semântico, sem libs).
- Reutilizar `Link` do `next/link` via `render` prop do `BreadcrumbLink`.

### Testes / verificação
- **Gate 90%**: o único toque em `features/**` é `getPlanoWithObjetivos` (include do `planoPai`) → asserir no teste existente em `queries.test.ts`.
- `breadcrumb.tsx` (src/components) e a página (src/app) → fora do gate; verificação por build/typecheck/visual.

### Project Structure Notes
- NEW: `src/components/ui/breadcrumb.tsx`.
- UPDATE: `src/features/plano/queries.ts`, `src/features/plano/__tests__/queries.test.ts`, `src/app/(app)/planos/[id]/page.tsx`, `src/app/(app)/components/topbar.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1 / Story 1.5 (FR-5) + Critérios Transversais]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/EXPERIENCE.md#Information Architecture (breadcrumb), Component Patterns]
- [Source: prisma/schema.prisma — Plano.planoPai (PlanoHierarquia)]
- [Source: src/app/(app)/planos/[id]/page.tsx, src/features/plano/queries.ts, src/app/(app)/components/topbar.tsx (estado atual)]
- [Source: src/components/ui/badge.tsx — padrão useRender para render prop]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-18):** breadcrumb de hierarquia renderizado na página (que tem os dados); última story do Epic 1.
- **`getPlanoWithObjetivos`** estendida com `include.planoPai { select: { id, titulo } }` (sem 2ª query). Teste em `queries.test.ts` asserindo o include. **152 testes verdes** (era 151).
- **`Breadcrumb`** (novo `src/components/ui/breadcrumb.tsx`): primitivos semânticos (nav/ol/li) — `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink` (useRender/Base UI, aceita `render={<Link/>}`), `BreadcrumbPage` (`aria-current="page"`), `BreadcrumbSeparator` (ChevronRight, `aria-hidden`). Tokens do design system; sem dependência nova.
- **`planos/[id]/page.tsx`**: nav ad-hoc ("Todos os planos /") substituído por `<Breadcrumb>`: Planos › [Corporativo ›] {Atual}. `<h1>` e botão "Editar plano" preservados.
- **`topbar.tsx`**: `titleFor('/planos/[id]')` → `''`; `<h1>` só renderiza com título não-vazio (sem duplicar contexto).
- **Verificação:** `pnpm typecheck` ✓ · `pnpm test` 152/152 ✓ · `pnpm lint` exit 0 (2 warnings pré-existentes) · `pnpm build` ✓.

### Change Log
- 2026-06-18 — Story 1.5 implementada: componente Breadcrumb + getPlanoWithObjetivos.include.planoPai (+teste); página mostra hierarquia Planos › Corp › Apoio; topbar sem título redundante. Fecha o Epic 1.

### File List
- `src/components/ui/breadcrumb.tsx` (NEW) — primitivo de breadcrumb reutilizável.
- `src/features/plano/queries.ts` (MODIFIED) — `getPlanoWithObjetivos` inclui `planoPai`.
- `src/features/plano/__tests__/queries.test.ts` (MODIFIED) — teste do include de `planoPai`.
- `src/app/(app)/planos/[id]/page.tsx` (MODIFIED) — breadcrumb de hierarquia no lugar do nav ad-hoc.
- `src/app/(app)/components/topbar.tsx` (MODIFIED) — título vazio em `/planos/[id]`.
