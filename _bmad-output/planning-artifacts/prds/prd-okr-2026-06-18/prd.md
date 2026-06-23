---
title: PRD — Redesenho de UX do OKR SaaS
status: final
created: 2026-06-18
updated: 2026-06-18
---

# PRD — Redesenho de UX do OKR SaaS

## 1. Visão Geral

O OKR SaaS é a reconstrução, em Next.js, de um produto de gestão de OKRs antes feito em Bubble. A **funcionalidade** já existe (autenticação, criação de plano estratégico assistida por IA, hierarquia de planos, acompanhamento de objetivos e resultados-chave, gestão de usuários). O que **não** existe é uma experiência de uso à altura: a UX atual é considerada inadequada e será **descartada por completo**.

Este PRD define um **redesenho de UX completo** — visual, navegação/arquitetura de informação e fluxos — aplicando uma linguagem de design coesa, profissional e moderna sobre as capacidades já existentes. **Não há features novas em escopo**: a referência de funcionalidade é o que o produto já faz hoje (telas em `docs/screens/`, fluxos em `docs/flows/`, regras em `_bmad-output/project-context.md` e `docs/architecture.md`).

O norte visual é o dashboard de referência em `docs/screens/new/` (estilo "Kalungi"): claro, arredondado, com sidebar de navegação, faixa de resumo com indicadores circulares e OKRs apresentados como cartões com pills de status.

### Por que agora

O produto está sendo posicionado como **SaaS comercial em lançamento** (multi-tenant, com landing page e cadastro público). Nesse contexto, a percepção de qualidade da interface é um gargalo direto: uma UX amadora corrói credibilidade em demos, no onboarding e na decisão de compra. O redesenho é pré-requisito para o produto se apresentar como digno de confiança.

---

## 2. Objetivos e Métricas de Sucesso

**Objetivo central:** elevar a percepção de qualidade e credibilidade do produto a um patamar comercial, sem alterar o que o produto faz.

O sucesso é primariamente **qualitativo** (percepção/credibilidade). Métricas:

| # | Métrica de sucesso | Como avaliar | Alvo |
|---|---|---|---|
| M1 | Percepção de profissionalismo em demos / testes de usabilidade | Avaliação qualitativa estruturada com 5+ usuários/prospects ("parece um produto pronto para comprar?") | Maioria positiva; ausência de comentários de "parece amador/incompleto" |
| M2 | Consistência visual entre telas | Auditoria de design: todas as telas usam o mesmo design system (tokens, componentes, espaçamento) | 100% das telas em escopo aderentes |
| M3 | Clareza de leitura de status de OKR | Teste de tarefa: usuário identifica corretamente o que está atrasado/no prazo na tela de acompanhamento | ≥90% de acerto sem ajuda |
| M4 `[ASSUMPTION]` | Eficiência preservada ou melhorada | Tarefas-chave (criar plano, atualizar KR, ler status) não ficam mais lentas que hoje | Tempo igual ou menor |

**Contra-métricas (não regredir ao perseguir o visual):**

- **CM1 — Funcionalidade intacta:** nenhum recurso existente pode ser perdido ou quebrado pelo redesenho.
- **CM2 — Sem inflar complexidade:** o número de passos/cliques para tarefas-chave não deve aumentar em nome da estética.
- **CM3 — Performance percebida:** o visual mais rico (sombras, gauges, avatares) não pode degradar tempo de carregamento ou responsividade percebida.

---

## 3. Escopo

**Em escopo:**

- Redesenho visual completo de **todas** as telas existentes (ver §6).
- Nova navegação / arquitetura de informação (shell autenticado com sidebar).
- Revisão dos fluxos de cada tarefa-chave (sem mudar o resultado funcional).
- Definição de uma **linguagem de design / design system** reutilizável (§4).
- Suporte a **dark mode** `[ASSUMPTION]` (toggle presente na referência).
- Responsividade **desktop-first** com comportamento razoável em telas menores.

**Fora de escopo:**

- Features novas ou mudança de regras de negócio (cálculo de progresso/risco, hierarquia, multi-tenant, papéis, integrações de IA/e-mail permanecem como são). **Ressalva (2026-06-22):** auth, autorização a nível de objeto e ciclo de vida do plano foram fora-de-escopo aqui e são tratados separadamente — ver §13.
- Mudanças de backend, schema, Server Actions ou contratos de dados — salvo ajustes mínimos de apresentação.
- Mobile como cidadão de primeira classe (telas mobile dedicadas) — fora por ora.
- Internacionalização além de **pt-BR** (idioma do domínio e da UI permanece pt-BR).
- Marca própria (logo/nome): adota-se a paleta do exemplo como base; identidade própria fica para depois.

---

## 4. Linguagem de Design (norte visual)

Extraída do dashboard de referência (`docs/screens/new/`). Serve de base para o `bmad-ux` detalhar o design system.

**Tom geral:** claro, espaçoso, profissional, "calmo". Muito branco/cinza-claro, cantos arredondados, sombras suaves e sutis, azul como cor de ação/marca.

**Elementos da linguagem:**

- **Sidebar de navegação** fixa à esquerda: seletor de workspace/tenant no topo, itens de navegação com ícone + rótulo, item ativo destacado em azul, toggle de **dark mode** no rodapé, colapsável.
- **Topbar contextual:** título da tela atual + ações à direita (ex.: seletor de período, editar, ajuda, notificações, avatar do usuário).
- **Faixa de resumo:** cartões com **gauges circulares** (ex.: "Progresso geral", "Tempo decorrido") e **contadores** (Total / Abertos / Concluídos).
- **Cartões de OKR:** Objetivo como cabeçalho de coluna/cartão; cada Resultado-Chave é um cartão com **pill de status** (Adiantado / No prazo / Atrasado / Concluído — mapeando o cálculo de risco existente), barra de progresso, % e valor absoluto (atual/alvo), avatar do responsável, ações inline e timestamp ("atualizado há X").
- **Estados vazios e de adição** com affordance clara (ex.: cartão pontilhado "Adicionar novo Objetivo").
- **Tipografia** limpa e hierárquica; números em destaque.
- **Cores de status semânticas** consistentes (verde = ok/adiantado, vermelho/âmbar = atrasado/risco, azul = neutro/no prazo), reaproveitando a lógica de `calculateRisk`.

**Base técnica do design system** (detalhe em `addendum.md`): componentes shadcn v4 sobre **Base UI** (não Radix), Tailwind v4 com tokens via CSS, `cva` para variantes. A maioria dos primitivos de UI já foi adicionada ao projeto (`src/components/ui/`).

---

## 5. Usuários

Produto multi-tenant; cada `Cliente` (organização) tem seus usuários. Papéis derivam de `PlanoUsuario.Papel`. Personas relevantes para a UX (contexto inline, sem seção de persona formal):

- **Administrador do Cliente** — cria a conta, configura o plano estratégico (wizard com IA), convida e gerencia usuários. Quer transmitir/perceber profissionalismo e montar a estrutura rápido.
- **Gestor de plano/departamento** — cria planos de apoio, objetivos e KRs; acompanha o progresso do seu nível.
- **Responsável por Objetivo/KR** — atualiza valores de KR periodicamente e lê o status. É quem mais volta ao produto; a fricção de atualização precisa ser mínima.
- **Visitante/prospect** (não autenticado) — chega pela landing page; decide se cria conta. Primeiro a julgar a credibilidade visual.

### Jornadas-chave

Narrativas que o `bmad-ux` deve sustentar (protagonistas ilustrativos, `[ASSUMPTION]`):

- **UJ-1 — Carla monta o primeiro plano.** Carla, head de estratégia, acabou de criar a conta. Entra no shell, encontra o estado vazio da lista de planos e o CTA de criar. No wizard, escreve a missão, mas usa "sugerir com IA" para visão, valores e SWOT — edita o que a IA propôs. Gera objetivos e KRs assistidos, publica e cai direto no acompanhamento, vendo seu plano vivo. *Toca:* FR-12, FR-13, FR-14, FR-15, FR-16, FR-17, FR-18.
- **UJ-2 — Bruno atualiza um KR na segunda de manhã.** Bruno é responsável por um resultado-chave. Abre o plano, localiza seu cartão de KR (avatar dele), clica em atualizar, digita o novo valor num painel rápido e salva. A barra de progresso e a pill de status se atualizam na hora; ele não trocou de página. *Toca:* FR-19, FR-20, FR-21, FR-26.
- **UJ-3 — Marina lê o status antes da reunião.** Marina, gestora de departamento, abre o acompanhamento e em segundos lê a faixa de resumo (progresso geral, tempo decorrido) e varre as colunas: as pills vermelhas saltam — sabe o que está atrasado sem abrir nada. *Toca:* FR-18, FR-19, FR-20, NFR-7.

---

## 6. Requisitos por Tela

FRs agrupados por área, com IDs estáveis e globais. Todos descrevem a **experiência redesenhada** — o resultado funcional permanece o já existente.

### A. Shell autenticado & Navegação (`(app)/layout`)

- **FR-1.** Toda tela autenticada usa um shell comum com **sidebar de navegação** persistente (Planos, Usuários e demais áreas), item ativo destacado.
- **FR-2.** A sidebar exibe um **seletor de workspace/cliente** no topo identificando o tenant atual.
- **FR-3.** A sidebar é **colapsável** e oferece **toggle de dark mode** `[ASSUMPTION]` com persistência da preferência.
- **FR-4.** Uma **topbar contextual** mostra o título da área atual, ações relevantes e identidade do usuário (avatar + menu com logout).
- **FR-5.** A navegação reflete a **hierarquia de planos** (corporativo ↔ apoio) sem expor uma árvore aninhada profunda — via breadcrumb/contexto. `[ASSUMPTION]`

### B. Landing page (`/`)

- **FR-6.** Página comercial redesenhada usando os tokens/componentes do design system (§4), com CTAs de **"Entrar"** e **"Comece agora"** ambos visíveis acima da dobra e levando, respectivamente, a `/login` e `/cadastro`.
- **FR-7.** A landing tem, no mínimo, hero com proposta de valor e uma seção de prova/benefício. Conteúdo de marketing detalhado `[ASSUMPTION]` fica para o `bmad-ux`/copy.

### C. Autenticação (`/login`, `/cadastro`, `/reset-senha`)

- **FR-8.** Telas de login, cadastro e reset de senha redesenhadas em layout de cartão centrado, mantendo o padrão `useActionState`: cada erro de validação esperado aparece **inline** (sem navegar nem perder os dados digitados).
- **FR-9.** Todo formulário de auth expõe três estados visíveis e distinguíveis: **carregando** (botão desabilitado + indicador), **erro** (mensagem por campo ou geral) e **sucesso** (confirmação / redirecionamento), reutilizando os mesmos componentes em todas as telas.

### D. Lista de Planos (`(app)/planos`)

- **FR-10.** Lista de planos estratégicos apresentada como **itens/cartões navegáveis** (não árvore inline profunda). `[ASSUMPTION]`
- **FR-11.** Clicar em um plano abre o **workspace de acompanhamento dedicado** (ver área F). `[ASSUMPTION]`
- **FR-12.** **Estado vazio** desenhado (mensagem + CTA de criar) quando não há planos.
- **FR-13.** Ação primária de **criar novo plano** (leva ao wizard, área E) sempre acessível.

### E. Wizard de Plano Estratégico (`(app)/criador`)

- **FR-14.** Fluxo de criação em **passos claros** (ex.: missão → visão → valores → SWOT → objetivos → KRs), com progresso do wizard visível.
- **FR-15.** Cada campo assistido por IA (missão, visão, valores, oportunidades, ameaças, objetivos, key-results) tem uma affordance de **"sugerir com IA"** com estados de carregando/erro/aceitar-editar, preservando os endpoints existentes.
- **FR-16.** O usuário pode **editar** qualquer sugestão de IA antes de seguir; o conteúdo gerado nunca é imposto.
- **FR-17.** Ao concluir, o plano é **publicado** e o usuário é levado ao acompanhamento (área F), preservando o comportamento atual.

### F. Acompanhamento de OKRs (`(app)/planos/[id]`) — tela-herói

- **FR-18.** **Faixa de resumo** no topo com progresso geral, **tempo decorrido** (derivado de `dataInicio`/`dataFim` do plano — não há entidade de ciclo/trimestre) e contadores de KRs (total / abertos / concluídos), usando gauges e números em destaque.
- **FR-19.** Objetivos apresentados como **colunas/cartões**; cada um listando seus Resultados-Chave.
- **FR-20.** Cada **cartão de KR** mostra: descrição, **pill de status** semântica (mapeada de `calculateRisk`), **barra de progresso**, **% e valor atual/alvo**, **avatar do responsável** e **timestamp** de última atualização.
- **FR-21.** Ações inline no cartão de KR: **atualizar valor** (ver área G), editar, ver histórico — sem sair da tela quando possível.
- **FR-22.** Affordances de **adicionar objetivo** e **adicionar KR** (cartão pontilhado / botão) coerentes com a referência.
- **FR-23.** O intervalo do plano (`dataInicio`–`dataFim`) é exibido no contexto da tela; **não há seletor de trimestre/ciclo** (o domínio não modela ciclos). Acesso à edição do plano sempre disponível.
- **FR-24.** A lista de **responsáveis** do plano/objetivos é visível/acessível a partir desta tela.

### G. Edição de Objetivo, KR e Atualização de Valor (painéis)

- **FR-25.** Edição de **plano**, **objetivo** (com atribuição de responsáveis) e **resultado-chave** em **painéis/sheets** sobre o contexto, evitando troca de página quando possível.
- **FR-26.** **Atualização de valor de KR** é uma interação rápida e de baixa fricção (painel/inline) que, ao salvar, reflete imediatamente progresso e status recalculados na tela — preservando a cadeia existente (HistoricoValores → recálculo de KR → progresso ponderado do Objetivo → e-mail).
- **FR-27.** **Excluir** qualquer elemento (plano/objetivo/KR) tem confirmação clara e feedback.
- **FR-28.** O KR oferece acesso a uma visualização de **histórico de valores** (de `HistoricoValores`) e **linha de tendência** (de `gerarLinhaTendencia`) — no mínimo um gráfico com os pontos registrados e a projeção. Formato exato do gráfico `[ASSUMPTION]`, a definir no `bmad-ux`.

### H. Gestão de Usuários (`(app)/usuarios`)

- **FR-29.** Tela de gestão de usuários redesenhada: listar membros do cliente, **convidar**, atribuir/editar **papéis** por plano, e refletir preferências de notificação existentes.
- **FR-30.** Estados de lista (vazio, carregando) e feedback de ações (convite enviado, papel alterado) consistentes.

---

## 7. Requisitos Não-Funcionais (transversais)

- **NFR-1 — Design system único:** todas as telas consomem os mesmos tokens e componentes (`src/components/ui/`); nada de estilos ad-hoc divergentes.
- **NFR-2 — Responsividade desktop-first:** otimizado para desktop; em larguras menores o layout degrada com elegância (sidebar colapsa, colunas viram pilha) sem quebrar.
- **NFR-3 — Dark mode** `[ASSUMPTION]`**:** paridade visual entre temas claro/escuro nos componentes do design system.
- **NFR-4 — Acessibilidade base:** contraste adequado, foco visível, navegação por teclado e rótulos/ARIA nos componentes interativos (herdados do Base UI, não regredir).
- **NFR-5 — Performance percebida:** uso de skeletons/estados de carregamento; o redesenho não degrada o tempo de interação atual.
- **NFR-6 — Idioma pt-BR:** toda a UI e o domínio em pt-BR, com ortografia correta (acentuação).
- **NFR-7 — Consistência de status:** cores e rótulos de status (adiantado/no prazo/atrasado/concluído) idênticos em toda a aplicação, derivados da lógica de risco existente.

---

## 8. Restrições

Capacidades, não implementação — detalhe técnico em `addendum.md`.

- O redesenho roda sobre a stack existente: **Next.js 16 (App Router, Server Components), React 19, Tailwind v4, shadcn v4 sobre Base UI** (não Radix), Prisma/Supabase.
- **Sem alterar contratos de dados, Server Actions ou endpoints de IA** salvo apresentação.
- Padrões do projeto preservados: mutações via Server Actions, `useActionState` em forms, sem Prisma em componentes, multi-tenant por `clienteId`.

---

## 9. Riscos & Questões em Aberto

- **R1 — Fork de IA de navegação (lista árvore vs. workspace dedicado):** FR-5/FR-10/FR-11 assumem abandonar a árvore inline. Se a hierarquia de planos for profunda/numerosa no uso real, o modelo de navegação precisa validar isso. **Decidir antes do `bmad-ux`.**
- **R2 — Dark mode no escopo?** Assumido por estar na referência; dobra o esforço de QA visual. Confirmar.
- **R3 — Fluxos sem documentação:** `acompanhamento_objetivos`, `criador_plano_estrategico` e `gestao_usuarios` estão vazios em `docs/flows/`; o desenho destas telas se apoia em PNGs antigos + `project-context.md` e pode ter lacunas funcionais.
- **R4 — Landing page comercial:** conteúdo/seções de marketing (FR-6/FR-7) precisam de direção de copy/posicionamento que este PRD não fixa.
- **Q1 — Período/ciclo:** ~~o produto trabalha com ciclos/trimestres?~~ **Resolvido:** não há entidade de ciclo no schema; o `Plano` tem apenas `dataInicio`/`dataFim`. O "Q4 2022" da referência vira o intervalo do plano (FR-18/FR-23).
- **Q2 — Marca:** nome/logo do produto a definir; por ora paleta do exemplo.

---

## 10. Próximos Passos

PRD leve → **`bmad-ux`** (especificação de UX/UI e design system detalhado sobre estes FRs) → `bmad-create-architecture` (se houver impacto) → `bmad-create-epics-and-stories`.

---

## 13. Contrato Comportamental & de Segurança (adendo — 2026-06-22)

> Adendo de escopo, fora do redesenho de UX original. Ver `sprint-change-proposal-2026-06-22.md` e Epic 6 em `epics.md`.

Este PRD especificou **telas e happy-paths**, mas não os **contratos de comportamento**: máquinas de estado, autorização a nível de objeto e política de identidade. A auditoria pós-testes (2026-06-22) mostrou que essa lacuna produziu uma classe de erro grave (ex.: IDOR cross-tenant; rotas de IA sem auth; cadastro sem verificação) — alguns inclusive **codificados como AC** (Story 5.3). O contrato abaixo passa a ser requisito, implementado no **Epic 6**:

- **CB-1 — Contrato de auth/sessão:** matriz de acesso por estado (`anônimo | autenticado-não-verificado | autenticado`); rotas públicas barram usuário logado; área `(app)` exige sessão; **cadastro exige verificação de e-mail** (não autentica antes de confirmar).
- **CB-2 — Redefinição de senha completa:** `/nova-senha` recebe a sessão de recovery; fluxo de reset ponta-a-ponta.
- **CB-3 — Onboarding / bootstrap de tenant:** primeiro acesso conduz ao primeiro plano em vez de uma app vazia.
- **CB-4 — Ciclo de vida do Plano:** `StatusPlano {edicao, publicado, arquivado}` com transições e a regra "edicao edita; publicado só atualiza valores".
- **CB-5 — Autorização por papel:** `PapelPlano {owner, editor, viewer}` **imposto no backend** (não só ocultado na UI).
- **CB-6 — Isolamento multi-tenant em profundidade:** RLS no Postgres por `clienteId`, redundante aos guards de aplicação.
- **CB-7 — Regressão travada:** isolamento cross-tenant (IDOR) e auth+validação nas rotas `/api/ai/*` permanecem como critérios de aceitação permanentes.

## 11. Glossário

| Termo | Significado |
|---|---|
| **Cliente / tenant** | Organização dona dos dados; isolamento multi-tenant por `clienteId`. |
| **Plano** | Plano estratégico. Corporativo (`planoPaiId: null`) ou de apoio. Tem `dataInicio`/`dataFim`. |
| **Plano de apoio** | Plano de departamento/segundo nível, aponta para o plano-pai. |
| **PlanoEstrategico** | Registro auxiliar com os inputs do wizard (missão, visão, valores, SWOT); não é pai na hierarquia. |
| **Objetivo** | Meta qualitativa dentro de um plano; tem responsáveis atribuídos. |
| **Resultado-Chave (KR)** | Métrica mensurável de um objetivo, com valor atual/alvo, progresso e status de risco. |
| **Progresso ponderado** | Progresso do objetivo agregado a partir dos pesos dos seus KRs. |
| **Status / risco** | Classificação derivada de `calculateRisk` (adiantado / no prazo / atrasado / concluído). |
| **Responsável** | Usuário designado a um objetivo (`ObjetivoResponsavel`); recebe notificações. |
| **Workspace** | Visão do tenant atual no shell; ponto do seletor na sidebar. |

---

## 12. Índice de Assunções

Inferências marcadas `[ASSUMPTION]` no documento, para validação:

- **A1** (FR-3/NFR-3, R2) — Dark mode está no escopo (toggle presente na referência).
- **A2** (FR-5/FR-10/FR-11, R1) — Abandonar a árvore inline; lista navegável → workspace de acompanhamento dedicado; hierarquia via breadcrumb/switcher.
- **A3** (M4) — A meta de eficiência preservada/melhorada é desejável, mas não é o critério primário de sucesso.
- **A4** (FR-7) — Conteúdo de marketing da landing fica para o `bmad-ux`/copy.
- **A5** (FR-28) — Formato exato do gráfico de histórico/tendência a definir no `bmad-ux`.
- **A6** (§5, Jornadas) — Protagonistas (Carla, Bruno, Marina) são ilustrativos, não personas validadas com usuários reais.
