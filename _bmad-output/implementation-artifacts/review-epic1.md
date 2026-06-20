# Epic 1 — Adversarial Code Review (frozen diff)

**Verdict: Changes-Requested** — one real regression introduced by token removal hits a page in this very diff; plus a few medium a11y/correctness nits. Architecture and AC coverage are otherwise solid.

Scope reviewed: `/tmp/epic1-review.diff` (13 files). Cross-checked against the live repo for context; non-diff uncommitted work was ignored except where the diff's changes break it.

---

## Critical

### C1 — Removing brand tokens (`--teal/--navy/--gold/--bg/--text-*`) breaks live components, including KRPanel rendered on the page in this diff
- **File:** `src/app/globals.css` (lines 558-571 removed) → impacts `src/features/key-result/components/KRPanel.tsx` (e.g. lines 71, 138) and `src/features/criador-plano/components/CriadorWizard.tsx` (lines 90, 186, 434, 461, 503).
- **Lens:** Blind Hunter (regression).
- **Issue:** The diff deletes `--navy`, `--navy-light`, `--teal`, `--teal-hover`, `--gold`, `--green-accent`, `--bg`, `--text-primary/-secondary/-muted` from `:root`. `KRPanel.tsx` still does `style={{ color: 'var(--teal)' }}` / `background: 'var(--teal)'`, and `CriadorWizard.tsx` (route `/criador`) uses `var(--teal)`/`var(--navy)`. With the custom properties gone, `var(--teal)` resolves to nothing → the affected text/backgrounds become transparent/`initial` (invisible KR progress number, colorless progress fill, broken wizard stepper).
- **Why it matters:** `KRPanel` is rendered by `PlanoTree`, which is rendered by `src/app/(app)/planos/[id]/page.tsx` — **the page edited in this same diff**. So the regression is reachable directly from Epic 1 work, not a remote corner. AC 1.1.7 ("sem regressão de build / grep limpo") was scoped only to the old `--status-*` labels and missed these brand tokens.
- **Fix:** Either (a) keep deprecated `--teal/--navy/...` aliases in `:root` mapped onto the new palette (e.g. `--teal: var(--primary)`) until Epic 2 migrates KRPanel/CriadorWizard, or (b) migrate those two components to token classes (`text-primary`, `bg-primary`, `text-muted-foreground`) in this change set. Option (a) is the low-risk unblock. Confirm with `grep -rn "var(--teal\|--navy\|--gold\|--bg\|--text-" src` returning only defined tokens.

---

## High

### H1 — `signOut` Server Action is missing `'use server'` context guarantee verification / `revalidate` — but redirect placement is correct
- **File:** `src/features/auth/actions.ts:83-87`.
- **Lens:** Blind Hunter.
- **Status: CLEARED with a note.** The action lives in a file that already carries the module `'use server'` directive (pre-existing `signIn/signUp`), so it inherits server-action semantics. `redirect('/login')` is the last statement and is **not** wrapped in try/catch — compliant with the project rule that `redirect()` throws and must not be swallowed. `auth.signOut()` errors are intentionally ignored (acceptable for logout: even on error you want to send the user to /login). No change required; logged so it isn't re-flagged.

### H2 — `<form action={signOut}>` nested inside a Base UI Menu popup can break menu keyboard semantics
- **File:** `src/app/(app)/components/topbar.tsx:164-169`.
- **Lens:** Edge Case Hunter (a11y).
- **Issue:** `DropdownMenuContent` renders inside `MenuPrimitive.Portal` → `Positioner` → `Popup`. Wrapping the `DropdownMenuItem` (`MenuPrimitive.Item`) in a `<form>` inserts a non-menu element between the menu popup and its item. Base UI's menu typeahead/roving-tabindex expects items as descendants; an intervening `<form>` is usually tolerated but is not the documented composition, and clicking "Sair" submits the form, which does not auto-close the menu — on a slow redirect the menu can remain open.
- **Why it matters:** Logout is AC 1.3.4/1.3.5; keyboard operability is a transversal (NFR-4). Risk is silent: works by mouse, may degrade by keyboard.
- **Fix:** Prefer making the item itself the actuator: `<DropdownMenuItem render={<button type="button" />} onClick={() => signOut()} />` (call the action directly from a client handler), or keep the form but move it so the `<form>` wraps only the `<button>` that is the item's `render` target rather than wrapping the `DropdownMenuItem`. Verify keyboard: open menu → arrow to Sair → Enter logs out.

---

## Medium

### M1 — Active-nav state is conveyed correctly but `aria-current` is not asserted for the sidebar links
- **File:** `src/app/(app)/components/app-sidebar.tsx:66-83`.
- **Lens:** Edge Case Hunter (a11y).
- **Issue:** `isActive` drives a visual/`data-active` style via `SidebarMenuButton`, but there's no `aria-current="page"` on the active nav link. AC 1.3.1 + NFR-4 want the active item discoverable by AT, not color-only.
- **Fix:** Pass `aria-current={isActive ? 'page' : undefined}` to the `SidebarMenuButton`/`Link`. (Breadcrumb's `BreadcrumbPage` correctly uses `aria-current="page"` — mirror that.)

### M2 — `/planos` active match is greedy and will also light up unrelated `/planosX` style paths / the `/criador` route lost its sidebar entry
- **File:** `src/app/(app)/components/app-sidebar.tsx:67-70`; cross-ref `topbar.tsx:126` still maps `/criador`.
- **Lens:** Acceptance Auditor.
- **Issue:** `pathname.startsWith('/planos')` is fine for current routes, but the old layout had a "Criar plano" (`/criador`) nav entry that the rework dropped. AC 1.3.1 explicitly lists only Planos + Usuários, so dropping it is **intended** — but `/criador` is still a real, reachable route (topbar maps it to "Novo plano") with **no** navigation affordance left in the shell. Flagging as a product gap to confirm, not a spec violation.
- **Fix:** Confirm `/criador` is reached via an in-page button (e.g. "Novo plano" on `/planos`); if so, no action. Otherwise add the entry.

### M3 — `CircularProgress` clamps the arc but not the printed label; can show `>100%` or negative
- **File:** `src/app/(app)/planos/[id]/page.tsx:308-331` (label at 327-329).
- **Lens:** Edge Case Hunter.
- **Issue:** The ring offset uses `Math.min(value, 100)`, but the centered text prints raw `{value}%`. `overallProgress` is an average of `o.progresso` (a `Float` with no documented 0-100 invariant) — a KR can exceed 100% in OKR scoring. Negative/`>100` labels would render literally.
- **Fix:** Clamp the label too: `{Math.max(0, Math.round(value))}%`, and decide product-side whether overshoot should display capped or actual.

### M4 — Metric typography utility named `text-metric`, AC names it `metric`
- **File:** `src/app/globals.css:850-861`.
- **Lens:** Acceptance Auditor.
- **Issue:** AC 1.1.5 specifies utilities `metric` / `metric-lg`; the diff ships `.text-metric` / `.text-metric-lg`. Functionally equivalent and arguably a better Tailwind-utility naming, but no consumer uses them yet, so the exact class name is unverified by any call site. Low impact; note for the Epic 2 components that will consume them.
- **Fix:** Either rename to match the AC or update the AC/spec note; ensure Epic 2 references the actual name.

---

## Low

- **L1 — Sidebar header is a `SidebarMenuButton` (a `<button>`) that does nothing** (`app-sidebar.tsx:47-57`). It's styled `cursor-default hover:bg-transparent` and is non-interactive by intent (AC 1.4.4 wants a static identity, no false affordance). But it is still a focusable button with no action — a keyboard user tabs onto a dead control. Lens: Edge Case Hunter. Fix: render it as a non-interactive container (e.g. a `div`) rather than a `SidebarMenuButton`.
- **L2 — `titleFor` returns `'OKR'` fallback but topbar `<h1>` only renders when `title` is truthy** — consistent, but `/planos/[id]` intentionally shows no title (AC 1.5.6, correct). No issue; confirms 1.5.6 met. (Cleared.)
- **L3 — `workspaceName = clienteNome ?? userEmail`** (`app-sidebar.tsx:39`): empty-string `clienteNome` (`''`) would pass the `??` and render blank. `Cliente.nome` is required in schema so unlikely, but `?? || ''`-style guarding (`clienteNome || userEmail`) is safer against empty strings. Lens: Edge Case Hunter.
- **L4 — `initials` uses `userEmail[0]` when email is `''`** → `(''[0] ?? '?')` correctly yields `'?'` because `''[0]` is `undefined`. Verified safe. (Cleared.)

---

## What's solid

- **Base UI discipline is correct throughout.** `breadcrumb.tsx` uses `useRender` + `mergeProps` from `@base-ui/react/*` (path verified against `package.json` `@base-ui/react ^1.3.0` and the existing `badge.tsx` pattern). All composition uses the `render` prop (`SidebarMenuButton render={<Link/>}`, `DropdownMenuTrigger render={<Button/>}`, `BreadcrumbLink render={<Link/>}`). No `asChild`, no `@radix-ui/*` import anywhere in the diff.
- **Status scale migrated correctly.** Old `--status-ahead/-on-track/-behind/-complete` removed; new `--status-{no-prazo,em-atraso,em-risco,risco-alto}` (+ `-bg`, + dark variants, + `@theme inline` `--color-status-*`) map 1:1 to `StatusRisco` in `features/key-result/lib/calculos.ts` (verified). grep confirms no leftover old status labels.
- **Theme wiring is correct and FOUC-safe.** `suppressHydrationWarning` on `<html>` and `<body>`; next-themes with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`; `ThemeToggle` guards hydration via `mounted` before choosing the icon/`aria-pressed` — no theme hydration mismatch. Matches the `.dark` / `@custom-variant dark` strategy from 1.1.
- **Server/Client boundaries correct.** `layout.tsx` stays a Server Component (awaits session + `getSidebarData`); `app-sidebar.tsx`, `topbar.tsx`, `theme-toggle.tsx`, `theme-provider.tsx` are `'use client'` (they use hooks/handlers). `params` awaited in `planos/[id]/page.tsx`.
- **Data layer + tests.** `getSidebarData` is `clienteId`-scoped (`where: { clienteId: user.clienteId, planoPaiId: null }`) — multi-tenant respected; returns `null` on missing user without a stray `findMany`. `getPlanoWithObjetivos` adds `planoPai { id, titulo }` to the existing `include` (no extra query). Tests in `features/**` cover the cliente select, the `planoPai` include, and `signOut` → `redirect('/login')` — the only feature-layer logic, satisfying the 90% gate location rule.
- **Breadcrumb a11y** is correct: `nav aria-label`, `ol/li` semantics, `BreadcrumbPage` with `aria-current="page"`, separator `aria-hidden`. Conditional `planoPai` rendering satisfies AC 1.5.1/1.5.2 (corporativo vs apoio).

## False alarms checked & cleared
- **`signOut` redirect not swallowed** — verified (H1). 
- **breadcrumb Base UI import path** — `@base-ui/react/merge-props` + `/use-render` exist and match `badge.tsx`. Not a broken import.
- **`o.progresso` / `kr.progresso` fields** — both exist on `Objetivo` and `ResultadoChave` in `schema.prisma`. Page access is type-valid.
- **Empty-email initials** — `'?'` fallback verified safe (L4).
- **`getPlanoWithObjetivos` tenant scoping** — it has no `clienteId` filter, but that is **pre-existing** (not introduced by this diff) and the page is reached via authenticated layout; out of scope for Epic 1, noted only.
- **`oklch` background value** — `oklch(0.969 0.006 247)` is a faithful approximation of `#F0F4F9` (AC suggested `0.97 0.006 255`); within tolerance.

---

## Resolução (2026-06-18) — todos os achados endereçados

- **C1 (Critical) — RESOLVIDO:** adicionados aliases legados em `globals.css` (`--teal→primary`, `--navy→foreground`, `--teal-hover→primary-hover`, `--gold→accent-foreground`, `--bg→background`, `--text-primary→foreground`, `--text-secondary/-muted→muted-foreground`, `--navy-light→muted-foreground`). Resolvem em dark via `var()`. Verificado: os 5 tokens realmente usados (`--teal/--navy/--text-*`) agora resolvem; `--green-accent` não é usado. KRPanel/CriadorWizard a migrar nos Epics 2/3.
- **H1 — sem ação** (cleared pelo revisor; redirect correto).
- **H2 — RESOLVIDO:** `topbar.tsx` troca `<form action={signOut}>` por `<DropdownMenuItem onClick={() => signOut()}>` (semântica de menu + fecha ao selecionar).
- **M1 — RESOLVIDO:** `app-sidebar.tsx` nav ativa recebe `aria-current="page"`.
- **M2 — CONFIRMADO OK:** `/criador` é alcançável via botões "Novo plano" em `src/app/(app)/planos/page.tsx` (l.34,49). Sem ação.
- **M3 — RESOLVIDO:** `CircularProgress` agora faz clamp do label (`Math.round(Math.min(100, Math.max(0, value)))`).
- **M4 — ACEITO:** mantido `.text-metric`/`.text-metric-lg` (naming Tailwind melhor); a Story 2.1 já consome esses nomes. Spec alinhada.
- **L1 — RESOLVIDO:** cabeçalho de workspace renderiza como `<div>` (`render={<div/>}`) — não é mais um `<button>` focável morto.
- **L2/L4 — cleared.**
- **L3 — RESOLVIDO:** `clienteNome || userEmail` e `initials` com `||` (guarda contra string vazia).

**Validação pós-fix:** `pnpm typecheck` ✓ · `pnpm test` 152/152 ✓ · `pnpm lint` exit 0 (2 warnings pré-existentes não relacionados) · `pnpm build` ✓. **Novo veredito: Approve.**
