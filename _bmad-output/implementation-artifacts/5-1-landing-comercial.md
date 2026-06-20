---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 5.1: Landing comercial

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a prospect,
I want uma landing que comunique valor e me deixe entrar/cadastrar rápido,
so that eu decida experimentar o produto.

> Primeira story do Epic 5. A rota `/` hoje é o template default do Next.

## Acceptance Criteria

1. Em `/`, vejo um **hero** com proposta de valor + **ao menos uma seção de prova/benefício**. (FR-7, UX-DR16)
2. CTAs **"Entrar"** (→ `/login`) e **"Comece agora"** (→ `/cadastro`) **acima da dobra**. (FR-6)
3. Caminho **landing→login→painel curto** (CTAs diretos; sem passos extras).
4. Usa **tokens do design system** e o fundo **`brand-tint`** onde apropriado; paridade dark; responsivo. (UX-DR16)
5. **Sem regressão / transversais**: `pnpm typecheck/lint/build` passam; pt-BR; Base UI; a11y (headings, links com rótulo, contraste).

## Tasks / Subtasks

- [x] **Task 1 — Página landing** (AC: 1, 2, 3, 4, 5) — `src/app/page.tsx` (reescrever)
  - [x] Substituir o template default. Estrutura: **nav** (wordmark + "Entrar" + "Comece agora"); **hero** (headline + subcopy + 2 CTAs acima da dobra, fundo/realce `brand-tint`) com um preview estilizado do painel (mock em tokens, sem screenshot); **seção de benefícios** (3 cartões) + uma **faixa de prova** (métrica/declaração); **footer** simples.
  - [x] CTAs via `Button` com `render={<Link href=.../>}`: "Entrar"→`/login`, "Comece agora"→`/cadastro`. Tudo tokenizado (sem hex/zinc); dark-safe; responsivo (mobile→desktop).
- [x] **Task 2 — Validação** (AC: 5) — `pnpm typecheck && pnpm lint && pnpm build` (sem lógica nova de domínio → sem novos testes de unidade).

## Dev Notes

### Estado atual (LER)
- **`src/app/page.tsx`**: template default do Next (next.svg, cores `zinc-*`/hex, "edit the page.tsx") — **reescrever** por completo.
- **`src/app/layout.tsx`**: layout raiz com `ThemeProvider` (next-themes) + fonte Inter — a landing herda tema/fonte. Não mexer.
- **Auth**: `/login` e `/cadastro` existem em `(auth)/` (reskin é 5.2/5.3). A landing só precisa **linkar** para elas.
- **Tokens** (`globals.css`): `--primary #4C8CEC`, `--background #F0F4F9`, `--brand-tint #B2CDF8` (auth/marketing/realce), `--foreground`, `--muted-foreground`, `--card`, `--border`, `.text-metric`/`.text-metric-lg`. Usar `bg-brand-tint`/`text-primary` etc. — nunca hex.
- **`Button`** (Base UI, `render` prop) e `lucide-react` disponíveis. Sem screenshot real do painel — montar um **mock estilizado** com cards/barras em tokens (evita asset/binário).

### Decisões / escopo
- Landing **puramente apresentacional** (Server Component estático) → sem lógica testável; gate 90% inalterado.
- Produto sem nome de marca fixo → wordmark neutro "OKR" (marca simples com `bg-primary`). Sem inventar nome forte.
- Conteúdo pt-BR, tom comercial/credível (referência Kalungi do redesign). "Credibilidade decidida no painel" → caminho curto para login/cadastro; landing não exagera.

### Guardrails
- Tokens, sem hex/`zinc-*`; dark; responsivo; Base UI (Button via `render`, sem `asChild`). Acima da dobra = nav + hero com os 2 CTAs visíveis sem rolar.

### Project Structure Notes
- UPDATE: `src/app/page.tsx` (reescrita completa). Sem novos arquivos de feature.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5 / Story 5.1 (FR-6/7, UX-DR16)]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/DESIGN.md (tokens, brand-tint) + EXPERIENCE.md (entrada pública, caminho curto)]
- [Source: src/app/globals.css (tokens/brand-tint), src/app/layout.tsx (ThemeProvider/Inter), src/components/ui/button.tsx]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-19):**
- **`src/app/page.tsx`** reescrita (template default → landing comercial): nav (wordmark + Entrar + Comece agora), hero com proposta de valor + 2 CTAs acima da dobra (`/login` e `/cadastro`) e **preview estilizado do painel** em tokens (barras de progresso, pílula "No prazo"), seção de 3 benefícios, faixa de prova (`brand-tint`) e footer.
- Tokens em tudo (`bg-brand-tint/40`, `text-primary`, `bg-card`, `border-border`, `.text-metric`); sem hex/`zinc-*`; dark-safe; responsivo. CTAs via `Button render={<Link/>}`.
- Página **estática** (prerenderizada); sem lógica de domínio → sem novos testes (gate inalterado).
- **Verificação:** `pnpm typecheck` ✓ · `pnpm lint` exit 0 · `pnpm build` ✓ (`/` estática) · 201 testes mantidos.

### Change Log
- 2026-06-19 — Story 5.1: landing comercial em `/` (hero + CTAs acima da dobra + benefícios + prova, tokens/brand-tint, dark/responsivo). typecheck/lint/build verdes.

### File List
- `src/app/page.tsx` (REWRITTEN) — landing comercial.
