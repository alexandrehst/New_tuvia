---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: complete
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-okr-2026-06-18/prd.md
  - _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/EXPERIENCE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/addendum.md
  - docs/architecture.md
---

# OKR SaaS (Redesenho de UX) - Epic Breakdown

## Overview

Quebra de epics e stories do **redesenho de UX completo** do OKR SaaS. Re-skin sobre stack e funcionalidade existentes (Next.js 16, React 19, shadcn v4 sobre Base UI, Tailwind v4, Prisma/Supabase). **Sem features novas** — Server Actions, endpoints de IA, schema e regras de negócio permanecem; o trabalho é visual, de navegação/IA e de fluxo. Fontes: PRD + spines DESIGN.md/EXPERIENCE.md + architecture.md.

## Requirements Inventory

### Functional Requirements

(Do PRD §6 — experiência redesenhada; resultado funcional preservado.)

**Shell & Navegação**
- FR-1: Shell autenticado com sidebar de navegação persistente (Planos, Usuários), item ativo destacado.
- FR-2: Workspace switcher na sidebar identificando o tenant (`Cliente`) atual.
- FR-3: Sidebar colapsável + toggle de dark mode com persistência.
- FR-4: Topbar contextual com título da área, ações e identidade do usuário (avatar + menu com logout).
- FR-5: Hierarquia de planos (corporativo↔apoio) via breadcrumb/contexto, sem árvore aninhada profunda.

**Landing**
- FR-6: Landing comercial com design system; CTAs "Entrar"→`/login` e "Comece agora"→`/cadastro` acima da dobra.
- FR-7: Landing com hero (proposta de valor) + seção de prova/benefício.

**Autenticação**
- FR-8: Login/cadastro/reset em cartão centrado, padrão `useActionState`, erros de validação inline sem perder dados.
- FR-9: Formulários de auth com 3 estados visíveis (carregando/erro/sucesso), componentes reutilizados.

**Lista de Planos**
- FR-10: Lista de planos como cartões navegáveis (não árvore inline).
- FR-11: Clicar num plano abre o workspace de acompanhamento dedicado.
- FR-12: Estado vazio desenhado (mensagem + CTA criar) quando não há planos.
- FR-13: Ação primária de criar novo plano sempre acessível.

**Wizard de Plano Estratégico**
- FR-14: Wizard em passos claros (missão→visão→valores→SWOT→objetivos→KRs) com progresso visível.
- FR-15: Campos assistidos por IA com affordance "sugerir com IA" (carregando/erro/aceitar-editar), preservando endpoints.
- FR-16: Toda sugestão de IA é editável antes de avançar; nunca imposta.
- FR-17: Ao concluir, plano publicado e usuário levado ao acompanhamento.

**Acompanhamento de OKRs (tela-herói)**
- FR-18: Faixa de resumo (progresso geral, tempo decorrido de `dataInicio`/`dataFim`, contadores Total/Abertos/Concluídos) com gauges.
- FR-19: Objetivos em colunas/cartões, cada um listando seus KRs.
- FR-20: Cartão de KR: descrição, pill de status (de `calcularRisco`), barra de progresso, % e valor atual/alvo, avatar do responsável, timestamp.
- FR-21: Ações inline no cartão de KR (atualizar valor/editar/histórico) sem sair da tela.
- FR-22: Affordances de adicionar Objetivo e KR (cartão pontilhado).
- FR-23: Intervalo do plano (`dataInicio`–`dataFim`) exibido; sem seletor de ciclo. Edição do plano acessível.
- FR-24: Lista de responsáveis do plano/objetivos visível a partir da tela.

**Edição/Atualização (painéis)**
- FR-25: Edição de plano/objetivo (com responsáveis)/KR em painéis/sheets sobre o contexto.
- FR-26: Atualizar valor de KR em interação rápida; ao salvar reflete progresso/status recalculados, preservando a cadeia (HistoricoValores→KR→Objetivo→email).
- FR-27: Excluir qualquer elemento com confirmação clara e feedback.
- FR-28: Acesso a histórico de valores (`HistoricoValores`) + linha de tendência (`gerarLinhaTendencia`) como gráfico.

**Gestão de Usuários**
- FR-29: Listar membros, convidar, atribuir/editar papéis por plano, refletir preferências de notificação.
- FR-30: Estados de lista (vazio/carregando) e feedback de ações consistentes.

### NonFunctional Requirements

(Do PRD §7.)
- NFR-1: Design system único — todas as telas consomem os mesmos tokens/componentes (`src/components/ui/`); sem estilos ad-hoc.
- NFR-2: Responsividade desktop-first — degrada com elegância em telas menores (sidebar colapsa, colunas empilham).
- NFR-3: Dark mode — paridade visual claro/escuro nos componentes.
- NFR-4: Acessibilidade base — contraste AA, foco visível, navegação por teclado, ARIA (não regredir o Base UI).
- NFR-5: Performance percebida — skeletons/estados de carregamento; não degradar tempo de interação atual.
- NFR-6: Idioma pt-BR em toda a UI e domínio, ortografia correta.
- NFR-7: Consistência de status — cores/rótulos idênticos em toda a app, derivados de `calcularRisco`.

### Additional Requirements

(De architecture.md + PRD §8 + addendum — restrições técnicas que moldam as stories.)
- **Brownfield, sem starter template:** projeto já existe. Epic 1 não é scaffold; a fundação é o design system + shell.
- **Reutilizar Server Actions existentes** (não reescrever): auth (`signIn/signUp/inviteUser/resetPassword`), plano-estrategico, plano (`createPlanoCorporativo/Departamento/updatePlano/deletePlano`), objetivo (`create/suggest/update/deleteObjetivo`), key-result (`createKeyResult/updateKeyResultValor/updateKeyResult/deleteKeyResult`), usuarios (`updateUserPermissions/removeUserFromPlano`). O redesenho troca a camada de apresentação.
- **Status de risco = escala de 4 níveis** `no_prazo|em_atraso|em_risco|risco_alto` (`features/key-result/lib/calculos.ts`). NÃO inventar "Adiantado/Concluído".
- **Cadeia de atualização de KR preservada:** `updateKeyResultValor` grava HistoricoValores → recalcula progresso/risco do KR → recalcula progresso ponderado do Objetivo → dispara email Brevo (não-fatal).
- **IA via Route Handlers de streaming** (`/api/ai/*`) já existentes; UI consome, não reimplementa.
- **Multi-tenant por `clienteId`** + RLS no Supabase; toda leitura/escrita escopada ao Cliente.
- **Plataforma:** Base UI (não Radix — usar `render` prop, nunca `asChild`); shadcn v4; Tailwind v4 (tokens via CSS em `globals.css`); `cookies()`/`params` async no Next 16.
- **Testes:** mínimo 90% cobertura em `features/**`; mocks de Prisma/Supabase/OpenAI/Brevo via `vi.mock`. (Cobertura exclui `src/app/**`, `src/components/**`.)
- **Testabilidade do redesenho (consenso party mode):** como o gate de 90% cobre só `features/**`, externalizar lógica reutilizável (validação, estado, transformação, mapeamento de status→cor) para `features/<nome>/hooks/` ou libs — testável e dentro do gate. Componentes em `src/app/**` e `src/components/**` consomem esses hooks e ficam como UI dumb (testes de render são "nice-to-have", não contam para o gate).
- **Separação de componentes (consenso party mode):** primitivos genéricos sem lógica de domínio (Sheet, Dialog, ConfirmDialog genérico, Badge, Progress) são tokenizados no Epic 1; componentes de domínio (StatusPill, KRCard, gauges) e containers feature-specific (painéis ligados a Server Actions, ex. ObjetivoEditSheet, UpdateValuePanel, DeleteConfirmDialog do KR) vivem no Epic 2.

### UX Design Requirements

(De DESIGN.md + EXPERIENCE.md — itens acionáveis, específicos.)
- UX-DR1: **Tokens de marca** em `globals.css` (Tailwind v4): cores (primary `#4C8CEC`/hover/fg, background `#F0F4F9`, card branco, muted, border, brand-tint `#B2CDF8`), escala de status (no_prazo/em_atraso/em_risco/risco_alto — fg+bg, claro e escuro), `rounded` 8/12/16/full, tipografia `metric`/`metric-lg` (Geist Sans 700).
- UX-DR2: **Dark mode** — variantes de token escuro + toggle persistido; elevação por borda no escuro; paridade de componentes.
- UX-DR3: **App shell** — layout sidebar (≈260px, colapsa a ≈64px) + topbar contextual, sobre `background`.
- UX-DR4: **Sidebar + item ativo** (sobre `ui/sidebar`): workspace switcher no topo, nav ícone+rótulo, ativo preenchido em primary, dark toggle no rodapé.
- UX-DR5: **Summary stat card** com gauge circular (arco primary/trilha muted) + número `metric-lg`; variante de contadores (Total/Abertos/Concluídos).
- UX-DR6: **KR card** — descrição, status-pill, progress-bar, % e valor (`metric`), avatar, timestamp, ações no hover (atualizar/editar/histórico).
- UX-DR7: **Status pill** — 4 variantes 1:1 com `StatusRisco`, sempre com **rótulo textual** (a11y; status nunca só por cor).
- UX-DR8: **Coluna de Objetivo** — cabeçalho (título + progresso ponderado + ações editar/+KR/excluir) + lista de KRs.
- UX-DR9: **Add card pontilhado** — affordance de adicionar Objetivo/KR (borda tracejada, "+", primary).
- UX-DR10: **Progress bar** — trilha muted/preenchimento primary; tratamento "concluído" (100% → verde + check), distinto da pill de risco.
- UX-DR11: **Breadcrumb de plano** — Corporativo › Apoio, clicável; substitui a árvore.
- UX-DR12: **Painel de atualizar valor de KR** (`Sheet`) — salvar otimista, reflete recálculo na hora, `aria-live`.
- UX-DR13: **Painéis de edição** (plano/objetivo com responsáveis/KR) em `Sheet`/`Dialog` sobre contexto.
- UX-DR14: **Padrão de sugestão IA** no wizard — botão "Sugerir com IA", estados carregando/erro/aceitar-editar, conteúdo sempre editável; anúncio de passo ("Passo 3 de 6").
- UX-DR15: **Telas de auth** redesenhadas — cartão centrado, fundo brand-tint, estados carregando/erro/sucesso reutilizados.
- UX-DR16: **Landing** redesenhada — hero + prova, CTAs Entrar/Comece agora.
- UX-DR17: **Estados** padronizados — skeletons (carga fria), vazios (sem planos / plano sem objetivos), IA gerando/falhou, toast de salvar/erro, permissão viewer (oculta edição), 100% concluído.
- UX-DR18: **Piso de acessibilidade** — WCAG 2.2 AA, foco preso/retorno em sheets, `Esc` fecha topo, ordem de Tab, `aria-live` no recálculo, foco visível (ring shadcn).
- UX-DR19: **Responsivo** — `≥lg` colunas lado a lado + scroll horizontal; `md` sidebar a ícones + resumo 2-up; `sm` sidebar vira Sheet + objetivos empilham + KR full-width.
- UX-DR20: **Confirmação de exclusão** (`Dialog`) com consequência explícita (ex.: KRs filhos somem junto).
- UX-DR21: **Microcopy pt-BR** conforme tabela Voice & Tone (rótulos, timestamps relativos, estados vazios).
- UX-DR22: **Gráfico de histórico/tendência de KR** — pontos de `HistoricoValores` + projeção de `gerarLinhaTendencia`.

### FR Coverage Map

- FR-1: Epic 1 — Shell com sidebar persistente
- FR-2: Epic 1 — Workspace switcher (tenant)
- FR-3: Epic 1 — Sidebar colapsável + dark mode persistido
- FR-4: Epic 1 — Topbar contextual + menu do usuário
- FR-5: Epic 1 — Hierarquia via breadcrumb (sem árvore)
- FR-6: Epic 5 — Landing com CTAs
- FR-7: Epic 5 — Landing hero + prova
- FR-8: Epic 5 — Auth em cartão centrado (useActionState)
- FR-9: Epic 5 — Estados de formulário de auth
- FR-10: Epic 3 — Lista de planos como cartões navegáveis
- FR-11: Epic 3 — Abrir workspace dedicado (liga ao Epic 2)
- FR-12: Epic 3 — Estado vazio da lista
- FR-13: Epic 3 — Ação de criar plano
- FR-14: Epic 3 — Wizard em passos
- FR-15: Epic 3 — Sugestão de IA por campo
- FR-16: Epic 3 — Sugestões editáveis, nunca impostas
- FR-17: Epic 3 — Publicar e ir ao acompanhamento
- FR-18: Epic 2 — Faixa de resumo (gauges/contadores)
- FR-19: Epic 2 — Objetivos em colunas
- FR-20: Epic 2 — Cartão de KR (pill/barra/valor/avatar)
- FR-21: Epic 2 — Ações inline no cartão de KR
- FR-22: Epic 2 — Adicionar Objetivo/KR
- FR-23: Epic 2 — Intervalo do plano + editar plano
- FR-24: Epic 2 — Lista de responsáveis
- FR-25: Epic 2 — Painéis de edição (plano/objetivo/KR)
- FR-26: Epic 2 — Atualizar valor de KR + cadeia de recálculo
- FR-27: Epic 2 — Excluir com confirmação
- FR-28: Epic 2 — Histórico/tendência do KR
- FR-29: Epic 4 — Listar/convidar/papéis/notificações
- FR-30: Epic 4 — Estados e feedback da gestão

**NFRs transversais** (aplicados como AC em cada story): NFR-1 (design system) — primário no Epic 1; NFR-2 (responsivo), NFR-4 (a11y AA), NFR-5 (skeletons/perf), NFR-6 (pt-BR) — todos os epics; NFR-3 (dark mode) — primário no Epic 1, verificado nos demais; NFR-7 (consistência de status) — primário no Epic 2.

## Epic List

> **Ordem e paralelismo (consenso party mode):** a credibilidade comercial é decidida **no painel de acompanhamento**, não no landing — por isso o herói (Epic 2) vem cedo e o funil público (Epic 5) vem depois. Epic 1 é pré-requisito de todos. Epic 3 pode rodar **em paralelo** com Epic 2 (depende só do scaffold do Epic 1, não do herói). O caminho landing→login→painel deve ser rápido (AC no Epic 5).

### Epic 1: Fundação visual & navegação
Estabelece a base do redesenho: tokens de marca (cores, status, raio, tipografia de métrica) em Tailwind v4, dark mode com toggle persistido, o shell autenticado (sidebar com workspace switcher, topbar contextual, breadcrumb de hierarquia) e os **primitivos genéricos tokenizados** (Sheet, Dialog, ConfirmDialog genérico, Badge, Progress) sem lógica de domínio. Ao fim, um usuário logado navega no app com a nova linguagem visual e alterna tema — e todas as telas seguintes herdam a fundação.
**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-5
**UX-DRs:** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR11 · **NFRs:** NFR-1, NFR-3 (primários)

### Epic 2: Acompanhamento de OKRs (tela-herói)
Redesenha a tela de maior valor: faixa de resumo com gauges e contadores, Objetivos em colunas, cartões de KR com pill de status (4 níveis de `calcularRisco`), barra de progresso, valor e responsável. Inclui os **componentes de domínio** (StatusPill, KRCard, gauges) e os **containers feature-specific** dos painéis sobre contexto — atualizar valor de KR (preservando a cadeia HistoricoValores→KR→Objetivo→email), editar plano/objetivo/KR, excluir com confirmação, e o gráfico de histórico/tendência. Ao fim, Bruno atualiza um KR sem trocar de página e Marina lê o status num relance.
**FRs covered:** FR-18, FR-19, FR-20, FR-21, FR-22, FR-23, FR-24, FR-25, FR-26, FR-27, FR-28
**UX-DRs:** UX-DR5, UX-DR6, UX-DR7, UX-DR8, UX-DR9, UX-DR10, UX-DR12, UX-DR13, UX-DR17, UX-DR20, UX-DR22 · **NFRs:** NFR-7 (primário)
**Fatiamento:** 2.1 faixa de resumo + componentes de status [FR-18/20]; 2.2 objetivos em colunas + KR cards [FR-19/20/21/24]; 2.3 atualizar valor + cadeia de recálculo [FR-21/26]; 2.4 criar/editar **Objetivo** + responsáveis [FR-22/24/25]; 2.5 excluir com confirmação [FR-27]; 2.6 gráfico de histórico/tendência [FR-28]; 2.7 criar/editar **KR** [FR-22/25]; 2.8 editar **Plano** (intervalo/título) [FR-23/25].
**Correção de curso (2026-06-18):** a 2.4 original ("criar/editar objetivo/KR/plano") foi dividida por entidade — descoberto que `updateObjetivo`/`updateKeyResult`/`updatePlano` e a query de usuários **não existiam** (só schemas). 2.4 = Objetivo; KR-edit → 2.7; Plano-edit → 2.8. Cada uma implementa sua action de update + teste (gate 90%).

### Epic 3: Criação de planos
Redesenha a lista de planos (cartões navegáveis com estado vazio, abrindo o workspace dedicado do Epic 2) e o wizard de plano estratégico em passos (missão→visão→valores→SWOT→objetivos→KRs) com sugestão de IA por campo — sempre editável, nunca imposta — consumindo os endpoints `/api/ai/*` existentes. Inclui criar plano de apoio (departamento). Ao fim, Carla monta o primeiro plano e cai no acompanhamento.
**FRs covered:** FR-10, FR-11, FR-12, FR-13, FR-14, FR-15, FR-16, FR-17
**UX-DRs:** UX-DR14, UX-DR17 · **NFRs:** transversais

### Epic 4: Gestão de usuários
Redesenha a tela de gestão: listar membros do cliente, convidar por e-mail, atribuir/editar papéis (`PapelPlano`) por plano, refletir preferências de notificação, com estados (vazio/carregando) e feedback consistentes. Reutiliza `updateUserPermissions`/`removeUserFromPlano`/`inviteUser`.
**FRs covered:** FR-29, FR-30
**UX-DRs:** UX-DR17 · **NFRs:** transversais

### Epic 5: Entrada pública
Redesenha o funil de entrada: landing comercial (hero + prova, CTAs Entrar/Comece agora) e telas de auth (login/cadastro/reset) em cartão centrado sobre fundo brand-tint, mantendo o padrão `useActionState` com estados carregando/erro/sucesso. Ao fim, um prospect percebe credibilidade e entra/cadastra.
**FRs covered:** FR-6, FR-7, FR-8, FR-9
**UX-DRs:** UX-DR15, UX-DR16 · **NFRs:** transversais

---

## Critérios Transversais (herdados por toda story de UI)

Para não repetir em cada story, toda story que entrega UI carrega implicitamente estes ACs (NFR-2/4/5/6, UX-DR17/18/19/21):

- **Given** qualquer tela em escopo, **Then** usa apenas tokens/componentes do design system (sem estilos ad-hoc) — NFR-1.
- **Given** dark mode ativo, **Then** a tela tem paridade visual claro/escuro — NFR-3.
- **Given** viewport `md`/`sm`, **Then** o layout degrada conforme UX-DR19 (sidebar colapsa→Sheet, colunas empilham) — NFR-2.
- **Given** carregamento de dados, **Then** exibe `Skeleton` no layout esperado — NFR-5/UX-DR17.
- **Given** navegação por teclado/leitor de tela, **Then** foco visível, ordem de Tab correta, `Esc` fecha o topo, foco preso em sheets/dialogs — NFR-4/UX-DR18.
- **Given** qualquer texto de UI, **Then** está em pt-BR com ortografia correta e segue a tabela Voice & Tone — NFR-6/UX-DR21.

---

## Epic 1: Fundação visual & navegação

Estabelece tokens, dark mode, shell autenticado e primitivos genéricos. Pré-requisito de todos os epics.

### Story 1.1: Design system base (tokens + primitivos)

As a desenvolvedor do produto,
I want os tokens de marca e os primitivos shadcn alinhados ao design system,
So that todas as telas seguintes herdem uma linguagem visual única e consistente.

**Acceptance Criteria:**

**Given** o `globals.css` (Tailwind v4)
**When** os tokens são definidos
**Then** existem tokens de cor (`primary #4C8CEC`/hover/fg, `background #F0F4F9`, `card`, `muted`, `border`, `brand-tint #B2CDF8`), a escala de status (`no_prazo`/`em_atraso`/`em_risco`/`risco_alto` — fg+bg), `rounded` (8/12/16/full) e a tipografia `metric`/`metric-lg`
**And** os primitivos genéricos (`Button`, `Badge`, `Progress`, `Sheet`, `Dialog`, `ConfirmDialog` genérico) refletem esses tokens, usando a `render` prop do Base UI (nunca `asChild`)
**And** nenhum token de status é usado fora de status de risco (UX-DR7).

### Story 1.2: Dark mode com toggle persistido

As a usuário,
I want alternar entre tema claro e escuro,
So that eu use o app confortavelmente na minha preferência.

**Acceptance Criteria:**

**Given** o app autenticado
**When** clico no toggle de dark mode no rodapé da sidebar
**Then** o tema alterna e todos os componentes mantêm paridade visual (UX-DR2/NFR-3)
**And** a preferência persiste entre sessões/recarregamentos
**And** no escuro a elevação é por borda, não por sombra.

### Story 1.3: Shell autenticado (sidebar + topbar)

As a usuário logado,
I want um shell com sidebar de navegação e topbar contextual,
So that eu me oriente e transite entre as áreas do app.

**Acceptance Criteria:**

**Given** qualquer rota `(app)/*`
**When** a página carrega
**Then** vejo a sidebar com itens Planos e Usuários, item ativo destacado em `primary` (FR-1)
**And** a sidebar é colapsável para modo só-ícone e vira `Sheet` em `sm` (FR-3/UX-DR19)
**And** a topbar mostra o título da área e o menu do usuário (avatar + logout) (FR-4)
**And** em `(auth)/*` o shell não aparece.

### Story 1.4: Workspace switcher (tenant)

As a usuário que pertence a um ou mais clientes,
I want ver e trocar o workspace atual no topo da sidebar,
So that eu opere no tenant correto.

**Acceptance Criteria:**

**Given** a sidebar
**When** ela renderiza
**Then** o topo exibe o `Cliente` atual (nome + marca) (FR-2)
**And** se o usuário pertence a mais de um cliente, o switcher permite trocar, reescopando os dados ao `clienteId` selecionado
**And** se pertence a apenas um, exibe o tenant sem ação de troca.

### Story 1.5: Breadcrumb de hierarquia de planos

As a usuário navegando entre planos corporativo e de apoio,
I want um breadcrumb que mostre a hierarquia,
So that eu entenda onde estou sem uma árvore aninhada.

**Acceptance Criteria:**

**Given** um plano de apoio aberto
**When** vejo o topo da área de acompanhamento
**Then** o breadcrumb mostra "Corporativo › {Plano de apoio}" com os níveis clicáveis (FR-5/UX-DR11)
**And** um plano corporativo mostra apenas o seu nível
**And** não há árvore aninhada profunda em lugar nenhum da navegação.

---

## Epic 2: Acompanhamento de OKRs (tela-herói)

Redesenha `(app)/planos/[id]`. Reutiliza queries/actions existentes; preserva a cadeia de recálculo de KR.

### Story 2.1: Faixa de resumo + componentes de status

As a gestor (Marina),
I want uma faixa de resumo e indicadores de status claros no topo do plano,
So that eu leia o estado geral num relance.

**Acceptance Criteria:**

**Given** um plano com objetivos e KRs
**When** abro o acompanhamento
**Then** a faixa de resumo mostra progresso geral (gauge), tempo decorrido (de `dataInicio`/`dataFim`) e contadores Total/Abertos/Concluídos (FR-18/UX-DR5)
**And** o `StatusPill` renderiza as 4 variantes mapeadas 1:1 de `calcularRisco` (`no_prazo`/`em_atraso`/`em_risco`/`risco_alto`), sempre com **rótulo textual** além da cor (FR-20 parcial/UX-DR7/NFR-7)
**And** a `ProgressBar` mostra preenchimento `primary` e, a 100%, o tratamento "concluído" (verde + check), distinto do status de risco (UX-DR10)
**And** o mapeamento status→cor/rótulo vive em `features/key-result/` (testável no gate de 90%).

### Story 2.2: Objetivos em colunas + cartões de KR

As a usuário (Bruno/Marina),
I want ver os objetivos em colunas e cada KR como cartão,
So that eu encontre rapidamente o que me interessa.

**Acceptance Criteria:**

**Given** o acompanhamento de um plano
**When** a tela renderiza
**Then** cada Objetivo é uma coluna com cabeçalho (título + progresso ponderado) (FR-19/UX-DR8)
**And** cada KR é um cartão com descrição, `StatusPill`, `ProgressBar`, % e valor atual/alvo (`metric`), avatar do responsável e timestamp ("atualizado há X") (FR-20/UX-DR6)
**And** o hover (desktop) revela as ações do KR; em touch as ações ficam visíveis (FR-21 trigger)
**And** a lista de responsáveis do plano é acessível a partir da tela (FR-24)
**And** em `lg` as colunas ficam lado a lado com rolagem horizontal; em `sm` empilham (UX-DR19).

### Story 2.3: Atualizar valor de KR (com cadeia de recálculo)

As a responsável por um KR (Bruno),
I want atualizar o valor de um KR num painel rápido,
So that o progresso e o status reflitam a realidade sem eu trocar de página.

**Acceptance Criteria:**

**Given** um cartão de KR
**When** aciono "atualizar valor" e salvo um novo valor no `Sheet`
**Then** a action `updateKeyResultValor` grava `HistoricoValores`, recalcula progresso/risco do KR e o progresso ponderado do Objetivo, e dispara o e-mail Brevo (não-fatal) (FR-26)
**And** a barra e a pill recalculam **na hora** (otimista), sem navegar, e o novo status é anunciado via `aria-live` (UX-DR12)
**And** se o save falhar, um `Toast` destrutivo aparece e o valor digitado é preservado
**And** falha no e-mail não bloqueia nem alarma o usuário.

### Story 2.4: Criar e editar Objetivo, KR e Plano (painéis)

As a gestor,
I want criar e editar objetivos, KRs e os dados do plano em painéis sobre o contexto,
So that eu mantenha o plano sem sair da tela de acompanhamento.

**Acceptance Criteria:**

**Given** o acompanhamento
**When** uso os "add cards" pontilhados ou as ações de editar
**Then** posso criar Objetivo e KR (FR-22/UX-DR9) e editar plano (incl. intervalo de datas), objetivo (incl. responsáveis) e KR em `Sheet`/`Dialog` sobre o contexto (FR-23/FR-24/FR-25/UX-DR13)
**And** ao salvar, a tela reflete a mudança sem recarregar a página inteira
**And** as actions usadas são as existentes (`createObjetivo`/`updateObjetivo`/`createKeyResult`/`updateKeyResult`/`updatePlano`).

### Story 2.5: Excluir elementos com confirmação

As a gestor,
I want excluir plano, objetivo ou KR com uma confirmação clara,
So that eu não remova dados por engano.

**Acceptance Criteria:**

**Given** uma ação de excluir em plano/objetivo/KR
**When** aciono excluir
**Then** um `Dialog` de confirmação mostra a consequência explícita (ex.: "os resultados-chave também serão removidos") (FR-27/UX-DR20)
**And** ao confirmar, a action de delete correspondente roda e a UI atualiza com feedback
**And** ao cancelar, nada muda.

### Story 2.6: Histórico e linha de tendência do KR

As a responsável/gestor,
I want ver o histórico de valores e a tendência de um KR,
So that eu entenda a evolução e a projeção.

**Acceptance Criteria:**

**Given** um KR com histórico
**When** abro "ver histórico"
**Then** um gráfico mostra os pontos de `HistoricoValores` e a projeção de `gerarLinhaTendencia` (FR-28/UX-DR22)
**And** os eixos de data e valor estão corretos e legíveis
**And** o gráfico recebe os dados como props (componente dumb), com a lógica de série em `features/key-result/`.

---

## Epic 3: Criação de planos

Redesenha `(app)/planos` (lista) e `(app)/criador` (wizard). Consome `/api/ai/*` existentes.

### Story 3.1: Lista de planos navegável

As a usuário,
I want ver meus planos como cartões e abrir cada um,
So that eu acesse o acompanhamento rapidamente e crie novos planos.

**Acceptance Criteria:**

**Given** a rota `(app)/planos`
**When** a página carrega
**Then** os planos aparecem como cartões navegáveis (não árvore inline) (FR-10)
**And** clicar num cartão abre o workspace de acompanhamento dedicado do plano (FR-11)
**And** sem planos, vejo o estado vazio "Nenhum plano ainda. Crie o primeiro." + CTA (FR-12/UX-DR17)
**And** a ação primária de criar plano (leva ao wizard) está sempre acessível (FR-13).

### Story 3.2: Wizard de plano estratégico (estrutura em passos)

As a administrador (Carla),
I want um wizard em passos com progresso visível,
So that eu monte o plano estratégico de forma guiada.

**Acceptance Criteria:**

**Given** o `(app)/criador`
**When** percorro o wizard
**Then** os passos seguem a ordem missão→visão→valores→SWOT→objetivos→KRs com indicador "Passo N de M" (FR-14/UX-DR14)
**And** posso avançar/voltar sem perder o que já preenchi
**And** cada passo anuncia sua posição para leitores de tela (UX-DR18).

### Story 3.3: Sugestão de IA por campo

As a administrador (Carla),
I want sugestões de IA editáveis em cada campo,
So that eu acelere o preenchimento sem perder o controle.

**Acceptance Criteria:**

**Given** um campo assistido (missão/visão/valores/oportunidades/ameaças/objetivos/KRs)
**When** aciono "Sugerir com IA"
**Then** a UI consome o endpoint `/api/ai/*` existente e mostra estados carregando→preenche editável (FR-15/UX-DR14)
**And** o conteúdo gerado é sempre editável antes de avançar; nunca é imposto (FR-16)
**And** se a IA falhar, vejo mensagem inline associada ao campo e posso escrever manualmente (UX-DR17).

### Story 3.4: Publicar plano e plano de apoio

As a administrador (Carla),
I want publicar o plano e poder criar planos de apoio,
So that o plano vire operável e a hierarquia de departamentos exista.

**Acceptance Criteria:**

**Given** o wizard concluído
**When** confirmo a criação
**Then** a action existente persiste o plano e seus objetivos/KRs e me leva ao acompanhamento (FR-17)
**And** a partir de um plano corporativo posso criar um plano de apoio (`createPlanoDepartamento`) com `planoPaiId` correto
**And** o plano de apoio aparece na navegação via breadcrumb (não árvore).

---

## Epic 4: Gestão de usuários

Redesenha `(app)/usuarios`. Reutiliza `inviteUser`/`updateUserPermissions`/`removeUserFromPlano`.

### Story 4.1: Lista de membros, papéis e notificações

As a administrador do cliente,
I want listar membros e gerir papéis e notificações,
So that eu controle quem acessa e como é notificado.

**Acceptance Criteria:**

**Given** a rota `(app)/usuarios`
**When** a página carrega
**Then** vejo a lista de membros do cliente com seus papéis (`PapelPlano`) por plano (FR-29)
**And** posso editar o papel inline e a preferência de notificação, com feedback de sucesso (FR-29/FR-30)
**And** estados vazio/carregando são desenhados (FR-30/UX-DR17)
**And** posso remover um usuário de um plano com confirmação.

### Story 4.2: Convidar membro

As a administrador do cliente,
I want convidar um novo membro por e-mail,
So that minha equipe entre no workspace.

**Acceptance Criteria:**

**Given** a tela de usuários
**When** informo um e-mail e envio o convite
**Then** a action `inviteUser` roda e vejo feedback "Convite enviado" (FR-29/FR-30)
**And** erros de validação (e-mail inválido/duplicado) aparecem inline
**And** falha de e-mail é tratada como não-fatal, com mensagem apropriada.

---

## Epic 5: Entrada pública

Redesenha `/` (landing) e `(auth)/*`. Mantém o padrão `useActionState`.

### Story 5.1: Landing comercial

As a prospect,
I want uma landing que comunique valor e me deixe entrar/cadastrar rápido,
So that eu decida experimentar o produto.

**Acceptance Criteria:**

**Given** a rota `/`
**When** a página carrega
**Then** vejo hero com proposta de valor e ao menos uma seção de prova/benefício (FR-7/UX-DR16)
**And** os CTAs "Entrar" e "Comece agora" estão acima da dobra, levando a `/login` e `/cadastro` (FR-6)
**And** o caminho landing→login→painel é curto (mínimo de passos), refletindo que a credibilidade é decidida no painel
**And** a landing usa os tokens do design system e o fundo `brand-tint` onde apropriado.

### Story 5.2: Login e reset de senha

As a usuário,
I want telas de login e reset limpas e com feedback claro,
So that eu acesse minha conta sem fricção.

**Acceptance Criteria:**

**Given** `/login` e `/reset-senha`
**When** submeto o formulário
**Then** o layout é um cartão centrado sobre fundo `brand-tint`, padrão `useActionState` (FR-8/UX-DR15)
**And** erros de validação esperados aparecem inline sem navegar nem perder dados (FR-8)
**And** os três estados — carregando (botão desabilitado + indicador), erro e sucesso/redirecionamento — são visíveis e consistentes (FR-9).

### Story 5.3: Cadastro

As a novo usuário,
I want criar minha conta numa tela clara,
So that eu comece a usar o produto.

**Acceptance Criteria:**

**Given** `/cadastro`
**When** preencho e submeto
**Then** a tela segue o mesmo padrão de cartão centrado e estados de FR-8/FR-9
**And** ao criar a conta, o e-mail de boas-vindas (Brevo) é disparado como hoje (não-fatal) e sou levado ao app
**And** os mesmos componentes de formulário das outras telas de auth são reutilizados (FR-9).
