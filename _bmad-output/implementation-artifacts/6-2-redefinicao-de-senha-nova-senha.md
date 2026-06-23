# Story 6.2: Redefinição de senha (/nova-senha)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a usuário que esqueceu a senha,
I want uma página para definir uma nova senha a partir do link do e-mail,
so that eu recupere o acesso à minha conta.

## Acceptance Criteria

1. **Given** o e-mail de recovery (a action `resetPassword` em `src/features/auth/actions.ts:99` aponta `redirectTo` para `/nova-senha`), **When** abro o link e defino uma nova senha válida, **Then** a senha é persistida no Supabase Auth e o acesso é restaurado.
2. **Given** a página `/nova-senha`, **Then** ela recebe a **sessão de recovery** estabelecida pelo link (fluxo PKCE — ver Dev Notes) antes de permitir a troca; sem sessão de recovery válida, mostra erro orientando a solicitar novo link.
3. **Given** o formulário de nova senha, **Then** segue o padrão das telas de auth (cartão centrado sobre `brand-tint`, `useActionState`) com os **3 estados visíveis**: carregando (botão desabilitado + indicador), erro (inline) e sucesso (FR-9/UX-DR15).
4. **Given** validação da nova senha, **Then** exige no mínimo 8 caracteres (consistente com `signUpSchema`) e confirmação que confere; erros aparecem inline sem perder o estado.
5. **Given** sucesso na troca, **Then** o usuário é levado ao login com confirmação (a sessão de recovery é encerrada após a troca — não deixa o usuário "logado" por um link de recovery).
6. **REGRESSÃO (crítico):** a página `/nova-senha` **não pode** ser barrada pelo guard de `src/app/(auth)/layout.tsx` (que redireciona usuário autenticado para `/planos`). Como o link de recovery cria sessão, `/nova-senha` deve ficar **fora** do grupo `(auth)`. Ver Dev Notes.
7. **Given** a suíte de testes, **Then** há cobertura da nova action (input inválido → erro; sucesso → `updateUser` chamado + redirect) seguindo os padrões de mock do projeto; typecheck/lint/build limpos.

## Tasks / Subtasks

- [ ] **Task 1 — Schema de nova senha** (AC: 4)
  - [ ] Em `src/features/auth/schemas.ts`, adicionar `novaSenhaSchema` = `{ password: min(8, 'Senha deve ter no mínimo 8 caracteres'), confirmar: string }` com `.refine` garantindo `password === confirmar` ('As senhas não conferem'). Exportar `NovaSenhaInput` via `z.infer`. Mensagens em pt-BR (NFR-6).
- [ ] **Task 2 — Server Action para definir a senha** (AC: 1, 5, 7)
  - [ ] Em `src/features/auth/actions.ts`, criar `definirNovaSenha(prevState, formData)` com assinatura `useActionState` retornando `{ error?: string; success?: boolean }`.
  - [ ] `safeParse` com `novaSenhaSchema` → retorna `{ error }` na falha (não lança; padrão `useActionState`).
  - [ ] `createSupabaseServerClient()` → `supabase.auth.updateUser({ password })`. A sessão de recovery (cookies) deve estar presente — se `updateUser` falhar por falta de sessão, retornar erro orientando a pedir novo link.
  - [ ] Em sucesso: `supabase.auth.signOut()` (encerra a sessão de recovery) e `redirect('/login')` no fim da action (lança internamente — fora de try/catch que engula). Ver `project-context.md` §Framework.
- [ ] **Task 3 — Estabelecer a sessão de recovery (route handler de callback)** (AC: 2, 6)
  - [ ] Criar `src/app/auth/confirm/route.ts` (GET) que lê `code` de `searchParams`, chama `supabase.auth.exchangeCodeForSession(code)` (server client — grava cookies), e `redirect('/nova-senha')`. Em ausência/erro de `code`, redirecionar para `/reset-senha` com indicação de link inválido.
  - [ ] Ajustar `resetPassword` (`actions.ts:98-100`) para `redirectTo: ${NEXT_PUBLIC_APP_URL}/auth/confirm?next=/nova-senha` (em vez de `/nova-senha` direto), já que o link PKCE precisa passar pelo exchange antes da página. Atualizar o teste existente em `__tests__/actions.test.ts` (asserção de `redirectTo` contém `/auth/confirm`).
- [ ] **Task 4 — Página `/nova-senha` fora do grupo `(auth)`** (AC: 3, 6)
  - [ ] Criar grupo de rota `src/app/(recovery)/layout.tsx` replicando o visual centrado (`brand-tint`, wordmark "OKR") do `(auth)/layout.tsx`, **mas sem o guard** `getUser()→redirect('/planos')`.
  - [ ] Criar `src/app/(recovery)/nova-senha/page.tsx` (`'use client'`) com `useActionState(definirNovaSenha, null)`, reutilizando `Card`/`Input`/`Label`/`Button` e o padrão de erro/sucesso já usado em `reset-senha/page.tsx` e `cadastro/page.tsx`. Campos: `password` e `confirmar` (ambos `type="password"`, `autoComplete="new-password"`).
- [ ] **Task 5 — Config (não-código, documentar para o usuário)** (AC: 1)
  - [ ] Garantir que `NEXT_PUBLIC_APP_URL` está setado e que a URL `…/auth/confirm` está na allowlist de **Redirect URLs** no painel Supabase (Auth → URL Configuration). Documentar no Completion Notes.
- [ ] **Task 6 — Testes** (AC: 7)
  - [ ] `src/features/auth/__tests__/actions.test.ts`: adicionar casos para `definirNovaSenha` — (a) input inválido (senhas não conferem / curta) → `{ error }` sem chamar Supabase; (b) sucesso → `updateUser({ password })` chamado, `signOut` chamado, `redirect('/login')`. Mock de `@/lib/supabase` já existe no arquivo; estender `makeSupabaseMock` com `updateUser: vi.fn().mockResolvedValue({ error: null })`.
  - [ ] (opcional, fora do gate) teste do route handler `auth/confirm`.
  - [ ] Rodar `pnpm test src/features/auth`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## Dev Notes

### Por que esta story existe
Fecha o **achado #3 da auditoria de segurança (2026-06-22)**: `resetPassword` aponta o e-mail de recovery para `/nova-senha`, mas **a página nunca foi criada** — só existe `/reset-senha` (o formulário que *pede* o link). O fluxo de reset está quebrado ponta-a-ponta. [Source: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-06-22.md`#Seção-1; `epics.md`#Epic-6-Story-6.2]

### Arquivos a tocar
| Arquivo | Ação | Observação |
|---|---|---|
| `src/features/auth/schemas.ts` | UPDATE | adicionar `novaSenhaSchema` + tipo |
| `src/features/auth/actions.ts` | UPDATE | adicionar `definirNovaSenha`; ajustar `redirectTo` de `resetPassword` |
| `src/app/auth/confirm/route.ts` | NEW | exchange do code → sessão → redirect |
| `src/app/(recovery)/layout.tsx` | NEW | layout centrado SEM guard |
| `src/app/(recovery)/nova-senha/page.tsx` | NEW | formulário client `useActionState` |
| `src/features/auth/__tests__/actions.test.ts` | UPDATE | testes da nova action + ajuste do teste de `resetPassword` |

### Estado atual dos arquivos UPDATE (ler antes de mexer)
- **`actions.ts`** (`'use server'`): contém `signIn`, `signUp` (já ramifica em `data.session` — Story 6.1), `signOut`, `resetPassword`. `resetPassword` hoje: `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${NEXT_PUBLIC_APP_URL}/nova-senha })`. Padrão de retorno das actions de auth: `{ error?: string; success?: boolean }`; `redirect()` no fim (lança). **Preservar**: assinatura/retorno e o `safeParse` na fronteira.
- **`reset-senha/page.tsx`** e **`cadastro/page.tsx`**: referência do padrão visual de estados (erro com `AlertCircle`, sucesso com `CheckCircle2`/`MailCheck`, `Card`). Reusar a mesma linguagem.
- **`(auth)/layout.tsx`**: é `async` e faz `getUser()` → `redirect('/planos')` se autenticado. **É exatamente por isso que `/nova-senha` NÃO pode ficar em `(auth)`** — a sessão de recovery tornaria o usuário "autenticado" e ele seria expulso antes de trocar a senha (AC-6).
- **`actions.test.ts`**: `makeSupabaseMock` central, `vi.mock('@/lib/supabase')`, `vi.mock('@/lib/prisma')`, `vi.mock('@/lib/brevo')`. `next/navigation` é mockado globalmente em `src/tests/setup.ts` — **não** remockar `redirect`.

### Gotcha crítico — fluxo PKCE do Supabase
`src/lib/supabase.ts` cria os clients **sem `flowType`**, então o `@supabase/ssr` usa **PKCE por padrão**. O link de recovery entrega um `?code=...` que precisa ser trocado por sessão via `exchangeCodeForSession(code)` **no servidor** (grava os cookies). Por isso o redirect do e-mail deve ir primeiro a um route handler (`/auth/confirm`), não direto à página. Tentar ler a sessão na página sem o exchange falha silenciosamente. [Source: `src/lib/supabase.ts`]

### Decisões recomendadas (reduzir ambiguidade)
- Após trocar a senha, **encerrar a sessão de recovery** (`signOut`) e mandar para `/login` — não manter o usuário logado por um link de recovery (postura de segurança, alinhada ao Contrato de Auth do Epic 6.1 / PRD §13 CB-1).
- `password` mínimo **8** (igual a `signUpSchema`), não 6 (que é do `signInSchema`, legado).

### Padrões do projeto a respeitar (project-context.md)
- Mutações = Server Actions; validação Zod na fronteira (`safeParse` quando vira mensagem de UI). Schemas em `features/<nome>/schemas.ts`.
- `cookies()` é async no Next 16 (o `createSupabaseServerClient` já trata).
- Identidade pt-BR em toda a UI; ortografia correta.
- Sem Prisma aqui — é puramente Supabase Auth (não há tabela `User` envolvida na troca de senha).
- Testes: `vi.mock` antes dos imports; `beforeEach(() => vi.clearAllMocks())`; gate 90% cobre `features/**` (a action conta; a página/route em `src/app/**` não conta para o gate, testes de UI são nice-to-have).

### Project Structure Notes
- Novo grupo de rota `(recovery)` é uma variância proposital em relação a `(auth)`: mesmo visual, mas sem o guard de autenticação — necessário pela AC-6. Documentar o porquê no layout (comentário).
- `src/app/auth/confirm/route.ts` segue o padrão de Route Handler (como `/api/*`), porém sob `/auth/*` por ser callback de auth, não API de dados.

### References
- [Source: `_bmad-output/planning-artifacts/epics.md`#Epic-6-Story-6.2]
- [Source: `_bmad-output/planning-artifacts/prds/prd-okr-2026-06-18/prd.md`#13-CB-2]
- [Source: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-06-22.md`]
- [Source: `src/features/auth/actions.ts` — resetPassword, padrão de actions]
- [Source: `src/app/(auth)/layout.tsx` — guard que motiva a AC-6]
- [Source: `src/lib/supabase.ts` — clients PKCE]
- [Source: `_bmad-output/project-context.md` — regras de Server Action/Zod/Next 16/testes]

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code)

### Debug Log References

- `pnpm test src/features/auth` → 30 passed
- `pnpm test` (suíte completa) → 226 passed (19 arquivos)
- `pnpm typecheck` → limpo
- `pnpm lint` → 0 errors (1 warning pré-existente, não relacionado: `empresa` unused em `criador-plano/__tests__/schemas.test.ts`)
- `pnpm build` → sucesso; rotas `/auth/confirm` e `/nova-senha` presentes no route tree

### Completion Notes List

- **Schema** (`novaSenhaSchema`): `password` min 8 + `confirmar`, com `.refine` (mensagem `As senhas não conferem`, `path: ['confirmar']`). Mensagens pt-BR. Tipo `NovaSenhaInput` exportado.
- **Action `definirNovaSenha`**: assinatura `useActionState`; `safeParse` na fronteira (retorna `{ error }` sem chamar Supabase em input inválido); `updateUser({ password })`; em falha do updateUser retorna mensagem orientando a pedir novo link (sem signOut/redirect); em sucesso `signOut()` (encerra a sessão de recovery) e `redirect('/login')` no fim (fora de try/catch).
- **Exchange do code (PKCE)**: criado `src/app/auth/confirm/route.ts` (GET). Lê `code` e `next` de `searchParams`, faz `exchangeCodeForSession(code)` com o server client (grava cookies), e `NextResponse.redirect` para `next` (default `/nova-senha`). Sem `code` ou em erro do exchange → redireciona para `/reset-senha?erro=link-invalido`. Usei `origin` da própria URL da request para montar o destino do redirect (robusto a env).
- **`resetPassword`**: `redirectTo` ajustado para `${NEXT_PUBLIC_APP_URL}/auth/confirm?next=/nova-senha`.
- **Grupo `(recovery)`**: layout replicando o visual centrado de `(auth)/layout.tsx` (brand-tint, wordmark OKR) **sem** o guard `getUser()→redirect('/planos')` — comentário no arquivo explica o porquê (AC-6). Layout é síncrono (não precisa de Supabase). Página `/nova-senha` (`'use client'`) com `useActionState`, campos `password`/`confirmar` (`type="password"`, `autoComplete="new-password"`), estado de erro inline com `AlertCircle` (o sucesso é via redirect para `/login`, então não há estado de sucesso na página).
- **Testes**: estendido `makeSupabaseMock` com `updateUser`; adicionados 4 casos de `definirNovaSenha` (senhas não conferem, senha curta, updateUser falha, sucesso) e 3 casos de `novaSenhaSchema`. Ajustada a asserção do teste de `resetPassword` para `redirectTo` contendo `/auth/confirm`.
- **Config (Task 5 — ação do usuário)**: garantir que `NEXT_PUBLIC_APP_URL` esteja setado e que a URL `…/auth/confirm` esteja na allowlist de **Redirect URLs** no painel Supabase (Auth → URL Configuration). Sem isso, o Supabase recusa o `redirectTo` do e-mail de recovery.

### File List

- `src/features/auth/schemas.ts` (UPDATE) — `novaSenhaSchema` + tipo `NovaSenhaInput`
- `src/features/auth/actions.ts` (UPDATE) — `definirNovaSenha`; `redirectTo` de `resetPassword`
- `src/app/auth/confirm/route.ts` (NEW) — exchange PKCE do code → sessão → redirect
- `src/app/(recovery)/layout.tsx` (NEW) — layout centrado sem guard
- `src/app/(recovery)/nova-senha/page.tsx` (NEW) — formulário client `useActionState`
- `src/features/auth/__tests__/actions.test.ts` (UPDATE) — testes de `definirNovaSenha` + ajuste de `resetPassword`
- `src/features/auth/__tests__/schemas.test.ts` (UPDATE) — testes de `novaSenhaSchema`
