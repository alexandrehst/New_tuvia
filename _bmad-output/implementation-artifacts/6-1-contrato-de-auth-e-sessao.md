# Story 6.1: Contrato de auth & sessão

Status: done

<!-- Code review (2026-06-23): diff = docs §7.2 + 1 cenário E2E; matriz confere com o código real; review limpo, 0 patches. PENDENTE não-código: config Supabase (Task 2). -->


<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

> **Natureza desta story:** o COMPORTAMENTO já foi implementado nas Stories 6.2 e 6.3. A 6.1 **formaliza o contrato**: documenta a matriz de acesso, trava o que já existe com teste/verificação, e fecha a pendência de **config do Supabase** ("Confirm email"). Pouco código novo — é a story que "fecha o contrato" do Epic 6.

## Story

As a responsável pela segurança do produto,
I want uma matriz de acesso por estado de autenticação e uma política de verificação de e-mail explícita e documentada,
so that ninguém acesse a app sem identidade verificada e os estados de sessão sejam previsíveis e auditáveis.

## Acceptance Criteria

1. **Given** um usuário autenticado em rota pública (`/login`, `/cadastro`, `/reset-senha`), **Then** é redirecionado para `/planos` (já implementado — `src/app/(auth)/layout.tsx`).
2. **Given** qualquer rota `(app)/*`, **When** não há sessão válida, **Then** redireciona para `/login` (já implementado — `src/app/(app)/layout.tsx` via `getUser()`).
3. **Given** cadastro com verificação exigida, **Then** o `signUp` **não cria sessão** e mostra "verifique seu email" — não autentica (já implementado — `src/features/auth/actions.ts` ramifica em `data.session`).
4. **Given** o estado **autenticado-não-verificado**, **Then** ele **não alcança `(app)/*`** porque, com "Confirm email" ligado, o Supabase **não emite sessão** antes da confirmação — ou seja, o usuário não-verificado é efetivamente anônimo até confirmar. Isso deve estar **documentado** como o mecanismo que torna o estado intermediário seguro.
5. **Given** o painel do Supabase, **Then** **"Confirm email" está ligado** (Auth → Sign In / Providers → Email) e o procedimento + verificação estão documentados (passo do usuário; não-código).
6. **Given** a documentação do projeto, **Then** existe uma **matriz de acesso por estado** (anônimo | autenticado-não-verificado | autenticado) registrada em `docs/architecture.md`, alinhada ao PRD §13 (CB-1).
7. **Given** a suíte, **Then** o contrato testável (ramificação de `signUp` em `data.session`; guard das páginas de auth) está coberto; o que é nível-layout/fluxo fica como spec E2E (pode ficar `fixme` até o seed/Confirm-email em ambiente de teste).

## Tasks / Subtasks

- [x] **Task 1 — Documentar a matriz de acesso** (AC: 4, 6) — adicionada §7.2 "Contrato de auth & sessão" em `docs/architecture.md` com a matriz e a nota de por que o estado não-verificado não existe como sessão.
- [~] **Task 2 — Config do Supabase (não-código; passo do USUÁRIO)** (AC: 5) — procedimento documentado na §7.2 do `docs/architecture.md` e no Completion Notes. **PENDENTE: ação manual do usuário no painel** (ligar Confirm email + allowlist `/auth/confirm`).
- [x] **Task 3 — Travar o contrato testável** (AC: 7) — verificado: `actions.test.ts` já cobre os dois ramos do `signUp` (sem sessão → `{ success: true }` sem redirect, linha 159; com sessão → `/planos`, linha 148). Nenhuma mudança necessária.
- [x] **Task 4 — Spec E2E da matriz de acesso** (AC: 1, 2, 7) — AC-2 (anônimo em `(app)/*` → `/login`) já existia em `tests/e2e/auth.spec.ts`; adicionado o espelho AC-1 (autenticado em `/login` e `/cadastro` → `/planos`).

## Dev Notes

### Por que esta story é "magra" em código
O Epic 6 foi implementado fora de ordem (6.2 primeiro, por ser um bug vivo). O guard das páginas de auth e a ramificação de verificação do `signUp` **nasceram na 6.2**. A 6.1 não reimplementa nada — ela **formaliza e fecha o contrato**. Não invente código novo de auth; verifique, documente e configure. [Source: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-06-22.md`; `epics.md`#Epic-6-Story-6.1; `prd.md`#13-CB-1]

### Matriz de acesso (o artefato central a documentar)

| Estado | Rotas públicas (`/login`, `/cadastro`, `/reset-senha`) + `(recovery)` | `(app)/*` |
|---|---|---|
| **Anônimo** (sem sessão) | Acessa normalmente | Redireciona → `/login` |
| **Autenticado-não-verificado** | Não existe como sessão: com "Confirm email" ON o Supabase não emite sessão até confirmar; o cadastro mostra "verifique seu email" | Não alcança (não há sessão) |
| **Autenticado** (verificado) | Redireciona → `/planos` (guard do `(auth)/layout`) | Acessa |
| **Sessão de recovery** (link de senha) | `/nova-senha` vive em `(recovery)` (fora de `(auth)`, sem o guard) — ver 6.2 | Não deve ser usada para navegar no app (ver follow-up de honestidade no review-epic6) |

### Estado atual dos arquivos relevantes (NÃO reimplementar — verificar)
- **`src/app/(auth)/layout.tsx`** (UPDATE-já-feito na 6.2): `async`, `getUser()` → `redirect('/planos')` se houver usuário. Cobre AC-1. **Não** colocar `/nova-senha` aqui (está em `(recovery)`).
- **`src/app/(app)/layout.tsx`** (existente): `getUser()` → `redirect('/login')` se `!user`. Cobre AC-2.
- **`src/features/auth/actions.ts`** (`signUp`, já-feito na 6.2): após criar Cliente+User e enviar boas-vindas, `if (!data.session) return { success: true }` (não loga); senão `redirect('/planos')`. Cobre AC-3. **Preservar.**
- **`src/app/(auth)/cadastro/page.tsx`** (já-feito na 6.2): renderiza o estado de sucesso "verifique seu email" (`MailCheck`). Cobre o lado de UI do AC-3.
- **`src/features/auth/guards.ts`**: `getCurrentUser`/`requireUser` (usam `getUser()` — revalida JWT, não confia só no cookie). Reusar; não duplicar.

### Arquivos a tocar nesta story
| Arquivo | Ação | Observação |
|---|---|---|
| `docs/architecture.md` | UPDATE | seção "Contrato de auth & sessão" + matriz (Task 1) |
| `src/features/auth/__tests__/actions.test.ts` | VERIFY/UPDATE | confirmar cobertura do contrato de `signUp` (Task 3) |
| `tests/e2e/*` | NEW (opcional) | spec da matriz, pode ser `fixme` (Task 4) |
| (painel Supabase) | CONFIG | "Confirm email" + Redirect URLs (Task 2, passo do usuário) |

### Padrões do projeto (project-context.md)
- `getUser()` (não `getSession`) é o padrão — revalida o JWT no Auth server. Já aplicado nos guards/layouts.
- Actions de auth: assinatura `(prevState, formData)`, retorno `{ error?: string; success?: boolean }`, sem lançar para erro esperado; `redirect()` no fim.
- Cobertura 90% cobre `features/**`; `src/app/**` (layouts/páginas) fica fora — por isso o contrato de layout é verificado por E2E/inspeção, não por unit.
- pt-BR na UI, ortografia correta.

### Dependência / sequência
- Depende de fatos entregues por **6.2** (guard de auth, verificação no signUp) e **6.3** (onboarding pós-verificação). Não há código de auth novo aqui.
- A config "Confirm email" (Task 2) **destrava em produção** o comportamento que o código já assume — sem ela, o `signUp` ainda recebe sessão e loga direto.

### References
- [Source: `_bmad-output/planning-artifacts/epics.md`#Epic-6-Story-6.1]
- [Source: `_bmad-output/planning-artifacts/prds/prd-okr-2026-06-18/prd.md`#13 (CB-1)]
- [Source: `_bmad-output/implementation-artifacts/6-2-redefinicao-de-senha-nova-senha.md` (origem do guard + verificação)]
- [Source: `src/app/(auth)/layout.tsx`, `src/app/(app)/layout.tsx`, `src/features/auth/actions.ts`, `src/features/auth/guards.ts`]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (sessão principal, implementação inline).

### Debug Log References

typecheck ✓ · 261 testes ✓ · lint 0 erros (1 warning pré-existente) · build ✓.

### Completion Notes List

- Story "de fechamento de contrato": o comportamento já existia (6.2/6.3). Nada de código de auth novo — apenas documentação, verificação e o registro da config pendente.
- **Matriz de acesso** documentada em `docs/architecture.md` §7.2, com a nota-chave: com "Confirm email" ON, o estado *autenticado-não-verificado* não existe como sessão (Supabase não emite sessão pré-confirmação) → o estado intermediário é seguro por construção.
- **Cobertura de teste** do contrato confirmada sem mudança (signUp ramifica em `data.session`); AC-2 da matriz já tinha E2E; adicionado o E2E de AC-1.
- **AÇÃO PENDENTE DO USUÁRIO (Task 2 / AC-5):** no painel Supabase — Authentication → Sign In / Providers → Email → **ligar "Confirm email"**; e Auth → URL Configuration → adicionar `…/auth/confirm` aos **Redirect URLs**. Sem isso, o `signUp` recebe sessão e loga direto, quebrando a matriz. Verificar cadastrando um e-mail de teste: deve cair em "verifique seu email" sem sessão, e o link de confirmação deve levar ao app.

### File List

- `docs/architecture.md` (UPDATE — nova §7.2 Contrato de auth & sessão)
- `tests/e2e/auth.spec.ts` (UPDATE — cenário AC-1: autenticado em rota pública → /planos)
- (verificado, sem alteração) `src/features/auth/__tests__/actions.test.ts`, `src/app/(auth)/layout.tsx`, `src/app/(app)/layout.tsx`, `src/features/auth/actions.ts`
