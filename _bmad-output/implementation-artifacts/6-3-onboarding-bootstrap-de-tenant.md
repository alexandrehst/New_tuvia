# Story 6.3: Onboarding / bootstrap de tenant

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a novo usuário recém-verificado (primeiro acesso ao tenant),
I want ser conduzido à criação do meu primeiro plano em vez de cair numa app vazia e muda,
so that eu entenda o próximo passo e ative o produto sem fricção.

## Acceptance Criteria

1. **Given** o primeiro acesso pós-verificação de um usuário cujo `Cliente` ainda não tem nenhum `Plano`, **When** entro na app, **Then** sou conduzido a um caminho guiado para criar o primeiro plano (estado vazio de `/planos` como ponto de entrada do onboarding) — não a um `/planos` vazio e mudo.
2. **Given** o contexto de tenant, **Then** o `Cliente` e o `User` (identidade dupla Supabase↔Prisma) **já existem** desde o `signUp` (`src/features/auth/actions.ts:59-71`) — esta story **NÃO recria** o `Cliente`; ela apenas garante/valida que esse contexto está presente no primeiro acesso e conduz o usuário ao wizard. Se, por qualquer borda, faltar contexto de tenant, o fluxo degrada com segurança (redirect ao login), nunca cria um segundo `Cliente`.
3. **Given** o estado vazio de `src/app/(app)/planos/page.tsx` (FR-12: "Nenhum plano ainda" + CTA), **Then** ele é o ponto de entrada do onboarding e leva ao wizard `/criador` (Epic 3). O onboarding é uma **camada de orientação sobre o estado vazio existente**, não uma rota nova paralela.
4. **Given** o primeiro acesso, **Then** a app distingue visualmente "primeiro acesso (nunca criou plano)" de "lista esvaziada depois" através de uma saudação/orientação de boas-vindas mais explícita no estado vazio (ex.: título de boas-vindas com nome + 1 frase de próximo passo + CTA primário "Criar primeiro plano"), em pt-BR (NFR-6), reaproveitando os componentes já presentes (`Button`, ícone, tipografia do estado vazio).
5. **Given** a política de sessão do Epic 6.1, **Then** o onboarding só ocorre **após a conta confirmada** — usuário não verificado nunca chega a `/planos` (não há sessão até confirmar; ver Dependências). Esta story não enfraquece esse contrato.
6. **REGRESSÃO (crítico — isolamento):** **Given** o estado vazio é decidido por `getPlanos(user.clienteId)` (já escopado por tenant), **Then** o gate de onboarding **deve** usar o mesmo escopo por `clienteId` — nunca uma contagem global de planos. Um tenant A com planos não pode "desligar" o onboarding do tenant B vazio, e vice-versa.
7. **REGRESSÃO (crítico — não quebrar signup/verificação):** **Given** os fluxos de `signUp`/verificação (Epic 6.1) e `/nova-senha` (Epic 6.2), **Then** esta story **não altera** `src/features/auth/actions.ts`, `src/app/(auth)/*`, nem `src/app/(recovery)/*` de forma que mude seu comportamento. Bootstrap de tenant continua acontecendo no `signUp`; o onboarding apenas orienta no primeiro acesso.
8. **Given** a suíte de testes, **Then** há cobertura da lógica de decisão do onboarding em `features/**` (gate 90%): "tenant sem planos → onboarding ativo" e "tenant com ≥1 plano → onboarding inativo", com mock de Prisma/Supabase no padrão do projeto; typecheck/lint/build limpos.

## Tasks / Subtasks

- [ ] **Task 1 — Decisão de "primeiro acesso" escopada por tenant** (AC: 1, 2, 6, 8)
  - [ ] Em `src/features/onboarding/queries.ts` (NEW), criar `isPrimeiroAcesso(clienteId: string): Promise<boolean>` que retorna `true` quando o `Cliente` não tem nenhum `Plano`. Implementar com `prisma.plano.count({ where: { clienteId } })` (mais barato que `findMany`) — **sempre** filtrar por `clienteId` (AC-6). Não acessar Prisma fora de `features/**/queries.ts` (regra do projeto: sem Prisma em componentes).
  - [ ] Garantir que a função **não** cria nada (sem `create`/`upsert` de `Cliente`) — é leitura pura. Bootstrap já é responsabilidade do `signUp` (AC-2/AC-7).
- [ ] **Task 2 — Estado vazio vira ponto de entrada do onboarding** (AC: 1, 3, 4)
  - [ ] Em `src/app/(app)/planos/page.tsx` (UPDATE), no ramo `planos.length === 0`, substituir o estado vazio genérico por uma variante de **boas-vindas/primeiro plano** quando `isPrimeiroAcesso` for verdadeiro: manter o CTA `Criar primeiro plano` (`render={<Link href="/criador" />}`), reforçar o copy de orientação (1 frase de próximo passo), e manter a saudação "Bem-vindo(a), {nome}" já presente. Reaproveitar `Button` e os mesmos componentes/ícones; não introduzir Radix (projeto é Base UI).
  - [ ] **Não** criar rota nova: o onboarding é a camada de orientação sobre o estado vazio (AC-3). O CTA continua apontando para `/criador` (entrada do wizard do Epic 3).
  - [ ] Extrair o bloco de boas-vindas para um componente de feature, ex.: `src/features/onboarding/components/OnboardingVazio.tsx` (NEW), recebendo `nome` por prop, para manter a página fina e a UI testável fora do gate.
- [ ] **Task 3 — Garantia/validação de contexto de tenant no primeiro acesso** (AC: 2, 5)
  - [ ] Em `planos/page.tsx`, manter o guard existente (`getCurrentUser()` → `redirect('/login')` se ausente). Reusar o `user.clienteId` que **já** vem do Prisma (identidade dupla) — não derivar tenant de outro lugar. Se `getCurrentUser()` retornar `null` (sem `User` Prisma correspondente), seguir o caminho seguro de `redirect('/login')` em vez de criar `Cliente` (AC-2). **Não** tocar em `src/features/auth/*`.
- [ ] **Task 4 — Decisão de design do "onboarding concluído"** (AC: 1, 4) `[ASSUMPTION]`
  - [ ] Adotar **sinal implícito por dados** (ausência de `Plano` no `Cliente`) como definição de "onboarding em andamento" — **sem** novo campo de schema. Documentar essa decisão no Completion Notes e na seção `[ASSUMPTION]` das Dev Notes. **Não** adicionar coluna `onboardingConcluido`/`primeiroAcesso` ao `prisma/schema.prisma` nesta story (o schema atual de `User`/`Cliente` não possui tal flag — verificado). Se o produto exigir, abrir story de schema separada.
- [ ] **Task 5 — Testes** (AC: 6, 8)
  - [ ] `src/features/onboarding/__tests__/queries.test.ts` (NEW): (a) `count` retorna 0 → `isPrimeiroAcesso === true`; (b) `count` ≥ 1 → `false`; (c) **isolamento**: a chamada a `prisma.plano.count` recebe `where: { clienteId }` com o id do tenant correto (assert do argumento). Mockar `@/lib/prisma` no padrão do projeto (`vi.mock` antes do import; cast `as unknown as ...`). `beforeEach(() => vi.clearAllMocks())`.
  - [ ] (opcional, fora do gate) teste de render de `OnboardingVazio` em `src/app/**` — nice-to-have, não conta para os 90%.
  - [ ] Rodar `pnpm test src/features/onboarding`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## Dev Notes

### Por que esta story existe (e o que ela NÃO é)
O "bootstrap de tenant" — criar `Cliente` + `User` com identidade dupla (mesmo UUID do Supabase) e disparar o e-mail de boas-vindas — **já acontece dentro de `signUp`** (`src/features/auth/actions.ts:59-71` cria `Cliente`, `:63-71` cria `User`, `:73-81` envia e-mail Brevo não-fatal). Com verificação de e-mail exigida (Epic 6.1), o `signUp` retorna `{ success: true }` **sem sessão** (`:85-87`) — a conta existe mas não está autenticada. **Portanto esta story não recria o tenant.** Ela trata o **PRIMEIRO ACESSO GUIADO** (pós-verificação): o usuário confirma o e-mail, faz login, cai em `/planos` vazio — e precisa de direção, não de uma tela muda. [Source: `src/features/auth/actions.ts` — `signUp`; `_bmad-output/planning-artifacts/epics.md`#Epic-6-Story-6.3]

### Primeiro acesso vs. acesso normal a `/planos` vazio
Hoje `src/app/(app)/planos/page.tsx:35-47` já mostra um estado vazio ("Nenhum plano ainda" + CTA "Criar primeiro plano" → `/criador`). Esta story **eleva esse estado vazio a ponto de entrada do onboarding** (AC-3): mesmo destino (`/criador`, o wizard do Epic 3), copy de boas-vindas mais explícito no primeiro acesso. **Não** há uma segunda rota de onboarding — é a mesma tela, com orientação reforçada quando `isPrimeiroAcesso` é verdadeiro. A saudação "Bem-vindo(a), {nome}" já existe no topo da página (`:22-24`) e deve ser preservada.

### `[ASSUMPTION]` — "onboarding concluído" é sinal por dados, não flag de schema
**Verificado em `prisma/schema.prisma`:** `model User` (`:96-117`) e `model Cliente` (`:75-90`) **não** possuem campo de onboarding/primeiro-acesso. `User.statusUser` (`StatusUser @default(pendente)`) trata status de conta, **não** onboarding. Decisão desta story: definir "onboarding em andamento" como **ausência de `Plano` no `Cliente`** (sinal implícito por dados), sem migração de schema. Vantagem: zero risco de migração, idempotente, e o estado vazio já é a UI natural disso. Limitação aceita: se o usuário criar e depois apagar todos os planos, o onboarding "reaparece" — comportamento tolerável e até desejável (app vazia → orientação). Caso o produto queira marcar "onboarding visto uma vez", isso exige uma coluna nova e deve virar **story de schema própria** — fora do escopo aqui. [Source: `prisma/schema.prisma`#model-User; `prisma/schema.prisma`#model-Cliente]

### Arquivos a tocar
| Arquivo | Ação | Observação |
|---|---|---|
| `src/features/onboarding/queries.ts` | NEW | `isPrimeiroAcesso(clienteId)` via `prisma.plano.count({ where:{ clienteId } })`; leitura pura, escopada por tenant |
| `src/features/onboarding/components/OnboardingVazio.tsx` | NEW | bloco de boas-vindas/primeiro-plano (Server Component; sem estado) recebendo `nome`; CTA → `/criador` |
| `src/features/onboarding/__tests__/queries.test.ts` | NEW | cobre 0/≥1 plano + assert do `where:{ clienteId }` (gate 90%) |
| `src/app/(app)/planos/page.tsx` | UPDATE | no ramo `planos.length===0`, usar `OnboardingVazio` quando `isPrimeiroAcesso`; manter guard e CTA existentes |

### Estado atual dos arquivos UPDATE / referência (ler antes de mexer)
- **`src/app/(app)/planos/page.tsx`** (`export const dynamic = 'force-dynamic'`): faz `getCurrentUser()` → `redirect('/login')` se ausente; chama `getPlanos(user.clienteId)` (já escopado por tenant); ramifica em `planos.length === 0` mostrando o estado vazio com CTA `<Button render={<Link href="/criador" />}>`. **Preservar** o guard, o `dynamic` e o uso de `user.clienteId`. Reusar o ramo vazio existente como base do onboarding.
- **`src/features/auth/guards.ts`** — `getCurrentUser()` usa `supabase.auth.getUser()` (revalida JWT, não confia só no cookie) e busca o `User` do Prisma por `id`. Retorna `null` se não houver sessão **ou** se não houver `User` Prisma — é o ponto de degradação segura (AC-2/AC-3). **Não** editar.
- **`src/features/plano/queries.ts`** — `getPlanos(clienteId)` (`:25`) é o precedente de leitura escopada por tenant. `isPrimeiroAcesso` deve seguir o mesmo padrão de filtro por `clienteId`. Preferir `count` a `findMany` para a decisão booleana.
- **`src/app/(app)/criador/page.tsx`** — destino do CTA: guard `getCurrentUser()` + render do `CriadorWizard` (Epic 3). É a entrada do onboarding propriamente dita; esta story **conduz até aqui**, não reimplementa o wizard.
- **`src/app/(app)/layout.tsx`** — guard de sessão de onde o primeiro acesso parte: `supabase.auth.getUser()` → `redirect('/login')` se ausente. **Não** alterar; o onboarding vive na página, não no layout (evita acoplar o guard de sessão à lógica de onboarding).

### Gotchas
- **Sem Prisma em componentes**: a decisão `isPrimeiroAcesso` é uma query de feature (`features/onboarding/queries.ts`), **não** chamada inline na página com `prisma`. A página é Server Component e pode `await` a query — mas a query é quem fala com o Prisma. [Source: `_bmad-output/project-context.md`#Framework]
- **Isolamento (AC-6)**: nunca contar planos globalmente. `prisma.plano.count()` sem `where:{ clienteId }` vazaria o estado de onboarding entre tenants. O teste de isolamento deve falhar se o `where` perder o `clienteId`.
- **Não tocar em auth (AC-7)**: outro processo está implementando a Story 6.2 e mexendo em `src/features/auth/*`, `src/app/auth/*`, `src/app/(recovery)/*`. Esta story **não escreve** nesses caminhos — apenas os lê como contexto. Bootstrap de tenant permanece no `signUp`.
- **Next 16 async**: se em algum ponto precisar de `cookies()`/`searchParams`/`params`, lembrar que são Promises (`await`). A página `/planos` atual não usa nenhum deles diretamente — `getCurrentUser()` já encapsula o `cookies()` via `createSupabaseServerClient()`. [Source: `_bmad-output/project-context.md`#Stack]
- **Base UI, não Radix**: o CTA usa `render={<Link/>}` (padrão shadcn v4 sobre Base UI), não `asChild`. Manter. [Source: `_bmad-output/project-context.md`#Stack]

### Project Structure Notes
- Novo módulo de feature `src/features/onboarding/` segue a estrutura modular do projeto (`queries.ts`, `components/`, `__tests__/`). `queries.ts` cai dentro do gate de cobertura 90% (`features/**`); `OnboardingVazio.tsx` é UI e não conta para o gate, mas mora na feature por coesão.
- A UI de onboarding **reusa** o estado vazio em `src/app/(app)/planos/page.tsx` em vez de criar uma rota `(app)/onboarding` paralela — alinhado à AC-3 e ao FR-12 (estado vazio é o ponto de entrada). Variância proposital documentada aqui para o revisor.
- Sem mudança de schema: nenhuma migração Prisma nesta story (ver `[ASSUMPTION]`).

### Critérios de regressão herdados do Epic 6
- **Isolamento cross-tenant**: nenhuma query/decisão lê dados de outro `clienteId` (AC-6) — trava o IDOR já corrigido. [Source: `_bmad-output/planning-artifacts/epics.md`#Epic-6-regressão]
- **Não quebrar signup/verificação**: o contrato de auth do Epic 6.1 (cadastro sem sessão até confirmar) e o fluxo `/nova-senha` do Epic 6.2 permanecem intactos (AC-5/AC-7).

### References
- [Source: `_bmad-output/planning-artifacts/epics.md`#Epic-6-Story-6.3]
- [Source: `_bmad-output/planning-artifacts/epics.md`#Epic-6-regressão (isolamento cross-tenant)]
- [Source: `_bmad-output/planning-artifacts/epics.md`#Story-3.1 (FR-12: estado vazio + CTA → wizard)]
- [Source: `src/features/auth/actions.ts` — `signUp` cria Cliente+User (identidade dupla) e retorna `{success:true}` sem sessão na verificação]
- [Source: `src/features/auth/guards.ts` — `getCurrentUser()` (degradação segura ao login)]
- [Source: `src/app/(app)/planos/page.tsx` — estado vazio existente que vira ponto de entrada]
- [Source: `src/app/(app)/criador/page.tsx` — destino do CTA (wizard Epic 3)]
- [Source: `src/app/(app)/layout.tsx` — guard de sessão de onde parte o primeiro acesso]
- [Source: `src/features/plano/queries.ts` — `getPlanos(clienteId)`, precedente de leitura escopada por tenant]
- [Source: `prisma/schema.prisma`#model-User / #model-Cliente — confirma ausência de flag de onboarding]
- [Source: `_bmad-output/project-context.md` — Server Action/Zod/Next 16 async/multi-tenant por clienteId/sem Prisma em componentes/identidade dupla/testes e gate 90%]

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Debug Log References

- `pnpm test src/features/onboarding` → 6 passed
- `pnpm test` (suíte completa) → 20 arquivos, 232 testes passados
- `pnpm typecheck` → limpo
- `pnpm lint` → 0 erros (1 warning pré-existente em `criador-plano/__tests__/schemas.test.ts`, não relacionado)
- `pnpm build` → sucesso (`/planos` ƒ dynamic)

### Completion Notes List

- **Sinal por dados (Task 4 / `[ASSUMPTION]`)**: "onboarding em andamento" = ausência de `Plano` no `Cliente`, via `prisma.plano.count({ where: { clienteId } })`. **Nenhuma migração de schema** — nenhuma coluna nova em `User`/`Cliente`. Confirmado que o estado vazio "reaparece" se todos os planos forem apagados; comportamento tolerável e desejável (app vazia → orientação), conforme a story.
- **Isolamento (AC-6)**: `isPrimeiroAcesso` sempre filtra por `clienteId` (derivado de `user.clienteId` do `getCurrentUser()`); teste de isolamento assere `where: { clienteId }` e quebraria se o escopo fosse perdido. Nunca há contagem global.
- **Leitura pura (AC-2/AC-7)**: a query não cria/`upsert`a nada. Bootstrap de tenant permanece em `signUp`. **Nenhum arquivo de auth tocado** (`src/features/auth/*`, `src/app/(auth)/*`, `src/app/(recovery)/*` intactos).
- **Camada sobre o estado vazio (AC-3)**: nenhuma rota nova. No ramo `planos.length === 0`, a página decide entre `OnboardingVazio` (primeiro acesso) e o estado vazio genérico já existente. CTA continua apontando para `/criador` via `render={<Link/>}` (Base UI, não Radix).
- **Degradação segura (AC-2/Task 3)**: guard existente `getCurrentUser()` → `redirect('/login')` preservado; `dynamic = 'force-dynamic'` e `user.clienteId` preservados.
- **Nota sobre redundância proposital**: como `getPlanos` já retorna a lista escopada por tenant, `planos.length === 0` e `isPrimeiroAcesso` coincidem na prática. A query dedicada existe por design da story (unidade de decisão testável dentro do gate 90% de `features/**`, com assert de isolamento). `isPrimeiroAcesso` só é chamada quando `planos.length === 0`, evitando uma segunda ida ao banco no caminho comum.
- **Sem divergência da tabela de arquivos**: todos os caminhos NEW/UPDATE seguem exatamente o indicado na story.

### File List

- NEW `src/features/onboarding/queries.ts`
- NEW `src/features/onboarding/components/OnboardingVazio.tsx`
- NEW `src/features/onboarding/__tests__/queries.test.ts`
- UPDATE `src/app/(app)/planos/page.tsx`
