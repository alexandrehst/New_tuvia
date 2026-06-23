# Story 6.5: Enforcement de papel por plano

Status: ready-for-dev

> **Reconciliação (2026-06-22) — ver `_bmad-output/planning-artifacts/architecture-epic6-seguranca.md`.** Decisões que RESOLVEM os `[ASSUMPTION]` desta story: (1) **vínculo owner DECIDIDO = SIM** — `createPlanoCorporativo`/`createPlanoDepartamento` passam a criar `PlanoUsuario(owner)` para o criador na mesma transação (pré-requisito do enforcement; entra no escopo desta story ou da 6.4 — implementar junto); (2) o enforcement usa o contrato unificado `assertPodeMutarPlano` (D1) que compõe papel **e** estado do plano (6.4) — não um guard de papel solto; (3) `admin` global = `owner` implícito no tenant; (4) **sem linha `PlanoUsuario` ⇒ default-deny**. Matriz papel×estado→operação no doc de solution-design.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a administrador de um plano,
I want que os papéis por plano (`PapelPlano`) sejam impostos no backend,
so that ocultar um botão na UI não seja a única barreira — um `viewer` não consiga mutar dados nem chamando a Server Action diretamente.

## Acceptance Criteria

1. **Given** `PapelPlano {owner, editor, viewer}` (já no schema, `PlanoUsuario.papel @default(viewer)`), **When** um `viewer` tenta executar qualquer mutação estrutural de um plano (criar/editar/excluir objetivo ou KR, atualizar valor de KR, editar plano, criar plano de apoio), **Then** a mutação é **negada por uma checagem de autorização reutilizável** (helper análogo a `assertMesmoTenant`, em `src/features/auth/guards.ts`) que lança antes de qualquer escrita no banco — mesmo que a UI não ofereça o botão.
2. **Given** a **Matriz papel → operações** (ver Dev Notes), **Then** `editor` e `owner` recebem as permissões correspondentes: `editor` muta objetivos/KRs/valores; `owner` adicionalmente gerencia o plano e seus membros e exclui. `viewer` tem **somente leitura**.
3. **Given** que a checagem precisa resolver o papel do usuário no plano alvo, **Then** o helper resolve o vínculo via `prisma.planoUsuario.findUnique({ where: { planoId_userId: { planoId, userId } } })` (a `@@unique([planoId, userId])` garante a chave composta) e compara contra um **papel mínimo** exigido pela operação.
4. **Given** um usuário **sem linha em `PlanoUsuario`** para aquele plano, **Then** o resultado é **default-deny** (tratado como sem papel → negado), exceto pela regra de admin global do AC-5. `[ASSUMPTION A1]` — ver Dev Notes (Decisão 3).
5. **Given** um usuário com `tipoUser === 'admin'` (regra **global de tenant**, não por plano), **When** ele opera sobre um plano do **seu próprio tenant** (após `assertMesmoTenant`), **Then** ele é tratado como **`owner` implícito** daquele plano — passa em qualquer checagem de papel **sem** depender de uma linha em `PlanoUsuario`. `[ASSUMPTION A2]` — ver Dev Notes (Decisão 2).
6. **Given** as actions hoje protegidas só por `requireUser` + `assertMesmoTenant` (`objetivo/actions.ts`, `key-result/actions.ts`, `plano/actions.ts`), **Then** cada mutação passa a chamar o novo guard de papel **depois** de resolver o `planoId` do recurso e **depois** do `assertMesmoTenant` (tenant primeiro, papel depois). O guard é **aditivo** — não remove o `assertMesmoTenant` existente.
7. **Given** as actions de `usuarios/actions.ts` hoje protegidas por `requireAdmin` (`updatePapel`, `updateNotificacao`, `removerMembroDoPlano`, `inviteUser`), **Then** elas continuam exigindo gestão de membros. Operações sobre **um plano específico** (`updatePapel`, `removerMembroDoPlano`) passam a aceitar **admin global OU `owner` daquele plano** (migração de `requireAdmin` puro para checagem por papel `owner`); `inviteUser` (cria usuário no tenant, sem plano alvo) permanece em `requireAdmin`. `[ASSUMPTION A3]` — ver Dev Notes (Decisão 5).
8. **Given** dependência da Story 6.4 (Ciclo de vida do Plano), **Then** as **transições de estado** (`edicao→publicado→arquivado`) introduzidas na 6.4 também devem passar pelo guard de papel (`owner` mínimo) — esta story estabelece o helper que a 6.4 reutiliza. Não duplicar a lógica de papel na 6.4.
9. **Given** a suíte de testes, **Then** há cobertura do novo guard em `src/features/auth/__tests__/guards.test.ts` (viewer→nega; editor→permite editor-level e nega owner-level; owner→permite; admin global→permite sem linha; sem linha→nega) **e** ao menos um teste de regressão por feature provando que `viewer` é barrado na action (mock de `planoUsuario.findUnique` retornando `papel: 'viewer'`). `pnpm typecheck`/`pnpm lint`/`pnpm build` limpos; cobertura ≥ 90% em `features/**`.

## Tasks / Subtasks

- [ ] **Task 1 — Guard de papel reutilizável em `auth/guards.ts`** (AC: 1, 2, 3, 4, 5)
  - [ ] Adicionar um tipo de ordem de papel: `const ORDEM_PAPEL = { viewer: 0, editor: 1, owner: 2 } as const`. Papel mínimo é satisfeito quando `ORDEM_PAPEL[papelAtual] >= ORDEM_PAPEL[papelMinimo]`.
  - [ ] Criar `resolverPapelPlano(planoId: string, user): Promise<PapelPlano | null>`: se `user.tipoUser === 'admin'` retorna `'owner'` (admin = owner implícito — AC-5); senão `prisma.planoUsuario.findUnique({ where: { planoId_userId: { planoId, userId: user.id } }, select: { papel: true } })` → retorna `papel` ou `null` (sem linha → null).
  - [ ] Criar `assertPapelPlano(planoId: string, user, papelMinimo: PapelPlano): Promise<void>`: resolve o papel; se `null` ou abaixo do mínimo, lança `new Error('Acesso negado')` (mesma mensagem opaca de `requireAdmin`, não vaza se o recurso existe). **Default-deny** (AC-4).
  - [ ] Açúcar opcional: `assertPodeEditar(planoId, user)` = `assertPapelPlano(planoId, user, 'editor')` e `assertPodeGerenciar(planoId, user)` = `assertPapelPlano(planoId, user, 'owner')`, para legibilidade nas actions. Importar o enum `PapelPlano` de `@prisma/client`.
  - [ ] **Não** alterar `requireUser`/`requireAdmin`/`assertMesmoTenant` existentes — apenas adicionar. O guard de papel **assume** que `assertMesmoTenant` já rodou (não refaz checagem de tenant).
- [ ] **Task 2 — Aplicar papel nas mutações de Objetivo** (AC: 1, 2, 6)
  - [ ] Em `src/features/objetivo/actions.ts`, após o `assertMesmoTenant` existente de cada action, chamar o guard com o `planoId` já resolvido:
    - `createObjetivo` → `assertPapelPlano(parsed.planoId, user, 'editor')` (o `planoId` vem do input; já buscamos `plano.clienteId`).
    - `updateObjetivo` → resolver `planoId` do objetivo (hoje só busca `plano.clienteId`; estender o `select` para trazer `plano.id`) → `assertPapelPlano(planoId, user, 'editor')`.
    - `deleteObjetivo` → idem `updateObjetivo`, `'editor'` (excluir objetivo é edição estrutural, não gestão de plano — AC: ver Matriz, Decisão 1).
- [ ] **Task 3 — Aplicar papel nas mutações de Key Result** (AC: 1, 2, 6)
  - [ ] Em `src/features/key-result/actions.ts`, após cada `assertMesmoTenant`:
    - `updateKeyResultValor` → `assertPapelPlano(plano.id, user, 'editor')` (o `plano` já está carregado via `kr.objetivo.plano`; usar `plano.id`). **Atualizar valor é a operação que `editor` faz.**
    - `createKeyResult` → `assertPapelPlano(objetivo.plano.id, user, 'editor')` (estender `select` se necessário para trazer `plano.id`).
    - `updateKeyResult` → `assertPapelPlano(plano.id, user, 'editor')`.
    - `deleteKeyResult` → resolver `planoId` (hoje só `plano.clienteId`; estender `select`) → `assertPapelPlano(planoId, user, 'editor')`.
    - `getKRHistorico` → **leitura**: NÃO adicionar guard de edição (viewer pode ler). Manter só `requireUser` + `assertMesmoTenant`.
- [ ] **Task 4 — Aplicar papel nas mutações de Plano** (AC: 1, 2, 6)
  - [ ] Em `src/features/plano/actions.ts`:
    - `updatePlano` → `assertPapelPlano(id, user, 'owner')` (editar datas/título do plano = gestão de plano → `owner`). `[ASSUMPTION A4]` — ver Decisão 1.
    - `createPlanoDepartamento` → criar um plano de apoio **sob** um plano-pai exige `owner` do **plano-pai** → `assertPapelPlano(parsed.planoPaiId, user, 'owner')`.
    - `createPlanoCorporativo` → cria um plano-raiz novo (não há plano pré-existente para checar papel; é o wizard de bootstrap). Mantém só `requireUser` + escopo de tenant. **`[ASSUMPTION A5]`** — ver Decisão 4. (Quem cria o plano vira `owner`; a criação do vínculo `owner` do criador é responsabilidade da 6.3/criador — fora do escopo desta story; marcar como follow-up se ausente.)
- [ ] **Task 5 — Migrar gestão de membros de `requireAdmin` para papel `owner`** (AC: 7)
  - [ ] Em `src/features/usuarios/actions.ts`:
    - `updatePapel(planoUsuarioId, papel)` → resolver `planoId` do vínculo (já busca `plano.clienteId`; estender `select` para `plano.id`); manter `requireUser` no lugar de `requireAdmin`; `assertMesmoTenant`; depois `assertPapelPlano(planoId, user, 'owner')`. Assim admin global (owner implícito) **e** owner daquele plano podem editar papel.
    - `removerMembroDoPlano(planoUsuarioId)` → idem: `owner` do plano do vínculo.
    - `updateNotificacao(userId, ...)` → preferência **do próprio usuário-alvo**, não escopada a um plano. `[ASSUMPTION A6]`: manter `requireAdmin` (gestão de tenant) **ou** permitir o próprio usuário editar a sua. Recomendação: manter `requireAdmin` nesta story (escopo mínimo); revisar em story de perfil. Documentar a decisão.
    - `inviteUser(...)` → cria usuário no tenant, **sem plano alvo** → permanece `requireAdmin` (gestão de tenant). Sem mudança.
- [ ] **Task 6 — Testes** (AC: 9)
  - [ ] Criar `src/features/auth/__tests__/guards.test.ts`: mockar `@/lib/prisma` e `@/lib/supabase`. Casos de `assertPapelPlano`/`resolverPapelPlano`:
    - admin global → resolve `owner` sem chamar `findUnique`;
    - `viewer` pedindo `editor` → lança `Acesso negado`;
    - `editor` pedindo `editor` → passa; `editor` pedindo `owner` → lança;
    - `owner` pedindo `owner`/`editor` → passa;
    - sem linha (`findUnique` → `null`) e não-admin → lança (default-deny).
  - [ ] Adicionar `makePlanoUsuario` em `src/tests/factories/index.ts` (`overrides: Partial<PlanoUsuario>`, `papel` default `'viewer'`), seguindo o padrão de `makeUser`/`makePlano`.
  - [ ] Estender testes existentes de cada feature (`objetivo`, `key-result`, `plano`, `usuarios`) com ≥1 caso de regressão: mock de `planoUsuario.findUnique` → `{ papel: 'viewer' }` (user não-admin) → a action **rejeita** sem escrever; e ≥1 caminho feliz (`editor`/`owner`) já coberto pelos testes atuais ajustando o mock para retornar o papel adequado (ou `tipoUser: 'admin'` no user mockado).
  - [ ] Rodar `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## Dev Notes

### Por que esta story existe
Fecha o **CB-5** do Contrato Comportamental & de Segurança (PRD §13): "`PapelPlano {owner, editor, viewer}` imposto no backend (não só ocultado na UI)". Hoje:
- `PapelPlano` existe no schema (`prisma/schema.prisma:47-51`) e `PlanoUsuario.papel @default(viewer)` (`schema.prisma:206-219`), com `@@unique([planoId, userId])`.
- `EXPERIENCE.md` (linha 17) afirma: "Papéis por plano (`PapelPlano`, default `viewer`) controlam o que cada usuário pode editar"; e (linha 78) define o estado "Sem permissão (viewer)" como **ações de edição apenas ocultas na UI** (UX-DR17) — leitura plena.
- Mas a autorização real é **só global**: `requireAdmin` = `tipoUser === 'admin'` (`guards.ts:21-25`); as mutações de objetivo/KR/plano usam apenas `requireUser` + `assertMesmoTenant`. **Um `viewer` que chame a Server Action diretamente muta sem barreira.** Esta story impõe o papel no backend.
[Source: `_bmad-output/planning-artifacts/prds/prd-okr-2026-06-18/prd.md`#13-CB-5; `_bmad-output/planning-artifacts/epics.md`#Epic-6-Story-6.5; EXPERIENCE.md linhas 17 e 78]

### Matriz papel → operações (Decisão 1 — resolvida)
Decisão proposta e adotada nesta story. `[ASSUMPTION A4]` nos limites entre `editor` e `owner` (marcados ⚠ — confirmar com o usuário).

| Operação | Action | Papel mínimo |
|---|---|---|
| Ler plano/objetivos/KRs/histórico | (queries, `getKRHistorico`) | `viewer` |
| Criar objetivo | `objetivo.createObjetivo` | `editor` |
| Editar objetivo (+responsáveis) | `objetivo.updateObjetivo` | `editor` |
| Excluir objetivo | `objetivo.deleteObjetivo` | `editor` |
| Criar KR | `key-result.createKeyResult` | `editor` |
| Editar KR (estrutura) | `key-result.updateKeyResult` | `editor` |
| Atualizar **valor** de KR | `key-result.updateKeyResultValor` | `editor` |
| Excluir KR | `key-result.deleteKeyResult` | `editor` |
| Editar plano (título/datas/freq.) | `plano.updatePlano` | `owner` ⚠ |
| Criar plano de apoio (sob pai) | `plano.createPlanoDepartamento` | `owner` (do pai) ⚠ |
| Criar plano corporativo (raiz) | `plano.createPlanoCorporativo` | n/a (bootstrap — ver Decisão 4) |
| Editar papel de membro | `usuarios.updatePapel` | `owner` (ou admin global) |
| Remover membro do plano | `usuarios.removerMembroDoPlano` | `owner` (ou admin global) |
| Convidar usuário (tenant) | `usuarios.inviteUser` | admin global (sem plano alvo) |
| Editar notificação de membro | `usuarios.updateNotificacao` | admin global (ver A6) |
| Transições de estado do plano (6.4) | (6.4) | `owner` |

Racional ⚠: editar metadados do plano e gerir membros é **gestão** (owner); editar conteúdo (objetivos/KRs/valores) é **trabalho do dia-a-dia** (editor). Se o usuário preferir `editor` também para `updatePlano`, é um ajuste de 1 linha — daí o marcador.

### Decisão 2 — admin global vs papel por plano (resolvida, `[ASSUMPTION A2]`)
`tipoUser === 'admin'` é **global do tenant**. Recomendação adotada: **admin = `owner` implícito em todos os planos do seu tenant**. `resolverPapelPlano` curto-circuita: admin → `'owner'` sem consultar `PlanoUsuario`. Isso preserva o comportamento atual de `requireAdmin` (admin pode tudo no tenant) e evita exigir uma linha `PlanoUsuario` para cada admin em cada plano. O `assertMesmoTenant` continua sendo a barreira de tenant — admin de tenant A **não** é owner de planos do tenant B.

### Decisão 3 — papel ausente (resolvida, `[ASSUMPTION A1]`)
Quando **não há linha** em `PlanoUsuario` para o par `(planoId, userId)`: **default-deny** (tratado como `null` → negado), exceto admin global (Decisão 2). Postura de segurança: a ausência de vínculo não concede `viewer` "grátis"; conceder leitura a quem não é membro do plano seria mais permissivo que o necessário. (Se no futuro a UX exigir leitura ampla por tenant, isso vira uma query/guard de leitura separado — fora do escopo desta story de **mutação**.)

### Decisão 4 — criação de plano-raiz (`createPlanoCorporativo`) (`[ASSUMPTION A5]`)
Não há plano pré-existente para checar papel na criação do plano-raiz (é o wizard de bootstrap, ligado à 6.3). Mantém-se `requireUser` + escopo de tenant. **Follow-up importante:** quem cria o plano deveria virar `owner` (criar a linha `PlanoUsuario` com `papel: 'owner'` para o criador). Verificar se `createPlanoCorporativo` hoje cria esse vínculo — **não cria** (confirmado: a action só persiste `PlanoEstrategico`/`Plano`/`Objetivo`/`KR`, sem `PlanoUsuario`). Se ausente, registrar como follow-up nesta story (a ausência do vínculo de owner significa que, hoje, nenhum não-admin teria papel em nenhum plano → todo enforcement recairia sobre admins). **Recomendação:** adicionar a criação do vínculo `owner` do criador como subtarefa, OU marcar dependência explícita à 6.3. Marcado como `[ASSUMPTION A5]` para o usuário decidir o escopo.

### Decisão 5 — migração de `requireAdmin` (resolvida, `[ASSUMPTION A3]`)
Actions que hoje usam `requireAdmin` (`usuarios/actions.ts`): `updatePapel`, `updateNotificacao`, `removerMembroDoPlano`, `inviteUser`. Migração:
- `updatePapel`, `removerMembroDoPlano` → operam sobre **um plano específico** → migram para `owner` do plano **ou** admin global (Decisão 2 cobre admin via owner implícito). Ganho: owners não-admin podem gerir os membros dos seus planos.
- `inviteUser` → não tem plano alvo (cria usuário no tenant) → **permanece** `requireAdmin`.
- `updateNotificacao` → preferência do usuário-alvo, sem plano → **permanece** `requireAdmin` nesta story (A6); revisitar em story de perfil.

### Arquivos a tocar
| Arquivo | Ação | Observação |
|---|---|---|
| `src/features/auth/guards.ts` | UPDATE | adicionar `resolverPapelPlano`, `assertPapelPlano` (+ açúcar `assertPodeEditar`/`assertPodeGerenciar`); importar `PapelPlano` de `@prisma/client` |
| `src/features/objetivo/actions.ts` | UPDATE | guard `editor` nas 3 mutações; estender `select` p/ `plano.id` |
| `src/features/key-result/actions.ts` | UPDATE | guard `editor` em create/update/updateValor/delete; `getKRHistorico` fica leitura |
| `src/features/plano/actions.ts` | UPDATE | `updatePlano`→`owner`; `createPlanoDepartamento`→`owner` do pai; `createPlanoCorporativo` sem mudança (ver A5) |
| `src/features/usuarios/actions.ts` | UPDATE | `updatePapel`/`removerMembroDoPlano`→`owner`; `inviteUser`/`updateNotificacao` mantêm `requireAdmin` |
| `src/features/auth/__tests__/guards.test.ts` | NEW | testes do guard de papel |
| `src/tests/factories/index.ts` | UPDATE | `makePlanoUsuario` |
| `src/features/objetivo/__tests__/*`, `key-result/__tests__/*`, `plano/__tests__/*`, `usuarios/__tests__/*` | UPDATE | regressão viewer-bloqueado + ajuste de mocks p/ caminho feliz |

### Estado atual dos arquivos UPDATE (ler antes de mexer)
- **`guards.ts`** (`src/features/auth/guards.ts`): hoje exporta `getCurrentUser`, `requireUser`, `requireAdmin` (`tipoUser !== 'admin'` → lança `Acesso negado`) e `assertMesmoTenant` (lança `Recurso não encontrado` em mismatch de tenant). O guard de papel deve seguir o mesmo estilo: função pequena, lança `Error` com mensagem opaca, sem efeitos colaterais além do `findUnique`. `getCurrentUser` retorna o `User` do Prisma (tem `id`, `clienteId`, `tipoUser`).
- **`objetivo/actions.ts`**: as 3 actions já fazem `requireUser` + `assertMesmoTenant`. `createObjetivo` tem `parsed.planoId` direto. `updateObjetivo`/`deleteObjetivo` só selecionam `plano.clienteId` — **estender o `select` para `plano: { select: { clienteId: true, id: true } }`** para ter o `planoId` sem query extra.
- **`key-result/actions.ts`**: `updateKeyResultValor`/`updateKeyResult` já carregam `kr.objetivo.plano` inteiro (tem `.id`). `createKeyResult` carrega `objetivo.plano` inteiro. `deleteKeyResult` e `getKRHistorico` só selecionam `...plano.clienteId` — estender o `select` com `id` em `deleteKeyResult`. `getKRHistorico` é **leitura** → não recebe guard de edição.
- **`plano/actions.ts`**: `updatePlano(id, ...)` tem o `id` do plano direto. `createPlanoDepartamento` tem `parsed.planoPaiId`. `createPlanoCorporativo` cria do zero (ver A5).
- **`usuarios/actions.ts`**: `updatePapel`/`removerMembroDoPlano` buscam o vínculo com `select: { plano: { select: { clienteId: true } } }` — **estender para incluir `plano.id`** e trocar `requireAdmin` por `requireUser` + guard `owner`.

### Ordem de checagem (invariante — não inverter)
1. `requireUser()` (autenticado) → 2. carregar recurso + `clienteId`/`planoId` → 3. `assertMesmoTenant(recursoClienteId, user.clienteId)` → 4. `assertPapelPlano(planoId, user, papelMinimo)`. Tenant **antes** de papel: nunca resolver papel de um recurso de outro tenant (evita oracle de existência cross-tenant). O guard de papel **não** refaz a checagem de tenant.

### Padrões do projeto a respeitar (project-context.md)
- Mutações = Server Actions; **sem Prisma em componentes**. O guard vive em `features/auth/guards.ts` e é importado pelas actions. [Source: project-context.md#Framework]
- Idioma de domínio **pt-BR**: nomes como `resolverPapelPlano`, `assertPapelPlano`, `assertPodeEditar`. Enum `PapelPlano` e valores `owner/editor/viewer` já existem — **não traduzir**. [Source: project-context.md#Linguagem]
- **Mensagem de erro opaca** (`Acesso negado` / `Recurso não encontrado`) — não vazar se o recurso existe. Seguir o padrão de `requireAdmin`/`assertMesmoTenant`.
- **Testes:** `vi.mock('@/lib/prisma')` e `@/lib/supabase` **antes** dos imports; `beforeEach(() => vi.clearAllMocks())`; usar/estender factories de `src/tests/factories/index.ts`; cobertura ≥90% cobre `features/**` (o guard e as actions contam). `next/navigation`/`next/cache` mockados globalmente — não remockar. [Source: project-context.md#Testes]
- **Zod v3** se algum schema for tocado (não previsto aqui; `papelSchema` já existe em `usuarios/schemas.ts`).

### Project Structure Notes
- O guard de papel é o **análogo objeto-nível** de `assertMesmoTenant` (que é tenant-nível) — mesma casa (`features/auth/guards.ts`), mesmo estilo. Coerente com a AC do epic ("checagem reutilizável análoga a `assertMesmoTenant`").
- Variância proposital: actions de objetivo/KR estendem `select` para trazer `plano.id` — micro-mudança sem custo de query extra (já há o join). Documentar no diff.
- `createPlanoCorporativo` é a única mutação de plano que **não** ganha guard de papel (bootstrap) — registrar o porquê (A5) e o follow-up do vínculo `owner` do criador.

### Dependências e relações
- **6.4 (Ciclo de vida do Plano)**: as transições `edicao→publicado→arquivado` devem reutilizar `assertPapelPlano(planoId, user, 'owner')` desta story — não reimplementar. Esta story é pré-requisito do enforcement de transições. [Source: epics.md#Epic-6-Story-6.4]
- **4.1 (Lista de membros/papéis)**: AC novo "edição de papel/notificação imposta no backend por papel (não apenas ocultada) — ver Epic 6.5". Esta story entrega o backend que a 4.1 referencia. [Source: epics.md#Story-4.1, linha 458]
- **UX-DR17 / EXPERIENCE.md linha 78**: a UI continua ocultando ações para `viewer` (não desabilita com erro). Esta story é a **rede de segurança** por trás dessa ocultação — não muda a UI. [Source: EXPERIENCE.md#State-Patterns]
- **6.3 (Onboarding)**: ligada via A5 (quem cria o plano-raiz deve virar `owner`).

### References
- [Source: `_bmad-output/planning-artifacts/epics.md`#Epic-6-Story-6.5 (linhas 590-602)]
- [Source: `_bmad-output/planning-artifacts/epics.md`#Story-4.1 (linha 458) e #Story-6.4 (transições)]
- [Source: `_bmad-output/planning-artifacts/prds/prd-okr-2026-06-18/prd.md`#13-CB-5 (linha 214)]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/EXPERIENCE.md` linhas 17 e 78]
- [Source: `prisma/schema.prisma` — enum `PapelPlano` (47-51), model `PlanoUsuario` (206-219), `@@unique([planoId, userId])`]
- [Source: `src/features/auth/guards.ts` — `requireUser`/`requireAdmin`/`assertMesmoTenant` (padrão a seguir)]
- [Source: `src/features/objetivo/actions.ts`, `src/features/key-result/actions.ts`, `src/features/plano/actions.ts`, `src/features/usuarios/actions.ts` — mutações alvo]
- [Source: `_bmad-output/project-context.md` — Server Actions/Zod/Next 16/Testes]
- [Source: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-06-22.md` — origem do Epic 6]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
