# Story 6.4: Ciclo de vida do Plano

Status: ready-for-dev

> **Reconciliação (2026-06-22) — ver `_bmad-output/planning-artifacts/architecture-epic6-seguranca.md`.** Decisões que SOBREPÕEM os `[ASSUMPTION]` desta story: (1) o guard de estado deve usar o contrato unificado `assertPodeMutarPlano(planoId, user, operação)` (D1), não um helper isolado; (2) rótulos pt-BR = `edicao`→**"Em planejamento"**, `publicado`→**"Ativo"**, `arquivado`→**"Arquivado"**; (3) transições incluem **`publicado→edicao` via ação "Editar"** (editar um plano Ativo o reabre para Em planejamento — substitui "Despublicar"); forward: edicao→publicado (Ativar), publicado/edicao→arquivado (Arquivar); arquivado é terminal; (4) transições exigem papel `owner` (D2/6.5).

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a gestor de plano,
I want que o plano tenha estados (`edicao | publicado | arquivado`) com regras claras do que se pode editar em cada um,
so that "Atualizar" (valores de KR) e "Editar" (estrutura) deixem de ser confusos e a fronteira seja imposta pelo backend, não só pela UI.

## Acceptance Criteria

1. **Given** `StatusPlano {edicao, publicado, arquivado}` (enum já existente em `prisma/schema.prisma`, default `edicao` no model `Plano`), **When** o plano está em `edicao`, **Then** toda **edição estrutural** é permitida: `updatePlano` (título/datas/frequência), `createObjetivo`/`updateObjetivo`/`deleteObjetivo`, `createKeyResult`/`updateKeyResult`/`deleteKeyResult` — e também `updateKeyResultValor`.
2. **Given** o plano está em `publicado`, **Then** **somente `updateKeyResultValor`** (atualização de valor de KR + histórico) é permitida; **toda** mutação estrutural acima é **bloqueada no backend** com erro de domínio claro (não silenciosamente ignorada).
3. **Given** o plano está em `arquivado`, **Then** **nenhuma** mutação é permitida — nem estrutural, nem `updateKeyResultValor` (somente leitura).
4. **Given** as transições de estado, **Then** existem duas Server Actions de transição — `publicarPlano(planoId)` (`edicao → publicado`) e `arquivarPlano(planoId)` (`publicado → arquivado`) — que **validam a transição de origem no backend** e rejeitam transições inválidas (ex.: publicar um plano já `arquivado`, arquivar um plano em `edicao`). A matriz de transições válidas é a da tabela em Dev Notes.
5. **Given** a regra é compartilhada por várias actions, **Then** há um **helper reutilizável** `assertPlanoEditavel(status, operacao)` em `src/features/plano/lib/status.ts` (mesma família de `assertMesmoTenant`: pura, síncrona, lança erro de domínio) que decide se a operação é permitida para o status — e as actions estruturais e `updateKeyResultValor` passam por ele. A UI **não** é a única barreira (CB-4/CB-5).
6. **Given** a UI do plano (`PlanoCard`, board de objetivos, botões de editar/criar/excluir, painel de KR), **Then** ela **reflete o estado e o que está bloqueado e por quê**: em `publicado`, controles de edição estrutural ficam desabilitados/ocultos com um motivo visível ("Plano publicado — só é possível atualizar valores"); em `arquivado`, a tela é somente-leitura com aviso. Os rótulos pt-BR vêm de `planoStatusLabel` (fonte única — NFR-7).
7. **Given** a transição `publicarPlano`/`arquivarPlano` é uma ação privilegiada, **Then** ela respeita o enforcement de papel por plano (depende da Story 6.5 — ver Dev Notes); enquanto 6.5 não existir, exigir no mínimo `requireUser` + `assertMesmoTenant` e deixar um ponto de extensão marcado `[ASSUMPTION]` para `requirePapel('owner'|'editor', planoId)`.
8. **Given** a suíte de testes (mínimo 90% em `features/**`), **Then** há cobertura: do helper `assertPlanoEditavel` (matriz estado×operação, casos permitido/bloqueado); de cada action estrutural bloqueando quando `publicado`/`arquivado` e permitindo quando `edicao`; de `updateKeyResultValor` permitido em `edicao`/`publicado` e bloqueado em `arquivado`; e das transições válidas/inválidas de `publicarPlano`/`arquivarPlano`. `pnpm typecheck`/`pnpm lint`/`pnpm build` limpos.

## Tasks / Subtasks

- [ ] **Task 1 — Helper de regra de estado (matriz estado→operação)** (AC: 1, 2, 3, 5)
  - [ ] Em `src/features/plano/lib/status.ts` (já existe — fonte única de apresentação de status; **estender, não duplicar**), adicionar:
    - tipo `OperacaoPlano = 'estrutural' | 'valor-kr' | 'transicao'` (ou enum de literais).
    - `function assertPlanoEditavel(status: StatusPlano, operacao: OperacaoPlano): void` — pura/síncrona, lança `Error` com mensagem pt-BR quando a operação não é permitida no status. Seguir a **matriz** da Dev Notes. Espelha o estilo de `assertMesmoTenant` (`src/features/auth/guards.ts:28`).
    - opcional: `podeEditarEstrutura(status): boolean` e `podeAtualizarValor(status): boolean` para a UI consumir sem try/catch.
  - [ ] Mensagens: estrutural bloqueada em `publicado` → "Plano publicado: só é possível atualizar valores dos resultados-chave."; qualquer mutação em `arquivado` → "Plano arquivado: somente leitura."
- [ ] **Task 2 — Impor a regra nas actions estruturais** (AC: 1, 2, 3, 5)
  - [ ] `src/features/plano/actions.ts` → `updatePlano`: já busca `anterior` (que tem `clienteId`); incluir `status` no `select` e, após `assertMesmoTenant`, chamar `assertPlanoEditavel(anterior.status, 'estrutural')` **antes** do `prisma.plano.update`.
  - [ ] `src/features/objetivo/actions.ts` → `createObjetivo`/`updateObjetivo`/`deleteObjetivo`: incluir `status` no `select` do plano (em create vem por `parsed.planoId`; em update/delete via `objetivo.plano`) e chamar `assertPlanoEditavel(status, 'estrutural')` após o `assertMesmoTenant`.
  - [ ] `src/features/key-result/actions.ts` → `createKeyResult`/`updateKeyResult`/`deleteKeyResult`: idem — o plano já é carregado via `objetivo.plano` (em delete está num `select` enxuto, estender para trazer `status`). Chamar `assertPlanoEditavel(status, 'estrutural')`.
  - [ ] `src/features/key-result/actions.ts` → `updateKeyResultValor`: o plano já vem em `kr.objetivo.plano`. Chamar `assertPlanoEditavel(plano.status, 'valor-kr')` após `assertMesmoTenant` (permite `edicao`+`publicado`, bloqueia `arquivado`).
- [ ] **Task 3 — Actions de transição** (AC: 4, 7)
  - [ ] Em `src/features/plano/actions.ts`, criar `publicarPlano(planoId: string)`: `requireUser` → carregar plano (`{ clienteId, status }`) → `assertMesmoTenant` → `assertPlanoEditavel(status, 'transicao')` validando a transição de origem (`edicao`); transição válida só `edicao → publicado` → `prisma.plano.update({ status: 'publicado' })`. Rejeitar se já `publicado`/`arquivado` ("Transição inválida: o plano não está em edição.").
  - [ ] Criar `arquivarPlano(planoId: string)`: análogo, transição válida só `publicado → arquivado`. Rejeitar se `edicao` ("Arquive apenas planos publicados.") ou já `arquivado`.
  - [ ] **Decisão de design** (ver Dev Notes): a validação de transição vive **dentro** do helper como `operacao: 'transicao'` recebendo o destino, OU em pequenas funções `assertTransicao(de, para)`. Recomendado: uma função dedicada `assertTransicaoPlano(de: StatusPlano, para: StatusPlano)` no mesmo `lib/status.ts` (a tabela de transições é distinta da matriz de edição). Marcar a escolha no código.
  - [ ] Ponto de extensão de papel: após `assertMesmoTenant`, deixar `// TODO(6.5): requirePapel('owner', planoId)` — ver AC-7 / `[ASSUMPTION]`.
- [ ] **Task 4 — UI reflete o estado e o motivo do bloqueio** (AC: 6)
  - [ ] `src/features/plano/components/ObjetivosBoard.tsx`: receber/derivar o `status` do plano; quando `!podeEditarEstrutura(status)`, desabilitar/ocultar os controles de criar/editar/excluir objetivo e KR, exibindo um aviso pt-BR com o motivo ("Plano publicado — só é possível atualizar valores"). Em `arquivado`, board somente-leitura (também o painel de valor). Reusar `planoStatusLabel` para rótulos.
  - [ ] `src/features/plano/components/PlanoEditButton.tsx`: ocultar/desabilitar quando o status não permite edição estrutural; tooltip/aria com o motivo.
  - [ ] `src/features/key-result/components/KRPanel.tsx`: o botão "Atualizar valor" permanece habilitado em `publicado`, desabilitado em `arquivado`.
  - [ ] `src/app/(app)/planos/[id]/page.tsx`: expor o `status` do plano para os componentes e, se a UI de transição entrar aqui, renderizar os CTAs "Publicar plano" / "Arquivar plano" condicionados ao status atual.
  - [ ] **Não** reimplementar rótulos/cores — usar `planoStatusLabel`/`planoStatusBadgeClasses` (já em `lib/status.ts`).
- [ ] **Task 5 — Vocabulário pt-BR (rótulos de status)** (AC: 6)
  - [ ] Confirmar/ajustar `PLANO_STATUS_LABELS` em `lib/status.ts`. Mapeamento proposto (ver Dev Notes "Vocabulário"): `edicao → "Em edição"` (o usuário fala "Em planejamento"), `publicado → "Ativo"` (o usuário fala "Ativo"/"Publicado"), `arquivado → "Arquivado"`. **Decisão a confirmar com o usuário** — marcar `[ASSUMPTION]`; hoje os labels são `Edição/Publicado/Arquivado`.
- [ ] **Task 6 — Testes** (AC: 8)
  - [ ] `src/features/plano/__tests__/status.test.ts`: matriz `assertPlanoEditavel(status, op)` (todas as combinações: edicao→permite tudo; publicado→permite valor-kr, bloqueia estrutural; arquivado→bloqueia tudo) e `assertTransicaoPlano` (válidas vs inválidas).
  - [ ] `src/features/plano/__tests__/actions.test.ts`: `updatePlano` bloqueado quando plano `publicado`/`arquivado`; `publicarPlano`/`arquivarPlano` em transições válidas (update do status) e inválidas (lança, sem update). Usar `makePlano` (factory) com `overrides: { status }`.
  - [ ] `src/features/objetivo/__tests__/actions.test.ts` e `src/features/key-result/__tests__/actions.test.ts`: cada mutação estrutural bloqueada em `publicado`/`arquivado`; `updateKeyResultValor` permitido em `publicado`, bloqueado em `arquivado`. Estender o `select`/`include` mockado para devolver `status` no plano.
  - [ ] Mocks de Prisma/Supabase/Brevo via `vi.mock('@/lib/...')` (padrão existente); `beforeEach(() => vi.clearAllMocks())`; `next/navigation`/`next/cache` já mockados globalmente — não remockar.
  - [ ] Rodar `pnpm test src/features/plano src/features/objetivo src/features/key-result`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## Dev Notes

### Por que esta story existe
Fecha o **item 3b dos testes ("Atualizar vs Editar confuso")** e o **CB-4** do Contrato Comportamental. O enum `StatusPlano {edicao, publicado, arquivado}` e o default `edicao` no model `Plano` **já existem no schema** (confirmado), mas **nenhuma regra os usa**: hoje qualquer action estrutural roda independentemente do status, e **não existe** action de publicar/arquivar. A Story 3.4 fala em "publicar plano", mas o que foi de fato implementado (`createPlanoCorporativo`) apenas **cria** o plano e **nem seta status explicitamente** (depende do default `edicao`); não há transição de estado. Esta story introduz a máquina de estados e a impõe no backend. [Source: `prisma/schema.prisma#StatusPlano`; `prisma/schema.prisma#model-Plano`; `_bmad-output/planning-artifacts/prds/prd-okr-2026-06-18/prd.md#13-CB-4`; `_bmad-output/planning-artifacts/epics.md#Epic-6-Story-6.4`]

### Confirmação do schema (lido, não inventado)
- `enum StatusPlano { edicao  publicado  arquivado }` — valores exatos. [Source: `prisma/schema.prisma:35-39`]
- `model Plano { ... status StatusPlano @default(edicao) ... }`. [Source: `prisma/schema.prisma:183`]
- `createPlanoCorporativo` **não** passa `status` (usa o default). `createPlanoDepartamento` passa `status: 'edicao'` explicitamente. [Source: `src/features/plano/actions.ts:78-88, 236-246`]

### Matriz estado → operações permitidas (regra central)
| Estado \ Operação | Estrutural (`updatePlano`, create/update/delete Objetivo, create/update/delete KR) | `updateKeyResultValor` (valor + histórico) | Transição de saída válida |
|---|---|---|---|
| `edicao` | **permitido** | **permitido** | `→ publicado` |
| `publicado` | **bloqueado** (motivo na UI) | **permitido** | `→ arquivado` |
| `arquivado` | **bloqueado** | **bloqueado** (somente leitura) | — (terminal) |

Transições proibidas (devem lançar): `edicao → arquivado` (não se arquiva direto da edição), `publicado → edicao` (sem "despublicar" nesta story), `arquivado → *` (terminal). `[ASSUMPTION]` "despublicar"/"reabrir" (`publicado → edicao` ou `arquivado → publicado`) está **fora de escopo** desta story — confirmar com o usuário se é desejado; se for, vira transição adicional na tabela.

### Onde/como impor a regra (decisão de design)
- **Helper reutilizável** `assertPlanoEditavel(status, operacao)` em `src/features/plano/lib/status.ts` — mesmo arquivo já é a "fonte única" de status e já é importado pelos componentes; colocar a regra ao lado dos rótulos mantém uma única fonte de verdade do ciclo de vida. Estilo idêntico a `assertMesmoTenant` (puro, lança erro de domínio). [Source: `src/features/auth/guards.ts:27-30`; `src/features/plano/lib/status.ts`]
- **Validação de transição** separada (`assertTransicaoPlano(de, para)`) porque a tabela de transições é semanticamente distinta da matriz de edição; mantê-las separadas evita um helper com dupla responsabilidade.
- Cada action chama o helper **depois** de `requireUser` + `assertMesmoTenant` e **antes** de qualquer `prisma.*.update/create/delete`. Ordem importa: tenant primeiro (não vazar existência), estado depois.

### Actions de transição (assinatura e efeitos)
- `publicarPlano(planoId: string): Promise<{ status: StatusPlano }>` — `requireUser` → carrega `{ clienteId, status }` → `assertMesmoTenant` → `assertTransicaoPlano(status, 'publicado')` → `prisma.plano.update({ where:{id}, data:{ status:'publicado' } })`. Efeito: trava edição estrutural; valores de KR seguem atualizáveis (operação).
- `arquivarPlano(planoId: string): Promise<{ status: StatusPlano }>` — análogo, valida `publicado → arquivado`. Efeito: plano vira somente-leitura.
- **Quem pode** (AC-7): ação privilegiada. **Depende da Story 6.5** (`PapelPlano {owner, editor, viewer}` imposto no backend via guard reutilizável). Enquanto 6.5 não existir, usar `requireUser` + `assertMesmoTenant` e marcar `// TODO(6.5)` para `requirePapel('owner', planoId)` (ou `owner|editor`, a confirmar na 6.5). `[ASSUMPTION]`: publicar/arquivar exige `owner` (decisão final na 6.5). [Source: `_bmad-output/planning-artifacts/epics.md#Epic-6-Story-6.5`; `prd.md#13-CB-5`]

### Interação com a Story 3.4 (evitar duplicar)
A Story 3.4 ("Publicar plano e plano de apoio") na prática implementou **criação** (`createPlanoCorporativo` + `createPlanoDepartamento`), **não** uma transição de estado — o termo "publicar" lá significa "concluir o wizard e persistir". Esta story (6.4) é quem introduz a **transição de status** `publicarPlano`. **Não** alterar a semântica de criação da 3.4; apenas garantir que planos nascem em `edicao` (já é o caso pelo default + `createPlanoDepartamento`). [Source: `_bmad-output/planning-artifacts/epics.md#Story-3.4`; `src/features/plano/actions.ts:10-163, 225-249`]

### Vocabulário pt-BR (mapeamento de rótulos) — `[ASSUMPTION]`
O usuário fala "Em planejamento" / "Ativo"; o schema tem `edicao/publicado/arquivado`; os labels atuais são `Edição/Publicado/Arquivado`. Mapeamento **proposto** (a confirmar):
| enum | label atual | proposto |
|---|---|---|
| `edicao` | "Edição" | "Em edição" (ou "Em planejamento") |
| `publicado` | "Publicado" | "Ativo" (ou manter "Publicado") |
| `arquivado` | "Arquivado" | "Arquivado" |
Não renomear o enum (custo de migração); só os **labels** em `PLANO_STATUS_LABELS`. Decisão de produto — marcar como `[ASSUMPTION]` e confirmar antes de mexer. [Source: `src/features/plano/lib/status.ts:9-13`]

### Arquivos a tocar
| Arquivo | Ação | Observação |
|---|---|---|
| `src/features/plano/lib/status.ts` | UPDATE | `assertPlanoEditavel`, `assertTransicaoPlano`, helpers booleanos; (opcional) ajuste de labels |
| `src/features/plano/actions.ts` | UPDATE | guard em `updatePlano`; novas `publicarPlano`/`arquivarPlano` |
| `src/features/objetivo/actions.ts` | UPDATE | guard estrutural em create/update/delete (incluir `status` nos selects) |
| `src/features/key-result/actions.ts` | UPDATE | guard estrutural em create/update/delete KR; `valor-kr` em `updateKeyResultValor` |
| `src/features/plano/components/ObjetivosBoard.tsx` | UPDATE | desabilita edição estrutural + aviso por status |
| `src/features/plano/components/PlanoEditButton.tsx` | UPDATE | oculta/desabilita por status |
| `src/features/key-result/components/KRPanel.tsx` | UPDATE | "Atualizar valor" off só em `arquivado` |
| `src/app/(app)/planos/[id]/page.tsx` | UPDATE | propaga `status`; CTAs publicar/arquivar |
| `src/features/plano/__tests__/status.test.ts` | NEW | matriz do helper + transições |
| `src/features/plano/__tests__/actions.test.ts` | UPDATE/NEW | `updatePlano` bloqueado; transições |
| `src/features/objetivo/__tests__/actions.test.ts` | UPDATE | bloqueio estrutural por status |
| `src/features/key-result/__tests__/actions.test.ts` | UPDATE | bloqueio estrutural + `valor-kr` por status |

### Estado atual dos arquivos UPDATE (ler antes de mexer)
- **`plano/actions.ts`**: `updatePlano(id, data)` já carrega `anterior` com `select:{ clienteId, dataInicio, dataFim }` e chama `assertMesmoTenant` — só **acrescentar** `status` ao select e a chamada ao helper. Não existe action de transição. [Source: `src/features/plano/actions.ts:165-223`]
- **`objetivo/actions.ts`**: as três mutações já fazem `findUniqueOrThrow` do plano/objetivo + `assertMesmoTenant`; o `select` traz `plano.clienteId` (estender para `plano.status`). [Source: `src/features/objetivo/actions.ts:7-78`]
- **`key-result/actions.ts`**: `updateKeyResultValor`, `createKeyResult`, `updateKeyResult` já carregam o `plano` inteiro via `include` (tem `status`); `deleteKeyResult` usa `select` enxuto (estender). [Source: `src/features/key-result/actions.ts:9-185`]
- **`lib/status.ts`**: exporta `StatusPlano`, `PLANO_STATUS_LABELS`, `planoStatusLabel`, `planoStatusBadgeClasses`. Já é consumido por `PlanoCard.tsx` (badge). Adicionar a lógica de regra **neste** arquivo. [Source: `src/features/plano/lib/status.ts`]
- **`ObjetivosBoard.tsx`**: já recebe os objetivos/KRs e tem `KROverride`/atualização otimista de valor; é o ponto natural para condicionar os controles estruturais ao status do plano. [Source: `src/features/plano/components/ObjetivosBoard.tsx`]

### Padrões do projeto a respeitar (project-context.md)
- **Mutações = Server Actions** (`'use server'`); validação Zod na fronteira já existe nas actions — o guard de estado entra **após** o parse e os guards de tenant. [Source: `_bmad-output/project-context.md#framework_rules`]
- Erro de domínio segue o padrão `throw new Error('...')` (como `assertMesmoTenant`), **não** retorno `{ error }` — estas actions já lançam (não são `useActionState`). [Source: `src/features/auth/guards.ts`]
- **Cobertura mínima 90% em `features/**`**; `src/app/**`, `src/lib/**`, `src/components/**` excluídos — logo o helper e as actions **contam** (são o foco do gate); a UI dos componentes em `features/**/components` também conta, mas testes de página em `src/app/**` não. Test-first. [Source: `_bmad-output/project-context.md#testing_rules`]
- Mocks de Prisma/Supabase/OpenAI/Brevo via `vi.mock('@/lib/...')` antes dos imports; usar **factories** (`makePlano` com `overrides:{ status }`) em vez de objetos à mão; `next/navigation`/`next/cache` mockados globalmente. [Source: `_bmad-output/project-context.md#testing_rules`; `src/tests/factories/index.ts`]
- pt-BR em toda a UI; cores via tokens (nunca hex) — `lib/status.ts` já segue isso. [Source: `src/features/plano/lib/status.ts`]

### Project Structure Notes
- O helper de regra fica em `features/plano/lib/status.ts` (não em `auth/guards.ts`): é regra de **domínio do plano**, não de autenticação. `assertMesmoTenant`/`requirePapel` (6.5) permanecem em `auth/guards.ts` (autorização); `assertPlanoEditavel`/`assertTransicaoPlano` ficam no domínio Plano (estado). Convenção alinhada à estrutura feature-based.
- Sem mudança de schema: o enum e o default já existem — **nenhuma migração Prisma** nesta story.

### References
- [Source: `_bmad-output/planning-artifacts/epics.md#Epic-6-Story-6.4`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Epic-6-Story-6.5` — dependência de enforcement de papel (AC-7)]
- [Source: `_bmad-output/planning-artifacts/epics.md#Story-3.4` — "publicar" = criação, não transição]
- [Source: `_bmad-output/planning-artifacts/prds/prd-okr-2026-06-18/prd.md#13-CB-4`]
- [Source: `prisma/schema.prisma:35-39` — `enum StatusPlano`]
- [Source: `prisma/schema.prisma:183` — `Plano.status @default(edicao)`]
- [Source: `src/features/plano/lib/status.ts` — fonte única de status/labels]
- [Source: `src/features/plano/actions.ts` — `updatePlano`, `createPlanoCorporativo`, `createPlanoDepartamento`]
- [Source: `src/features/objetivo/actions.ts` — mutações estruturais de objetivo]
- [Source: `src/features/key-result/actions.ts` — estruturais vs `updateKeyResultValor`]
- [Source: `src/features/auth/guards.ts` — `assertMesmoTenant`/`requireUser`, padrão do helper]
- [Source: `_bmad-output/project-context.md` — Server Actions, Zod, testes/cobertura, mocks]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
