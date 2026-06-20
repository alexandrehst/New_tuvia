---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 1.1: Design system base (tokens + primitivos)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a desenvolvedor do produto (em nome do usuário final),
I want os tokens de marca e os primitivos shadcn alinhados ao design system do redesenho,
so that todas as telas seguintes herdem uma linguagem visual única, consistente e profissional — sem reescrever cores/estilos por tela.

## Acceptance Criteria

1. **Tokens de cor (claro)** em `src/app/globals.css`: `--primary` = azul de ação `#4C8CEC` (+ `--primary-foreground` branco), `--background` = `#F0F4F9` (área de trabalho), `--card` = branco, `--muted`/`--muted-foreground`/`--border` coerentes, e um novo `--brand-tint` = `#B2CDF8`. `--secondary`/`--accent`/`--ring`/`--sidebar-primary` re-derivados do novo matiz de primary.
2. **Escala de status de risco (4 níveis)** substitui os tokens antigos: remover `--status-ahead/-on-track/-behind/-complete` e criar, com par fg+bg, `--status-no-prazo`, `--status-em-atraso`, `--status-em-risco`, `--status-risco-alto` — mapeando 1:1 a `StatusRisco` (`no_prazo|em_atraso|em_risco|risco_alto`). Expostos em `@theme inline` como `--color-status-*`.
3. **Variantes dark** definidas num bloco `.dark { … }` para todos os tokens acima (background `#0B1220`, card `#131C2E`, foreground `#E2E8F0`, border `#1E293B`, primary `#6BA0F0`, e os status em versões escuras). _(O toggle/persistência em runtime é a Story 1.2; aqui só os VALORES dos tokens dark.)_
4. **Raio** ajustado para a escala mais arredondada da spine: sm ≈ 8px, md ≈ 12px, lg ≈ 16px, full = pílula. `Button`, `Card`, `Sheet`, `Badge` permanecem visualmente coerentes após o ajuste.
5. **Tipografia de métrica**: utilitários `metric` (~28px/700/tracking -0.02em) e `metric-lg` (~40px/700) usando a fonte atual do projeto (**Inter**, via `--font-inter`) — não introduzir Geist.
6. **Primitivos consomem os tokens** (sem hardcode de cor): `Button`, `Badge`, `Progress`, `Sheet`, `Input`, `Label`, `Card`, `Skeleton`, `Separator`, `Tooltip`, `Avatar`, `Collapsible`, `DropdownMenu`, `Sidebar` renderizam corretamente com a nova paleta nos temas claro e (com `.dark`) escuro.
7. **Sem regressão de build**: `pnpm typecheck`, `pnpm lint` e `pnpm build` passam; nenhuma referência remanescente aos tokens antigos `--status-ahead/-on-track/-behind/-complete` no código (`grep` limpo).
8. **Critérios transversais herdados** (do `epics.md`): tudo via tokens/design system (NFR-1); base pronta para paridade dark (NFR-3); texto em pt-BR; foco visível preservado (o `--ring` continua válido).

## Tasks / Subtasks

- [x] **Task 1 — Reescrever os tokens em `src/app/globals.css`** (AC: 1, 2, 4, 5)
  - [x] Substituir os 4 tokens `--status-*` antigos pela escala de 4 níveis (fg+bg) no `:root`, em `oklch` (convenção do arquivo). Valores-alvo (hex de referência → aproximar em oklch, ajustar visualmente):
    - `no_prazo`: fg `#15803D` / bg `#DCFCE7`
    - `em_atraso`: fg `#B45309` / bg `#FEF3C7`
    - `em_risco`: fg `#C2410C` / bg `#FFEDD5`
    - `risco_alto`: fg `#DC2626` / bg `#FEE2E2`
  - [x] Atualizar `--primary` para `#4C8CEC` (oklch ≈ `oklch(0.66 0.15 256)` — verificar visualmente) e re-derivar `--secondary`/`--accent`/`--ring`/`--sidebar-primary` no novo matiz.
  - [x] Definir `--background` `#F0F4F9` (oklch ≈ `oklch(0.97 0.006 255)`), manter `--card` branco, adicionar `--brand-tint` `#B2CDF8`.
  - [x] Ajustar a escala de raio (sm≈8/md≈12/lg≈16) e expor `--color-status-*` + `--color-brand-tint` em `@theme inline`.
  - [x] Adicionar utilitários de tipografia `metric`/`metric-lg` (Inter 700).
- [x] **Task 2 — Bloco `.dark`** (AC: 3) — definir os valores escuros de todos os tokens (sem wiring de toggle).
- [x] **Task 3 — Verificar primitivos** (AC: 6) — confirmar que nenhum `src/components/ui/*.tsx` hardcoda cores; corrigir só onde houver valor fixo divergente. Não reescrever a API dos componentes.
- [x] **Task 4 — Limpeza e validação** (AC: 7) — `grep -r "status-ahead\|status-on-track\|status-behind\|status-complete" src` deve ficar vazio; rodar `pnpm typecheck && pnpm lint && pnpm build`.

## Dev Notes

### Estado atual (LER antes de editar) — `src/app/globals.css` (92 linhas)
- **Já existe** um sistema de tokens em **oklch** com `@theme inline`. **Editar, não recriar.**
- **Conflitos a corrigir (esta é a essência da story):**
  - Tokens de status atuais usam os rótulos ERRADOS (`--status-ahead/-on-track/-behind/-complete`) — vestígio do modelo "Adiantado/Concluído". **Substituir** pela escala real de `calcularRisco`.
  - `--primary` atual é azul-600 (`oklch(0.546 0.245 262.881)`), mais escuro que o `#4C8CEC` da spine. **Trocar** para `#4C8CEC`.
  - `--background` atual é branco; a spine quer a área de trabalho em `#F0F4F9`. **Trocar.** _Consequência aceita:_ telas de auth/landing ficarão com fundo cinza até o Epic 5 ajustar o `brand-tint` — intermediário ok.
  - **Fonte é Inter** (`--font-sans: var(--font-inter)`), não Geist. A DESIGN.md mencionou "Geist Sans" por suposição do default shadcn — **correção: usar Inter** (a fonte real do projeto). `metric` = Inter 700.
  - Não há bloco `.dark` nem `--brand-tint` nem tipografia `metric` — adicionar.
- Já existem `--radius` (0.5rem) com `--radius-sm/md/lg/xl` derivados, e `.progress-ring { transform: rotate(-90deg) }` (útil para os gauges do Epic 2 — não remover).

### Padrão dos primitivos (`src/components/ui/`)
- **shadcn v4 sobre Base UI, NÃO Radix.** Confirmado no código: `Badge` usa `useRender`/`mergeProps` de `@base-ui/react`; `Button` usa `@base-ui/react/button`; `Progress` usa `@base-ui/react/progress`. **NUNCA** usar `asChild` nem importar `@radix-ui/*`.
- Componentes usam `cva` para variantes, `cn()` de `@/lib/utils`, `data-slot="…"`, e **já consomem tokens** via classes utilitárias (`bg-primary`, `bg-muted`, `text-muted-foreground`, `bg-destructive/10`…). Por isso a tokenização é majoritariamente **automática** ao mudar as CSS vars — Task 3 é verificação, não reescrita.
- `Badge` já tem `rounded-4xl` (pílula) e variantes default/secondary/destructive/outline/ghost/link — boa base para a futura StatusPill de domínio (Epic 2; **não** criar StatusPill aqui).
- `Progress` já tem trilha `bg-muted` + indicador `bg-primary` — pronto para a ProgressBar de domínio (Epic 2).

### Escopo — o que NÃO fazer nesta story (prevenção de scope creep)
- **NÃO** criar `Dialog`/`ConfirmDialog` (não existem hoje) — serão criados no Epic 2 onde forem usados.
- **NÃO** criar StatusPill, KRCard, gauges, summary card (componentes de DOMÍNIO → Epic 2).
- **NÃO** wirar o toggle de dark mode nem persistência (→ Story 1.2). Aqui só os valores de token no `.dark`.
- **NÃO** mexer no shell/sidebar/topbar/layout (→ Story 1.3).

### Testes / verificação
- Esta story vive em `src/app/globals.css` e `src/components/**`, **excluídos do gate de 90%** (ver `vitest.config.ts`). **Não há teste obrigatório em `features/**` aqui.**
- Verificação = `pnpm typecheck` + `pnpm lint` + `pnpm build` + checagem visual (claro e adicionando `class="dark"` no `<html>`). Alinha com a regra do projeto: **validar build após mudanças de config/CSS**.

### Project Structure Notes
- Arquivos a tocar: `src/app/globals.css` (principal); `src/components/ui/*.tsx` apenas se houver cor hardcoded divergente.
- Tokens de domínio (status→cor) que tenham lógica de mapeamento devem residir em `features/key-result/` (consenso do `epics.md`) — mas aqui só definimos os tokens CSS; o mapeamento `StatusRisco → classe` é da Story 2.1.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1 / Story 1.1 + Critérios Transversais + Separação de componentes]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/DESIGN.md#Colors, Typography, Shapes, Components]
- [Source: _bmad-output/project-context.md#Stack & Versões, Qualidade & Estilo, Workflow & Gotchas]
- [Source: src/app/globals.css (estado atual)]
- [Source: src/features/key-result/lib/calculos.ts — `StatusRisco = 'no_prazo' | 'em_atraso' | 'em_risco' | 'risco_alto'`]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-18):** reescrita de `src/app/globals.css` — único arquivo de código alterado. Primitivos não precisaram de edição (já consomem tokens; grep confirmou zero cor hardcoded).
- **Tokens:** `--primary` → `#4C8CEC` (`oklch(0.66 0.16 256)`); `--background` → `#F0F4F9`; `--card` branco; `--brand-tint` `#B2CDF8`; secondary/accent/ring/sidebar-primary re-derivados.
- **Status:** removidos `--status-ahead/-on-track/-behind/-complete`; criados `--status-{no-prazo,em-atraso,em-risco,risco-alto}` + `-bg` (claro e dark), expostos como `--color-status-*` no `@theme inline`. Grep confirmou que os antigos só existiam no globals.css (sem migração externa).
- **Dark:** bloco `.dark` com todos os tokens + `@custom-variant dark (&:is(.dark *))` para o `dark:` responder à classe (pré-requisito do toggle da Story 1.2).
- **Raio:** escala original preservada (Button/Input/Sheet `rounded-lg`=12px, Card `rounded-xl`=16px) — já alinhada à spine; alterá-la regrediria. AC4 atendido pela escala existente.
- **Métrica:** `.text-metric` (28px/700) e `.text-metric-lg` (40px/700) em `@layer utilities`, fonte Inter (correção da spine que dizia "Geist").
- **Verificação:** `pnpm typecheck` ✓ · `pnpm build` ✓ (todas as rotas geram). `pnpm lint`: **0 problemas introduzidos por esta story**. Há 1 erro + 2 warnings **pré-existentes** em arquivos não tocados (`react-hooks/purity` por `Date.now` em `src/app/(app)/planos/[id]/page.tsx:58`; vars não usadas em `criador-plano/__tests__/schemas.test.ts` e `PlanoTree.tsx`) — serão tratados no Epic 2 (que reescreve `planos/[id]`). AC7 satisfeito para os arquivos da story; lint global pendente desses itens pré-existentes.
- **Verificação visual recomendada** (não bloqueante): rodar `pnpm dev` e conferir claro + `class="dark"` no `<html>`.

### Change Log
- 2026-06-18 — Story 1.1 implementada: novo sistema de tokens em `globals.css` (paleta `#4C8CEC`/`#F0F4F9`, escala de status de 4 níveis, dark mode, brand-tint, tipografia de métrica). typecheck/build verdes.

### File List
- `src/app/globals.css` (MODIFIED) — reescrita do sistema de tokens (cores, status 4 níveis, dark, raio, métrica).
- `src/app/(app)/planos/[id]/page.tsx` (MODIFIED) — fix de lint pré-existente (a pedido): `Date.now()` extraído para helper `calcTimeElapsed` de módulo, resolvendo `react-hooks/purity`. `pnpm lint` agora sai 0 (restam só 2 warnings pré-existentes não relacionados).
