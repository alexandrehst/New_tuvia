---
title: Sprint Change Proposal — Contrato Comportamental & de Segurança
status: proposed
created: 2026-06-22
author: Alexandretorres (via bmad-correct-course)
mode: batch
related:
  - prds/prd-okr-2026-06-18/prd.md
  - epics.md
  - ux-designs/ux-okr-2026-06-18/EXPERIENCE.md
  - ../implementation-artifacts/sprint-status.yaml
---

# Sprint Change Proposal — Contrato Comportamental & de Segurança

## Seção 1 — Resumo do Problema (Issue Summary)

**Gatilho.** Testes manuais pós-redesenho (`docs/resultados-testes.md`) revelaram que o CTA "Comece agora" deixava o usuário autenticado sem verificação nem onboarding. Ao investigar, descobriu-se que **não era um deslize de implementação, e sim um buraco estrutural de especificação**: o PRD/UX/epics do redesenho especificaram *telas e happy-paths*, mas nunca os **contratos de comportamento** — máquinas de estado, autorização a nível de objeto, e decisões de segurança.

**Causa-raiz.** O PRD (`prd.md §3`) declarou explicitamente *"Sem alterar contratos de dados, Server Actions ou endpoints de IA salvo apresentação"* e *"papéis... permanecem como são"*. Isso fez auth, autorização e ciclo de vida serem tratados como "já existe, fora de escopo" — e o comportamento herdado do Bubble/commit inicial foi **presumido correto**, nunca auditado nem especificado.

**Evidência (a spec especificou o inseguro).**
- **Story 5.3** tem como AC literal: *"ao criar a conta... sou levado ao app"* — o comportamento inseguro (cadastro = login imediato, sem verificação) estava **escrito como critério de aceitação**.
- **EXPERIENCE.md (linha 17)** afirma *"Papéis por plano controlam o que cada usuário pode editar"* e **UX-DR17** manda ocultar edição para `viewer` — mas isso virou apenas *esconder botão na UI*; nenhum enforcement no backend foi especificado como story.

**Achados da auditoria de segurança (2026-06-22).** Varredura ampla confirmou a classe inteira de erro:

| # | Achado | Gravidade | Status |
|---|--------|-----------|--------|
| 1 | IDOR cross-tenant em `/planos/[id]` (`getPlanoWithObjetivos` sem escopo de tenant; página não checava posse) | Crítico | ✅ corrigido (Trilha A) |
| 2 | 8 rotas `/api/ai/*` sem auth nem validação (abuso de custo OpenAI + prompt injection) | Alto | ✅ corrigido (Trilha A) |
| 3 | `/nova-senha` não existe — `resetPassword` aponta e-mail de recovery para rota inexistente | Alto | ⏳ pendente |
| 4 | Cadastro = login imediato sem verificação de e-mail | Grave | ✅ código corrigido; falta toggle no Supabase |
| 5 | RLS ausente no Postgres (isolamento depende de nunca esquecer guard — e #1 provou que esquecemos) | Latente | → Epic 6 |
| 6 | `PapelPlano {owner, editor, viewer}` não é enforçado (autorização só global `requireAdmin`) | Latente | → Epic 6 |
| 7 | `StatusPlano {edicao, publicado, arquivado}` existe no schema+UI mas sem transições nem regra edita-vs-atualiza | Lacuna | → Epic 6 |
| 8 | Onboarding/bootstrap de tenant inexistente (signup → `/planos` vazio) | Lacuna | → Epic 6 |

## Seção 2 — Análise de Impacto (Impact Analysis)

### Impacto em Epics (Seção 2 do checklist)
- **Epics 1–5: todos `done` e permanecem válidos.** Nenhum precisa de rollback — o redesenho visual entregue está correto no seu escopo (UX). O problema é *escopo ausente*, não *escopo errado*.
- **Necessário um novo Epic 6** para o contrato comportamental & de segurança. É escopo NOVO que o PRD do redesenho excluiu deliberadamente; não cabe espremer nos epics fechados.
- **Reordenação/prioridade:** Epic 6 é o de maior risco de negócio agora (vazamento de dados entre clientes já existia em produção). Prioridade alta.

### Conflitos de Artefato (Seção 3 do checklist)
- **PRD** `[Action-needed]`: o §3 ("Fora de escopo: ...papéis... permanecem como são") **conflita** com a necessidade de enforcement. Não invalida o PRD do redesenho — exige um **adendo de escopo** (nova seção) que reconhece o contrato comportamental como trabalho separado e subsequente.
- **Arquitetura** `[Action-needed]`: impacto real em **data model/políticas** (RLS no Postgres — novo), **contrato de autorização** (checagem de papel por plano nas actions/queries), e **máquina de estado** (transições de `StatusPlano` + regra edita-vs-atualiza). O próprio PRD §10 previa `create-architecture "se houver impacto"` — agora há. Recomenda-se um passo de solution-design focado antes das stories de 6.4/6.5/6.6.
- **UX** `[Action-needed]`: precisa de fluxos novos não desenhados — **verificação de e-mail** (estado "verifique seu email"), **redefinição de senha** (`/nova-senha`), **onboarding/bootstrap de tenant** (primeiro acesso), e o **estado "plano publicado: só atualização"** (edição bloqueada). O EXPERIENCE.md já tem o gancho de `viewer` (linha 78) — estender para os demais.
- **Outros artefatos:** testes (novos ACs de regressão para #1/#2 viram permanentes), `docs/architecture.md` (documentar o contrato), `sprint-status.yaml` (adicionar Epic 6).

### Impacto Técnico
- Schema: provável novo campo/uso de `StatusPlano` em transições; políticas RLS por `clienteId`.
- Actions/queries: camada de autorização por papel reutilizável (análoga a `assertMesmoTenant`).
- Auth: página `/nova-senha`; config Supabase "Confirm email".

## Seção 3 — Caminho Recomendado (Recommended Approach)

**Opção escolhida: Ajuste Direto (Direct Adjustment) — adicionar Epic 6 + edições pontuais de artefato.**

- ❌ **Rollback** (Opção 2): não-viável e desnecessário — nada do redesenho entregue está errado; reverter não simplifica nada.
- ❌ **Revisão de MVP** (Opção 3): não-aplicável — não estamos reduzindo escopo, e sim adicionando o contrato que faltava.
- ✅ **Ajuste Direto** (Opção 1): **Esforço Médio-Alto · Risco Médio.** Adiciona um epic coeso, preserva todo o trabalho feito, e fecha a classe de erro de uma vez. Os bugs já corrigidos (#1, #2, #4-código) viram critérios de aceitação permanentes para não reincidir.

## Seção 4 — Propostas Detalhadas de Mudança (Detailed Change Proposals)

### 4.A — Novo Epic 6: Contrato Comportamental & de Segurança

> **Objetivo do epic:** especificar e impor os contratos que o redesenho não cobriu — estado, autorização a nível de objeto e identidade — com os bugs já corrigidos travados por testes de regressão. Brownfield; reutiliza os guards existentes (`requireUser`/`requireAdmin`/`assertMesmoTenant`).

**Stories propostas:**

- **6.1 — Contrato de auth & sessão.** Formaliza a matriz de acesso por estado (`anônimo | autenticado-não-verificado | autenticado`): rotas públicas barram usuário logado (✅ já feito), área `(app)` exige sessão (✅ já feito), e a **política de verificação de e-mail** (decisão: exigir confirmação) — incl. ligar "Confirm email" no Supabase e documentar. *Fecha #4. Absorve como AC de regressão o guard de páginas de auth.*
- **6.2 — Redefinição de senha (`/nova-senha`).** Cria a página que recebe a sessão de recovery do e-mail e permite definir nova senha; conecta `resetPassword` → `/nova-senha` ponta-a-ponta, com os 3 estados (carregando/erro/sucesso) do padrão de auth. *Fecha #3. Completa a Story 5.2.*
- **6.3 — Onboarding / bootstrap de tenant.** Primeiro acesso pós-verificação: garante contexto de `Cliente`, conduz à criação do primeiro plano (liga ao wizard do Epic 3) em vez de cair num `/planos` vazio sem direção. *Fecha #8.*
- **6.4 — Ciclo de vida do Plano.** Implementa as transições de `StatusPlano {edicao → publicado → arquivado}` e a regra **"edicao aceita edição; publicado só atualização de valores"**; reflete o estado na UI (o que está bloqueado e por quê). *Fecha #7; é o item 3b dos testes.*
- **6.5 — Enforcement de papel por plano.** Impõe `PapelPlano {owner, editor, viewer}` nas actions/queries (não só ocultar na UI): camada de autorização reutilizável; `viewer` não consegue mutar mesmo chamando a action direto. *Fecha #6; honra EXPERIENCE.md linha 17 e UX-DR17.*
- **6.6 — RLS no Postgres (defesa em profundidade).** Políticas por `clienteId` no Supabase para que o isolamento não dependa de lembrar o guard na aplicação. *Fecha #5; respalda #1.*

**Critérios de aceitação de regressão (permanentes, herdados pelo epic):**
- Nenhuma query/action retorna recurso de outro `clienteId` (trava #1 — IDOR).
- Toda rota `/api/ai/*` exige autenticação e valida input (trava #2).

### 4.B — Edições em artefatos existentes

- **Story 5.3 (epics.md), AC:**
  - OLD: *"ao criar a conta, o e-mail de boas-vindas (Brevo) é disparado como hoje (não-fatal) e **sou levado ao app**"*
  - NEW: *"ao criar a conta, o e-mail de boas-vindas é disparado (não-fatal) e, com verificação exigida, **vejo o estado 'verifique seu email' — não sou autenticado até confirmar** (ver Epic 6.1)"*
  - Rationale: o AC antigo codificava o comportamento inseguro; alinhar ao contrato.
- **Story 4.1 (epics.md), AC — adicionar:** *"a edição de papel/notificação é **imposta no backend** por papel (não só ocultada na UI) — ver Epic 6.5"*.
- **PRD (`prd.md`) — adicionar Seção 13 "Contrato Comportamental & de Segurança"** (adendo de escopo): registra que auth/autorização/ciclo-de-vida foram fora-de-escopo no redesenho e agora são tratados no Epic 6; e ajustar a nota de §3 para referenciar o adendo (em vez de "papéis permanecem como são" sem ressalva).
- **`docs/architecture.md`** — documentar o contrato de autorização, o RLS e a máquina de estado do Plano (após o solution-design).

## Seção 5 — Handoff de Implementação (Implementation Handoff)

**Classificação de escopo: MAJOR** — novo epic + mudanças de PRD + impacto de arquitetura (RLS, máquina de estado, modelo de autorização).

**Sequência de handoff recomendada:**
1. **Arquitetura (solution-design focado)** para 6.4/6.5/6.6 — `bmad-create-architecture` no recorte de segurança/ciclo-de-vida (RLS, camada de authz por papel, transições de estado). *(O PRD §10 já previa este passo "se houver impacto".)*
2. **Stories** — `bmad-create-story` por story do Epic 6, na ordem: 6.2 e 6.1 (rápidas, fecham bugs vivos #3/#4) → 6.5/6.6 (isolamento/authz) → 6.4 (ciclo de vida) → 6.3 (onboarding, depende de 6.1).
3. **Implementação** — `bmad-dev-story` (test-first, gate 90% em `features/**`).
4. **Edições de artefato** (4.B) aplicadas junto ao update do `sprint-status.yaml`.

**Critérios de sucesso:** os 8 achados fechados; testes de regressão de #1/#2 verdes; suíte e build limpos; e a classe de erro ("spec sem contrato") documentada como aprendizado.
