---
title: EXPERIENCE — Redesenho de UX do OKR SaaS
status: final
created: 2026-06-18
updated: 2026-06-18
sources:
  - ../../prds/prd-okr-2026-06-18/prd.md
name: OKR SaaS
---

# OKR SaaS — Experience Spine

> Como o produto funciona: IA, comportamento, estados, interações, acessibilidade e fluxos. Identidade visual em `DESIGN.md` (referenciada por `{token}`). Spines vencem em conflito com qualquer mock. SaaS multi-tenant, desktop-first responsivo.

## Foundation

Web responsiva, **desktop-first**. shadcn v4 sobre **Base UI** + Tailwind v4 (Next.js 16 App Router, Server Components por padrão). A biblioteca de componentes faz a maior parte; a disciplina é "respeitar os defaults exceto onde a camada de marca sobrepõe" — ver `DESIGN.md`. Multi-tenant: cada `Cliente` é um workspace isolado; o usuário opera dentro de um tenant por vez (workspace switcher). Papéis por plano (`PapelPlano`, default `viewer`) controlam o que cada usuário pode editar.

## Information Architecture

Navegação confirmada: **lista de planos → workspace de acompanhamento dedicado** (a árvore inline foi descartada).

| Surface | Alcançada por | Propósito |
|---|---|---|
| Landing (`/`) | Público | Proposta de valor; CTAs "Entrar" e "Comece agora". |
| Auth (`/login`, `/cadastro`, `/reset-senha`) | Landing / link | Entrar, criar conta, redefinir senha. Fundo `{colors.brand-tint}`. |
| Lista de planos (`(app)/planos`) | Sidebar (item ativo) / pós-login | Cartões navegáveis dos planos estratégicos. Estado vazio + CTA criar. |
| Acompanhamento (`(app)/planos/[id]`) | Cartão de plano | **Tela-herói.** Faixa de resumo + Objetivos em colunas + cartões de KR. |
| Wizard criador (`(app)/criador`) | CTA "criar plano" | Cria plano estratégico passo a passo (missão→visão→valores→SWOT→objetivos→KRs), com sugestão de IA por campo. |
| Gestão de usuários (`(app)/usuarios`) | Sidebar | Listar membros, convidar, atribuir papéis, preferências de notificação. |

**Painéis/sheets sobre contexto** (não navegam de página): editar plano, editar objetivo (com responsáveis), editar KR, **atualizar valor de KR**, **histórico/tendência de KR**, confirmar exclusão.

**Hierarquia corporativo↔apoio:** exposta por **breadcrumb** no topo do acompanhamento (Plano corporativo › Plano de apoio) e por um seletor de plano de apoio — nunca por árvore aninhada. A sidebar colapsa a ícones em `md` e vira `Sheet` em `sm`.

→ Referência de composição: [`mockups/acompanhamento.html`](mockups/acompanhamento.html) (tela-herói renderizada). Spine vence em conflito.

## Voice and Tone

Microcopy em **pt-BR**, ortografia correta. Tom: claro, profissional, direto — sem euforia, sem jargão corporativo vazio. Voz de marca/postura estética em `DESIGN.md`.

| Do | Don't |
|---|---|
| "Nenhum plano ainda. Crie o primeiro." | "Ops! Você não tem planos. 😢" |
| "Atualizado há 2 dias" | "Última atualização: 16/06/2026 14:32:01" |
| "Sugerir com IA" | "✨ Gerar magicamente com inteligência artificial" |
| "Risco alto" / "Em atraso" (rótulo do status) | Confiar só na cor para comunicar status |
| "Excluir objetivo? Os resultados-chave também serão removidos." | "Tem certeza absoluta dessa ação irreversível?" |

## Component Patterns

Comportamental. Specs visuais em `DESIGN.md.Components`.

| Componente | Onde | Regras de comportamento |
|---|---|---|
| Cartão de KR | Acompanhamento | Hover (desktop) revela ações: atualizar valor, editar, histórico. Pill de status derivada de `calcularRisco` — **nunca** definida na UI. Toque (touch) mostra ações sempre. |
| Atualizar valor (painel) | Acompanhamento | Painel/sheet rápido. Ao salvar: grava `HistoricoValores` → recalcula progresso/risco do KR → recalcula progresso ponderado do Objetivo → dispara e-mail (não-fatal). A barra e a pill atualizam **na hora**, sem trocar de página. |
| Coluna de Objetivo | Acompanhamento | Cabeçalho com título + progresso ponderado + ações (editar, +KR, excluir). Lista os KRs abaixo. |
| Add card (pontilhado) | Acompanhamento | "+ Adicionar Objetivo" / "+ KR". Abre o painel de criação correspondente. |
| Passo do wizard + Sugerir IA | Criador | Cada campo assistido tem botão "Sugerir com IA": estados carregando→preenche editável; o conteúdo **nunca** é imposto, sempre editável antes de avançar. Progresso do wizard visível. |
| Workspace switcher | Sidebar (topo) | Mostra o tenant atual; troca de `Cliente` quando o usuário pertence a mais de um. |
| Breadcrumb de plano | Acompanhamento | Plano corporativo › plano de apoio. Clicável; substitui a árvore. |
| Confirmar exclusão | Global | `Dialog` com consequência explícita (ex.: KRs filhos some junto). Sem exclusão silenciosa. |
| Linha de usuário | Gestão de usuários | Papel editável inline (`PapelPlano`); convite por e-mail; toggle de notificação. |

## State Patterns

| Estado | Surface | Tratamento |
|---|---|---|
| Carga fria | Lista / Acompanhamento | `Skeleton` (cartões/colunas) no layout esperado. Resolve com dados. |
| Sem planos | Lista de planos | Estado vazio: "Nenhum plano ainda. Crie o primeiro." + botão primário. |
| Plano sem objetivos | Acompanhamento | Faixa de resumo zerada + add card em destaque: "Adicione o primeiro objetivo." |
| IA gerando | Wizard | Indicador no campo/botão; demais campos seguem editáveis. |
| IA falhou | Wizard | Inline: "Não foi possível sugerir agora. Tente de novo ou escreva manualmente." Campo permanece editável. |
| Salvou KR | Acompanhamento | Otimista: barra + pill recalculam imediatamente; `aria-live` anuncia o novo status. |
| Falha ao salvar KR | Acompanhamento | `Toast` destrutivo: "Não foi possível salvar. Tente de novo." Valor digitado preservado. |
| E-mail falhou | (silencioso) | Envio é não-fatal — o fluxo segue; nenhum erro de e-mail bloqueia ou alarma o usuário. |
| Sem permissão (viewer) | Acompanhamento / Usuários | Ações de edição/exclusão ocultas (não desabilitadas com erro); leitura plena. |
| 100% concluído | KR / progress-bar | Tratamento de "concluído" (preenchimento verde + check), distinto da pill de risco. |

## Interaction Primitives

- **Painéis sobre contexto:** editar e atualizar acontecem em `Sheet`/`Dialog` sobre a tela atual; o acompanhamento não é abandonado para uma sub-rota sempre que evitável.
- **Atualização otimista** no valor de KR, com reversão + toast em falha.
- **Hover revela ações** de KR no desktop; em touch as ações ficam visíveis.
- **Edição inline** de papel na gestão de usuários (clicar → editar → blur salva).
- **Banido:** scroll infinito (paginação/scroll de coluna delimitado), árvore aninhada profunda na navegação, status comunicado só por cor, pilha de modais > 1 nível.

## Accessibility Floor

Comportamental. Contraste visual em `DESIGN.md` (deltas de marca verificados em AA).

- **WCAG 2.2 AA** em toda a web.
- **Status nunca só por cor:** a pill sempre traz o rótulo textual ("No prazo", "Em atraso", "Em risco", "Risco alto").
- Recalculo de progresso/risco anunciado via `aria-live` após salvar valor.
- `Sheet`/`Dialog` com foco preso e retorno de foco ao gatilho; `Esc` fecha o topo da pilha.
- Ordem de `Tab` segue a ordem de leitura em cada surface; foco visível herda o `ring` do shadcn.
- Sidebar e workspace switcher totalmente operáveis por teclado; item ativo anunciado.
- Wizard: cada passo anuncia posição ("Passo 3 de 6: Valores"); erros de IA associados ao campo via `aria-describedby`.

## Responsive & Platform

| Breakpoint | Comportamento |
|---|---|
| `≥ lg` (1024px+) | Sidebar visível. Acompanhamento em colunas lado a lado; rolagem horizontal se exceder. |
| `md` (768–1023px) | Sidebar colapsa a ícones. Colunas de Objetivo reduzem; faixa de resumo empilha 2-up. |
| `< md` (`sm`) | Sidebar vira `Sheet` pelo topo. Objetivos empilham em coluna única; cartões de KR full-width. Painéis abrem como sheet de baixo/lateral. |

Desktop-first: mobile funciona para ler status e atualizar um KR, mas o foco é desktop/laptop (ver PRD §3 — mobile não é cidadão de primeira classe).

## Inspiration & Anti-patterns

- **Herdado da referência (`docs/screens/new/`, estilo Kalungi):** faixa de resumo com gauges, Objetivos em colunas, cartões de KR com pill de status + barra + avatar + timestamp, cartão pontilhado de adição, sidebar com workspace switcher e toggle de dark mode.
- **Herdado do shadcn:** todo o vocabulário de superfície. A marca é *o que somamos ao shadcn*, não um design system do zero.
- **Rejeitado — árvore inline na lista de planos (R1):** comportamento atual; não escala visualmente e diverge da referência. Substituído por workspace dedicado + breadcrumb. (Decisão confirmada pelo usuário.)
- **Rejeitado — status só por cor:** sempre acompanha rótulo textual.
- **Rejeitado — IA que impõe conteúdo:** toda sugestão (missão/visão/valores/SWOT/objetivos/KRs) é editável antes de avançar; a IA propõe, o usuário decide.
- **Rejeitado — rótulos "Adiantado/Concluído" da referência:** o modelo de risco é `no_prazo | em_atraso | em_risco | risco_alto`; usamos os rótulos reais.

## Key Flows

### Flow 1 — Carla monta o primeiro plano (head de estratégia, conta recém-criada)

1. Carla entra; cai na lista de planos vazia: "Nenhum plano ainda. Crie o primeiro." Clica no botão primário.
2. No wizard, escreve a missão à mão. No passo Visão, toca "Sugerir com IA" — o campo mostra carregando, depois preenche um texto **editável**; ela ajusta duas palavras.
3. Repete para Valores e SWOT, aceitando e editando. Gera objetivos e KRs assistidos; o progresso "Passo 6 de 6" confirma o fim.
4. **Clímax:** ao concluir, o plano é publicado e Carla cai direto no acompanhamento — a faixa de resumo já mostra progresso geral e tempo decorrido (do `dataInicio`/`dataFim`), e as colunas de Objetivo aparecem vivas. Ela vê o plano que descreveu em texto virar um painel operável, sem nenhum passo de "configuração" extra.

Falha: IA indisponível num campo → mensagem inline, campo segue editável; Carla escreve manualmente e avança sem travar.

### Flow 2 — Bruno atualiza um KR na segunda de manhã (responsável)

1. Bruno abre o plano e localiza seu cartão de KR (avatar dele).
2. Hover revela as ações; clica em "atualizar valor". Abre um painel rápido sobre a tela.
3. Digita o novo valor e salva.
4. **Clímax:** sem trocar de página, a barra de progresso avança e a pill de status recalcula (`calcularRisco`) — de "Em atraso" âmbar para "No prazo" verde — e um leitor de tela anuncia a mudança via `aria-live`. O progresso ponderado do Objetivo no topo da coluna também sobe. Bruno fecha o painel e segue o dia.

Falha: salvar falha → `Toast` destrutivo, valor preservado, novo salvar tenta de novo. (E-mail de notificação que falhe não aparece para Bruno — é não-fatal.)

### Flow 3 — Marina lê o status antes da reunião (gestora de departamento)

1. Marina abre o acompanhamento do plano de apoio do seu departamento (breadcrumb mostra: Corporativo › Marketing).
2. Em segundos lê a faixa de resumo: progresso geral e tempo decorrido.
3. **Clímax:** varre as colunas e as pills **vermelhas ("Risco alto") e laranjas ("Em risco") saltam** — sabe exatamente quais resultados-chave estão comprometidos sem abrir nada, porque cor + rótulo carregam o significado juntos. Entra na reunião com a lista de pontos críticos só de ter olhado a tela.
