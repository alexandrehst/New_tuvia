---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 1.3: Shell autenticado (sidebar + topbar)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a usuário logado,
I want um shell com sidebar de navegação e topbar contextual,
so that eu me oriente, transite entre as áreas do app e acesse minha conta — com a nova linguagem visual.

## Acceptance Criteria

1. **Sidebar de navegação top-level** (não enumera planos): itens **Planos** (→ `/planos`) e **Usuários** (→ `/usuarios`), cada um com ícone (lucide) + rótulo, item ativo destacado em `primary` conforme o pathname. (FR-1)
2. **Colapsável + mobile**: a sidebar colapsa para modo só-ícone (≈64px) no desktop e vira `Sheet` em `sm`, usando o `SidebarProvider`/`SidebarTrigger` existentes. (FR-3, UX-DR19)
3. **Toggle de dark mode no rodapé** da sidebar, usando o `ThemeToggle` já existente (`src/components/theme-toggle.tsx`). (FR-3, UX-DR4)
4. **Topbar contextual**: mostra o título da área atual e, à direita, a identidade do usuário — avatar com menu (`DropdownMenu`) contendo **Sair** (logout). (FR-4)
5. **Logout funcional**: ação `signOut` (Server Action) encerra a sessão no Supabase e redireciona para `/login`. (FR-4)
6. **Pontos de extensão (não implementar aqui)**: o cabeçalho da sidebar mantém o bloco de identidade do workspace como está (o **workspace switcher interativo é a Story 1.4**); a topbar deixa espaço para o **breadcrumb (Story 1.5)**.
7. **Sem regressão**: `pnpm typecheck`, `pnpm lint`, `pnpm build` passam; suíte de testes (incl. novo teste de `signOut`) verde.
8. **Transversais** (do `epics.md`): tokens do design system (NFR-1); paridade dark (NFR-3); responsivo (NFR-2); a11y — nav e menu operáveis por teclado, foco visível, `aria` apropriado (NFR-4); textos pt-BR (NFR-6).

## Tasks / Subtasks

- [x] **Task 1 — Action `signOut`** (AC: 5) — em `src/features/auth/actions.ts`
  - [x] `'use server'` action `signOut()`: `await createSupabaseServerClient()` → `supabase.auth.signOut()` → `redirect('/login')` (do `next/navigation`, fora de try/catch que engula).
  - [x] **Teste** em `src/features/auth/__tests__/actions.test.ts` (estender): mockar `@/lib/supabase` e `next/navigation` (já mockados globalmente em `src/tests/setup.ts`); verificar que `signOut` chama `auth.signOut()` e dispara `redirect('/login')`.
- [x] **Task 2 — Rework da `AppSidebar`** (AC: 1, 2, 3, 6) — `src/app/(app)/components/app-sidebar.tsx`
  - [x] Substituir a enumeração de planos por nav top-level: **Planos** (`/planos`, ícone `LayoutDashboard` ou similar) e **Usuários** (`/usuarios`, ícone `Users`), `isActive` por `pathname`.
  - [x] Manter o cabeçalho de identidade do workspace como está (extensão da 1.4). Remover o bloco de usuário do footer (a identidade vai para a topbar).
  - [x] Footer: renderizar `<ThemeToggle />` (rótulo "Modo escuro" quando expandido; só ícone quando colapsado).
  - [x] Ajustar a prop: a sidebar não precisa mais de `planos`; manter `userEmail`/nome para o cabeçalho de workspace.
- [x] **Task 3 — `Topbar`** (AC: 4, 6) — novo `src/app/(app)/components/topbar.tsx` (`'use client'`)
  - [x] À esquerda: `SidebarTrigger` + título da área (mapa pathname→título: `/planos`→"Planos", `/usuarios`→"Usuários", `/criador`→"Novo plano", `/planos/[id]`→"Plano"; fallback genérico). Deixar comentário/extensão para o breadcrumb da 1.5.
  - [x] À direita: avatar + `DropdownMenu` (de `@/components/ui/dropdown-menu`) com item **Sair** que invoca a action `signOut` (via `<form action={signOut}>` ou handler).
- [x] **Task 4 — Wiring no layout** (AC: 4) — `src/app/(app)/layout.tsx`
  - [x] Substituir o `<header>` atual pelo `<Topbar userEmail nome />`; manter `SidebarProvider`/`SidebarInset`; continuar buscando sessão e `getSidebarData` para nome/email.
- [x] **Task 5 — Validação** (AC: 7) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`; visual: nav ativa, colapso, mobile (Sheet), dark toggle, menu de usuário → Sair.

## Dev Notes

### Estado atual (LER) — o shell JÁ EXISTE; isto é rework, não greenfield
- **`src/app/(app)/layout.tsx`** (UPDATE): Server Component. Hoje: `createSupabaseServerClient()` → `auth.getSession()` → `redirect('/login')` se sem sessão → `getSidebarData(email)` → renderiza `<SidebarProvider><AppSidebar planos userEmail/><SidebarInset><header>(SidebarTrigger+Separator)</header><main>{children}</main></SidebarInset></SidebarProvider>`. **Preservar** o guard de sessão e a estrutura SidebarProvider/Inset. Trocar só o `<header>` por `<Topbar/>` e ajustar props da sidebar.
- **`src/app/(app)/components/app-sidebar.tsx`** (UPDATE, `'use client'`): hoje usa `usePathname`, deriva `workspaceName` do domínio do email, e **enumera cada plano** como item de nav (padrão antigo) + grupo "Geral" com Usuários. Footer = bloco de usuário **não-interativo** (sem logout/toggle). **Mudança:** nav vira top-level (Planos/Usuários); footer vira `ThemeToggle`; remover enumeração de planos e bloco de usuário do footer.
- **`src/features/auth/actions.ts`** (UPDATE): tem `signIn`/`signUp`/`resetPassword` (assinatura `(prevState, formData)`). **NÃO existe `signOut`** — criar. Padrão: `createSupabaseServerClient()`, `redirect` do `next/navigation` no fim.
- **`getSidebarData(email)`** (`features/plano/queries.ts`): retorna `{ user: {id,nome,email,clienteId}, planos: [{id,titulo}] }` (planos = corporativos do cliente). Após o rework, a sidebar não precisa de `planos`; usar `nome`/`email` para identidade.

### Componentes a reutilizar (NÃO recriar)
- Primitivo **`src/components/ui/sidebar.tsx`** (shadcn/Base UI) — já exporta `Sidebar, SidebarProvider, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar…`. Mobile (Sheet) e colapso já embutidos no provider. `SidebarMenuButton` aceita `render={<Link/>}` (Base UI render prop), `isActive`, `tooltip`.
- **`ThemeToggle`** de `src/components/theme-toggle.tsx` (Story 1.2) — usar no footer.
- **`DropdownMenu`** de `@/components/ui/dropdown-menu`, **`Avatar`/`AvatarFallback`** de `@/components/ui/avatar`, **`Button`** de `@/components/ui/button`.
- Ícones: **lucide-react** (`LayoutDashboard`/`Target`, `Users`, `LogOut`).

### Aprendizados das stories anteriores
- 1.1: tokens prontos (primary `#4C8CEC`, status, dark). Nada de cor hardcoded — usar classes de token (`bg-sidebar`, `text-sidebar-foreground`, `bg-primary`…).
- 1.2: `ThemeToggle` pronto e funcional; tema por classe `.dark` no `<html>`. Apenas posicionar.
- Base UI, não Radix (`render` prop, nunca `asChild`). Componentes client em PascalCase; imports via `@/`.

### Guardrails / escopo
- **NÃO** implementar o workspace switcher interativo (Story 1.4) — manter o cabeçalho atual.
- **NÃO** implementar breadcrumb (Story 1.5) — só deixar o ponto na topbar.
- **NÃO** reescrever páginas de conteúdo (`/planos`, `/usuarios`, etc.) — são de outros epics.
- Mutação (logout) via **Server Action**, não API route. `redirect()` lança — não envolver em try/catch que engula.

### Testes / verificação
- **`signOut` é a única lógica em `features/**`** → teste obrigatório (gate 90%): `features/auth/__tests__/actions.test.ts`. Mockar Supabase via `vi.mock('@/lib/supabase')`; `next/navigation` já mockado em `src/tests/setup.ts`. Padrão: `vi.clearAllMocks()` no `beforeEach`.
- Sidebar/Topbar vivem em `src/app/**`/`src/components/**` (excluídos do gate) → verificação por `pnpm build`/`typecheck`/`lint` + visual.

### Project Structure Notes
- UPDATE: `src/app/(app)/layout.tsx`, `src/app/(app)/components/app-sidebar.tsx`, `src/features/auth/actions.ts`, `src/features/auth/__tests__/actions.test.ts`.
- NEW: `src/app/(app)/components/topbar.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1 / Story 1.3 + Critérios Transversais]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/EXPERIENCE.md#Information Architecture, Component Patterns, Responsive & Platform]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/DESIGN.md#Components (Sidebar + item ativo)]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/mockups/acompanhamento.html — sidebar/topbar de referência]
- [Source: src/app/(app)/layout.tsx, src/app/(app)/components/app-sidebar.tsx, src/features/auth/actions.ts, src/features/plano/queries.ts (estado atual)]
- [Source: _bmad-output/implementation-artifacts/1-2-dark-mode-com-toggle-persistido.md — ThemeToggle]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-18):** rework do shell existente (não greenfield).
- **`signOut`** adicionada em `features/auth/actions.ts` (`auth.signOut()` → `redirect('/login')`); teste em `features/auth/__tests__/actions.test.ts` (mock supabase com `signOut`, verifica chamada + redirect). **148 testes verdes** (era 147; +1).
- **`AppSidebar`** reescrita: nav top-level **Planos** (`/planos`, ativo por `startsWith`) e **Usuários** (`/usuarios`) — removida a enumeração de planos (vestígio da árvore). Cabeçalho de workspace mantido (extensão da 1.4). Footer agora tem `<ThemeToggle/>` com rótulo "Modo escuro" (oculto quando colapsado). Prop `planos` removida (só `userEmail`).
- **`Topbar`** (novo, client): `SidebarTrigger` + título por rota (mapa pathname→título, com ponto de extensão p/ breadcrumb da 1.5) + `DropdownMenu` de conta (avatar) com item **Sair** via `<form action={signOut}>`.
- **`layout.tsx`**: header trocado por `<Topbar/>`; passa `nome` de `getSidebarData().user`; guard de sessão preservado. Sidebar não recebe mais `planos`.
- **Verificação:** `pnpm typecheck` ✓ · `pnpm test` 148/148 ✓ (sem regressão) · `pnpm lint` exit 0 (só 2 warnings pré-existentes) · `pnpm build` ✓.
- **Visual recomendado** (não bloqueante): `pnpm dev` — nav ativa, colapso/mobile (Sheet), toggle de tema, menu de conta → Sair.

### Change Log
- 2026-06-18 — Story 1.3 implementada: shell redesenhado (sidebar nav top-level + ThemeToggle no rodapé, topbar com menu de conta), action signOut + teste. typecheck/test/lint/build verdes.

### File List
- `src/features/auth/actions.ts` (MODIFIED) — nova Server Action `signOut`.
- `src/features/auth/__tests__/actions.test.ts` (MODIFIED) — teste de `signOut` + mock `auth.signOut`.
- `src/app/(app)/components/app-sidebar.tsx` (MODIFIED) — nav top-level + ThemeToggle no footer; removida enumeração de planos.
- `src/app/(app)/components/topbar.tsx` (NEW) — topbar contextual com menu de conta/logout.
- `src/app/(app)/layout.tsx` (MODIFIED) — wiring da Topbar + props da sidebar.
