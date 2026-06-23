---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 1.2: Dark mode com toggle persistido

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a usuário,
I want alternar entre tema claro e escuro e ter minha escolha lembrada,
so that eu use o app confortavelmente na minha preferência, sem flash e sem reconfigurar a cada visita.

## Acceptance Criteria

1. **Provider de tema** envolve o app no root layout (`src/app/layout.tsx`), com estratégia de classe (`.dark` no `<html>`), `defaultTheme = "system"` e `enableSystem`.
2. **Sem FOUC** (flash of incorrect theme): o tema correto é aplicado antes da primeira pintura (script bloqueante). `<html>` recebe `suppressHydrationWarning`.
3. **Componente `ThemeToggle`** reutilizável (cliente): alterna claro↔escuro, com ícone (lucide `Sun`/`Moon`) e rótulo acessível. **Não** o posiciona na sidebar (isso é a Story 1.3) — apenas entrega o componente funcional.
4. **Persistência**: a preferência sobrevive a reload e a nova sessão (localStorage). Trocar e recarregar mantém o tema.
5. **Paridade visual**: ao ativar dark, a classe `.dark` no `<html>` faz os tokens da Story 1.1 valerem; superfícies, texto e status aparecem nas variantes escuras.
6. **Sem regressão**: `pnpm typecheck`, `pnpm lint`, `pnpm build` passam.
7. **Transversais** (do `epics.md`): texto pt-BR; toggle operável por teclado com foco visível e `aria-label`/`aria-pressed` apropriado (NFR-4); usa tokens do design system (NFR-1).

## Tasks / Subtasks

- [x] **Task 1 — Decisão de mecanismo + dependência** (AC: 1, 2, 4)
  - [x] Adotar **`next-themes`** (recomendado — ver Dev Notes) e instalar: `pnpm add next-themes`. _(Requer aprovação do usuário por ser nova dependência — confirmar no dev-story.)_
  - [x] Se a dependência for recusada, usar o **fallback próprio** descrito em Dev Notes (provider client + script inline anti-FOUC).
- [x] **Task 2 — Provider de tema** (AC: 1, 2, 5)
  - [x] Criar `src/components/theme-provider.tsx` (`'use client'`) encapsulando `ThemeProvider` do next-themes com `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`.
  - [x] Em `src/app/layout.tsx`: envolver `{children}` com `<ThemeProvider>` (dentro ou ao redor do `TooltipProvider`) e adicionar `suppressHydrationWarning` ao `<html>`. Preservar `lang="pt-BR"` e `className={inter.variable}`.
- [x] **Task 3 — Componente `ThemeToggle`** (AC: 3, 7)
  - [x] Criar `src/components/theme-toggle.tsx` (`'use client'`): usa `useTheme()`, alterna `light`/`dark`, renderiza `Button` (variant ghost/icon) com `Sun`/`Moon` (lucide-react) e `aria-label` em pt-BR ("Alternar tema"). Lidar com hydration (montar só no cliente para evitar mismatch de ícone).
- [x] **Task 4 — Validação** (AC: 6) — `pnpm typecheck && pnpm lint && pnpm build`; verificação visual: alternar e recarregar mantém o tema, sem flash.

## Dev Notes

### Decisão de mecanismo: next-themes (recomendado) vs próprio
- **next-themes (recomendado):** padrão de mercado para App Router, resolve o **anti-FOUC** com script bloqueante automático, suporta `system`, persiste em localStorage, estratégia de classe. Compatível com Next 16/React 19. Custo: 1 dependência pequena. **Requer `pnpm add next-themes` — nova dependência, confirmar com o usuário (regra do dev-story).**
- **Fallback próprio (se a dep for recusada):** provider client com `useState` + `localStorage` + `document.documentElement.classList.toggle('dark')`; e um `<script>` inline no `<head>` do layout que lê o localStorage e aplica `.dark` antes da pintura (evita flash). Mais código e mais arestas (system preference, sync entre abas). Só usar se necessário.

### Estado atual dos arquivos a tocar
- **`src/app/layout.tsx`** (UPDATE): hoje é Server Component que define `<html lang="pt-BR" className={inter.variable}>` + `<body className="antialiased">` + `TooltipProvider`. Inter via `next/font/google` (variable `--font-inter`). **Preservar tudo isso.** Adicionar `suppressHydrationWarning` ao `<html>` e o ThemeProvider em volta dos children. Título atual: "Tuvia — OKR".
- **`src/app/globals.css`** (já pronto da Story 1.1): contém o bloco `.dark { … }` com todos os tokens e `@custom-variant dark (&:is(.dark *))`. **Não reabrir** — só consumir. A estratégia de classe do provider deve casar com esse `@custom-variant` (classe `.dark` no `<html>`).

### Aprendizados da Story 1.1 (anterior)
- Tokens dark e `@custom-variant dark (&:is(.dark *))` já existem em `globals.css` — esta story só liga o switch.
- Fonte do projeto é **Inter** (não Geist). Primitivos consomem tokens; nada de cor hardcoded.
- Disciplina do projeto: **validar build após mudanças** (`pnpm build`/`typecheck`). CLIs (ex.: `pnpm add`) já quebraram config antes — rodar build após instalar.

### Padrões / guardrails
- Componentes client em **PascalCase** (`theme-provider.tsx` exporta `ThemeProvider`; `theme-toggle.tsx` exporta `ThemeToggle`). Imports via alias `@/`.
- Usar `Button` de `@/components/ui/button` (variant `ghost` + `size="icon"`) no toggle — não criar botão novo.
- Base UI, não Radix. lucide-react já é dependência (`^1.7.0`).
- **Escopo:** NÃO posicionar o toggle na sidebar (Story 1.3); NÃO mexer nos tokens (Story 1.1). Só provider + componente + wiring no layout.

### Testes / verificação
- Arquivos em `src/app/**` e `src/components/**` → **excluídos do gate de 90%**. Sem teste obrigatório em `features/**`.
- Verificação = `pnpm typecheck` + `pnpm lint` + `pnpm build` + visual (alternar tema, recarregar, checar persistência e ausência de flash).

### Project Structure Notes
- NEW: `src/components/theme-provider.tsx`, `src/components/theme-toggle.tsx`.
- UPDATE: `src/app/layout.tsx`.
- Possível: `package.json`/lockfile (se next-themes aprovado).

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1 / Story 1.2 + Critérios Transversais]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/DESIGN.md#Colors (dark), Elevation & Depth]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/EXPERIENCE.md#Foundation, Accessibility Floor]
- [Source: _bmad-output/implementation-artifacts/1-1-design-system-base.md — tokens dark + @custom-variant]
- [Source: src/app/layout.tsx, src/app/globals.css (estado atual)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-18):** adotado **next-themes 0.4.6** (aprovado pelo usuário). Mecanismo de classe (`.dark` no `<html>`), casando com o `@custom-variant dark` e o bloco `.dark` da Story 1.1.
- **`ThemeProvider`** (`src/components/theme-provider.tsx`): wrapper client de `next-themes`, tipado via `React.ComponentProps<typeof NextThemesProvider>` (evita variação de path do tipo entre versões).
- **Wiring** em `src/app/layout.tsx`: `<html … suppressHydrationWarning>` + `<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>` envolvendo o `TooltipProvider`. Anti-FOUC via script bloqueante do next-themes.
- **`ThemeToggle`** (`src/components/theme-toggle.tsx`): `Button` ghost/icon com `Sun`/`Moon` (lucide), `aria-label`/`aria-pressed` em pt-BR, guard de hydration (`mounted`) para evitar mismatch de ícone. **Não posicionado na sidebar** (Story 1.3).
- **Verificação:** `pnpm typecheck` ✓ · `pnpm build` ✓ (todas as rotas) · `pnpm lint` exit 0 (só os 2 warnings pré-existentes não relacionados; arquivos novos limpos).
- **Visual recomendado** (não bloqueante): `pnpm dev`, alternar tema, recarregar (persistência) e checar ausência de flash.

### Change Log
- 2026-06-18 — Story 1.2 implementada: next-themes 0.4.6 + ThemeProvider no root layout + componente ThemeToggle reutilizável. Persistência e anti-FOUC via next-themes. typecheck/lint/build verdes.

### File List
- `src/components/theme-provider.tsx` (NEW) — wrapper client do next-themes.
- `src/components/theme-toggle.tsx` (NEW) — botão reutilizável de alternância de tema.
- `src/app/layout.tsx` (MODIFIED) — ThemeProvider + suppressHydrationWarning.
- `package.json` / `pnpm-lock.yaml` (MODIFIED) — dependência next-themes 0.4.6.
