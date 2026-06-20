---
title: DESIGN — Redesenho de UX do OKR SaaS
status: final
created: 2026-06-18
updated: 2026-06-18
sources:
  - ../../prds/prd-okr-2026-06-18/prd.md
name: OKR SaaS
description: Plataforma de gestão de OKRs multi-tenant. shadcn v4 sobre Base UI + Tailwind v4; este DESIGN.md especifica a camada de marca (delta sobre os defaults do shadcn).
colors:
  # Camada de marca sobre os defaults do shadcn. Tokens não listados
  # (popover, input, ring, etc.) herdam do shadcn v4.
  background: '#F0F4F9'        # área de trabalho do app (cinza-azulado claro)
  foreground: '#0F172A'        # texto principal (slate-900)
  card: '#FFFFFF'              # superfície de cartão
  card-foreground: '#0F172A'
  muted: '#F1F5F9'
  muted-foreground: '#64748B'  # texto secundário / labels
  border: '#E2E8F0'
  primary: '#4C8CEC'           # azul de ação (extraído da referência)
  primary-foreground: '#FFFFFF'
  primary-hover: '#3B79DB'
  brand-tint: '#B2CDF8'        # periwinkle decorativo (auth/marketing, realces sutis)
  # Status de risco do KR — mapeiam 1:1 a StatusRisco (no_prazo|em_atraso|em_risco|risco_alto)
  status-no-prazo-fg: '#15803D'
  status-no-prazo-bg: '#DCFCE7'
  status-em-atraso-fg: '#B45309'
  status-em-atraso-bg: '#FEF3C7'
  status-em-risco-fg: '#C2410C'
  status-em-risco-bg: '#FFEDD5'
  status-risco-alto-fg: '#DC2626'
  status-risco-alto-bg: '#FEE2E2'
  # Dark mode
  background-dark: '#0B1220'
  foreground-dark: '#E2E8F0'
  card-dark: '#131C2E'
  card-foreground-dark: '#E2E8F0'
  muted-foreground-dark: '#94A3B8'
  border-dark: '#1E293B'
  primary-dark: '#6BA0F0'
  primary-foreground-dark: '#0B1220'
typography:
  # Corpo/label herdam o ramp do shadcn (Geist Sans). Override apenas no papel "metric".
  metric:
    fontFamily: 'Geist Sans'
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  metric-lg:
    fontFamily: 'Geist Sans'
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.05'
    letterSpacing: -0.02em
rounded:
  # Mais arredondado que o default do shadcn — a referência lê "suave/calmo".
  sm: 8px
  md: 12px
  lg: 16px
  full: 9999px
spacing:
  # Escala Tailwind v4 herdada (4, 8, 12, 16, 20, 24, 32, 40, 48, 64). Sem overrides.
components:
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
    hover: '{colors.primary-hover}'
  sidebar:
    background: '{colors.card}'
    foreground: '{colors.muted-foreground}'
    border: '{colors.border}'
  sidebar-item-active:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
  summary-stat-card:
    background: '{colors.card}'
    foreground: '{colors.card-foreground}'
    radius: '{rounded.lg}'
    elevation: 'card'
  kr-card:
    background: '{colors.card}'
    foreground: '{colors.card-foreground}'
    radius: '{rounded.md}'
    border: '{colors.border}'
  status-pill:
    radius: '{rounded.full}'
    variants: 'no_prazo | em_atraso | em_risco | risco_alto'
  progress-bar:
    track: '{colors.muted}'
    fill: '{colors.primary}'
    radius: '{rounded.full}'
  add-card:
    background: 'transparent'
    border: 'dashed {colors.border}'
    foreground: '{colors.primary}'
    radius: '{rounded.lg}'
---

# OKR SaaS — Design Spine

> Identidade visual do redesenho. Herda shadcn v4 (sobre Base UI) + Tailwind v4; especifica apenas o delta de marca. As spines vencem em conflito com qualquer mock. **Status de KR usam os valores reais do código** (`no_prazo | em_atraso | em_risco | risco_alto`), não os rótulos da referência Kalungi.

## Brand & Style

OKR SaaS é uma plataforma de gestão de OKRs vendida para empresas. A premissa de marca é **clareza serena**: dirigentes e responsáveis precisam ler o estado de objetivos e resultados-chave num relance, sem ruído. A expressão visual segue: superfícies claras e espaçosas, **um azul confiante** (`{colors.primary}`) para ação, cores de status semânticas que carregam significado (não decoração), cantos generosamente arredondados e sombras suaves.

Herda os defaults do shadcn v4 (rodando sobre **Base UI**, não Radix) por completo. Este DESIGN.md especifica o delta de marca: cor primária, fundo de app cinza-azulado, escala de status de risco, tipografia de métrica, cantos mais arredondados e os componentes específicos do domínio (sidebar, cartões de resumo, cartão de KR, pill de status). Os componentes que vêm prontos do shadcn (Button, Card, Sheet, Dialog, DropdownMenu, Tooltip, Avatar, Skeleton, Separator) herdam os specs como estão.

## Colors

- **Primary Blue (`#4C8CEC` claro / `#6BA0F0` escuro)** — cor de ação e marca. Nav ativo, botões primários, preenchimento de barra de progresso, arco dos gauges, foco. Extraída da referência.
- **App Background (`#F0F4F9` claro / `#0B1220` escuro)** — a área de trabalho. Cartões (`{colors.card}` = branco) flutuam sobre ela; é o que dá o ar "espaçoso".
- **Brand Tint Periwinkle (`#B2CDF8`)** — uso decorativo apenas: fundo das telas de auth e seções de marketing da landing, realces sutis. Nunca em chrome de app nem em status.
- **Escala de Status de Risco** — mapeia 1:1 ao `StatusRisco` do `features/key-result/lib/calculos.ts`. É o único lugar onde cor carrega significado de dado:
  - `no_prazo` → verde (`{colors.status-no-prazo-fg}` / `{colors.status-no-prazo-bg}`)
  - `em_atraso` → âmbar (`{colors.status-em-atraso-fg}` / `bg`)
  - `em_risco` → laranja (`{colors.status-em-risco-fg}` / `bg`)
  - `risco_alto` → vermelho (`{colors.status-risco-alto-fg}` / `bg`)
- **Demais tokens** (`popover`, `input`, `ring`, `secondary`, `destructive`) herdam do shadcn. `destructive` (excluir) é o vermelho do shadcn, distinto da escala de status.

Evitar: gradientes em superfícies, um segundo azul de marca, usar as cores de status para qualquer coisa que não seja status de risco de KR.

## Typography

Corpo, label e caption herdam o ramp do shadcn (**Geist Sans**). Só o papel **`metric`** é overridado — números grandes em peso 700 (`{typography.metric}` 28px; `{typography.metric-lg}` 40px para os gauges da faixa de resumo). Métrica aparece em: gauges de progresso/tempo, contadores de KR, % e valor atual/alvo dos cartões de KR. Texto corrido nunca usa `metric`.

## Layout & Spacing

Escala Tailwind v4 herdada (4/8/12/16/24/32/48/64). **Shell de duas zonas:** sidebar fixa à esquerda (≈ 260px, colapsável para ≈ 64px só-ícone) + área de conteúdo fluida sobre `{colors.background}`. Conteúdo respira com padding generoso (24–32px). A tela-herói de acompanhamento usa layout multi-coluna (uma coluna por Objetivo) com rolagem horizontal quando excede a largura.

## Elevation & Depth

Sombras suaves e sutis como dispositivo de elevação de cartões (`elevation: card` ≈ shadow-sm/`0 1px 3px rgba(15,23,42,.08)`). Não usar elevação para hierarquia além de cartões. Hover de itens interativos eleva levemente. Dark mode: elevação por borda (`{colors.border-dark}`) + leve clareamento de superfície, não por sombra.

## Shapes

Mais arredondado que o shadcn default, para o tom "calmo": `{rounded.sm}` (8px) inputs, `{rounded.md}` (12px) cartões de KR e botões, `{rounded.lg}` (16px) cartões de resumo e cartão pontilhado de adição. Pills de status e avatares usam `{rounded.full}`. Gauges são círculos.

## Components

Usados do shadcn **sem customização**: `Button` (variantes não-primárias), `Sheet`, `Dialog`, `DropdownMenu`, `Tooltip`, `Avatar`, `Skeleton`, `Separator`, `Collapsible`, `Input`, `Label`, `Badge` (base).

Componentes da camada de marca / domínio:

- **Sidebar + item ativo** — `{components.sidebar}`. Topo: workspace switcher (tenant atual). Itens com ícone + rótulo; ativo preenchido em `{colors.primary}` com canto `{rounded.md}`. Rodapé: toggle de dark mode. Colapsável.
- **Summary stat card** — `{components.summary-stat-card}`. Cartão de resumo com gauge circular (arco em `{colors.primary}`, trilha em `{colors.muted}`) + número em `metric-lg` + legenda. Variante de contadores (Total / Abertos / Concluídos) sem gauge.
- **KR card** — `{components.kr-card}`. Descrição do KR, **status-pill**, **progress-bar**, % e valor atual/alvo em `metric`, avatar do responsável, timestamp ("atualizado há X"), ações inline (atualizar / editar / histórico) reveladas no hover.
- **Status pill** — `{components.status-pill}`, 4 variantes 1:1 com `StatusRisco`. Texto + fundo da escala de status. Forma de pílula.
- **Progress bar** — `{components.progress-bar}`. Trilha `{colors.muted}`, preenchimento `{colors.primary}`. 100% recebe tratamento de "concluído" (preenchimento verde `{colors.status-no-prazo-fg}` + check) — distinto do status de risco.
- **Add card (pontilhado)** — `{components.add-card}`. Affordance de adicionar Objetivo/KR; borda tracejada, ícone "+" e rótulo em `{colors.primary}`.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Usar a `render` prop do Base UI nos primitivos | Usar `asChild` ou imports de `@radix-ui/*` (quebra silenciosamente) |
| Herdar defaults do shadcn fora da camada de marca | Customizar componentes shadcn sem necessidade de marca |
| Cor de status só para `StatusRisco` de KR | Usar verde/âmbar/laranja/vermelho como decoração |
| Status nomeados pelos valores do código (`no_prazo`...) | Inventar "Adiantado/Concluído" (não existem no modelo) |
| `metric` para números; Geist Sans para texto | `metric` em texto corrido |
| Um azul de ação só (`{colors.primary}`) | Segundo azul de marca / gradientes em superfície |
| Periwinkle só em auth/marketing/realce | Periwinkle em chrome de app ou status |
