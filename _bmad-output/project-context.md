---
project_name: 'okr'
user_name: 'Alexandretorres'
date: '2026-06-18'
sections_completed:
  ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
optimized_for_llm: true
existing_patterns_found: 12
---

# Project Context for AI Agents — okr

_Regras críticas e padrões não-óbvios que agentes de IA DEVEM seguir ao implementar código neste projeto. Foco em detalhes que um LLM esqueceria sem ser lembrado. Não repete o óbvio._

> Reconstrução de um SaaS de OKR antes feito em Bubble. O legado vive em `docs/legacy/` apenas como referência de regras de negócio e prompts de IA — **não** é a fonte de verdade da implementação atual.

---

## Stack & Versões (constraints que importam)

| Item | Versão | Constraint não-óbvio |
|---|---|---|
| Next.js | **16.1.6** | App Router. `cookies()` e `params` são **async** — sempre `await`. |
| React | **19.2.3** | Server Components por padrão; `'use client'` só quando há estado/efeito/handlers. |
| Tailwind | **v4** | Config via CSS (`globals.css` + `@tailwindcss/postcss`), **não** `tailwind.config.js`. |
| UI primitivos | **Base UI** (`@base-ui/react` ^1.3.0) | **NÃO é Radix.** shadcn v4 aqui roda sobre Base UI. |
| shadcn | **v4** (^4.1.1) | Usa **`render` prop**, não `asChild` (padrão Radix). |
| Prisma | **^6.19.2** | Client gerado; singleton em `lib/prisma.ts`. |
| Supabase | `@supabase/ssr` ^0.5.2 | Auth + RLS. Cliente server vs browser separados. |
| OpenAI | ^4.104.0 | Modelo via `MODELO_PADRAO` (`gpt-4o`) em `lib/openai.ts`. |
| Zod | **^3.23.8** | v3 — `error.errors[0].message`, `.cuid()`, `.default()`. Não usar API do Zod v4. |
| Vitest | ^2.1.9 | jsdom + globals. |
| TypeScript | ^5 | `strict: true`. Alias `@/*` → `src/*`. |

---

## Regras Críticas de Implementação

### Linguagem (TypeScript)

- **`strict` ligado** — nada de `any` implícito. Para mocks de teste use casts explícitos (`as unknown as ...`), padrão já usado no projeto.
- **Imports sempre via alias `@/`** (mapeado para `src/`). Nunca caminhos relativos longos (`../../../`).
- **Idioma do domínio é pt-BR**: entidades, campos, enums e variáveis de negócio em português (`Objetivo`, `valorAlvo`, `tipoMetrica`, `no_prazo`). Mantenha essa convenção — não traduza identificadores existentes para inglês.

### Framework (Next.js 16 / React 19)

- **Mutações = Server Actions** (`'use server'`). API Routes **só** para webhooks e streaming de IA (`/api/ai/*`, `/api/webhooks/*`).
- **Sem Prisma em componentes.** Todo acesso a dados passa por `features/<nome>/actions.ts` (mutações) ou `features/<nome>/queries.ts` (leitura server-side).
- **Forms usam o padrão `useActionState`**: actions de auth têm assinatura `(prevState, formData)` e retornam `{ error?: string }` / `{ success?: boolean }` — não lançam para erros de validação esperados.
- **Validação com Zod na fronteira da action**: `schema.parse()` (lança) para inputs internos confiáveis; `schema.safeParse()` quando o erro vira mensagem de UI. Os schemas vivem em `features/<nome>/schemas.ts` e exportam o tipo via `z.infer`.
- **`redirect()` do `next/navigation`** é chamado no fim da action (lança internamente — não colocar em `try/catch` que engula o erro).
- **Streaming de IA** usa Route Handlers com `ReadableStream` (evita timeout). Geração em lote (criar plano inteiro) roda dentro da Server Action de forma síncrona.

### Singletons & Integrações Externas

- **`lib/prisma.ts`**: singleton global (evita esgotar conexões em dev/hot-reload). Sempre importar `{ prisma }` daqui.
- **`lib/openai.ts`**: client é um **Proxy lazy** — só instancia no primeiro uso, não no import. Use `openai` e `MODELO_PADRAO` exportados; não instanciar `new OpenAI()` em outro lugar.
- **`lib/supabase.ts`**: `createSupabaseServerClient()` (async, usa `cookies()`) para Server Components/Actions; `createSupabaseBrowserClient()` para client. Não misturar.
- **`lib/brevo.ts`**: emails via `sendEmail({ to, templateId, params })` com `TEMPLATES` nomeados. **Envio de email é não-fatal** — sempre dentro de `try/catch` que continua o fluxo se falhar (padrão já estabelecido no `signUp`).
- **Identidade dupla**: o `User` do Prisma usa o **mesmo UUID** do usuário do Supabase Auth (`id: data.user.id`). Ao criar usuários, propagar esse id — não gerar cuid novo.

### Modelo de Domínio (regras que o schema não conta)

- **Multi-tenant por `clienteId`** — toda query/mutação de dados deve ser escopada ao `Cliente`. A **defesa primária é o código** (`assertMesmoTenant` + filtro `clienteId` no `where`): hoje a RLS do Postgres **não** cobre o caminho do Prisma, que conecta como role `postgres` (BYPASSRLS). A RLS (`prisma/sql/rls_tenant_isolation.sql`) é **rede secundária**, só efetiva sob conexão sujeita a RLS (supabase-js, ou Prisma sob role não-privilegiado — Opção B, follow-up). Nunca confie na RLS para escopar dados via Prisma.
- **Hierarquia de planos**: plano corporativo tem `planoPaiId: null`; planos de apoio (departamento) apontam para o pai. Plano "raiz" do tenant = `planoPaiId: null`.
- **`PlanoEstrategico` é auxiliar**, não pai na hierarquia — guarda os inputs do wizard (SWOT, missão, visão, valores) e vincula ao `Plano` gerado.
- **Cálculos de KR centralizados** em `features/key-result/lib/calculos.ts` (`calculateProgress`, `calculateRisk`, `gerarLinhaTendencia`). Não reimplementar as fórmulas inline — ver `docs/architecture.md §4`.
- **Ao atualizar valor de KR**: salvar `HistoricoValores`, recalcular progresso/risco do KR **e** o progresso ponderado do `Objetivo`, então disparar email (se a flag do usuário permitir). É uma cadeia — não pular etapas.

### Testes (mínimo 90% cobertura)

- **Test-first.** Escrever teste antes da implementação.
- **Localização**: `features/<nome>/__tests__/*.test.ts`. Exceção co-localizada existente: `lib/calculos.test.ts` ao lado da lib.
- **Mocks obrigatórios** de Prisma, Supabase, OpenAI e Brevo via `vi.mock('@/lib/...')`. Padrão: declarar `vi.mock` **antes** dos imports do módulo testado, depois importar e castar (`prisma as unknown as Record<...>`).
- **`next/navigation` e `next/cache` já são mockados globalmente** em `src/tests/setup.ts` — não remockar em cada teste.
- **Factories** em `src/tests/factories/index.ts` (`makeCliente`, `makeUser`, `makePlano`, ...) com `overrides: Partial<T>`. Usar e estender estas em vez de montar objetos Prisma à mão.
- **`beforeEach(() => vi.clearAllMocks())`** em todo arquivo de teste.
- **Cobertura exclui** `src/app/**`, `src/lib/**`, `src/components/**` (ver `vitest.config.ts`) — o foco de cobertura é `features/**`. E2E em `tests/e2e/**` roda no Playwright, fora do Vitest.

### Qualidade & Estilo

- **ESLint flat config** (`eslint.config.mjs`) com `eslint-config-next` core-web-vitals + typescript. `pnpm lint` roda só em `src`.
- **Nomes de arquivo**: componentes React em **PascalCase** (`PlanoTree.tsx`, `KRPanel.tsx`); libs/utils/actions/queries em **kebab/camel** minúsculo (`actions.ts`, `calculos.ts`, `use-mobile.ts`).
- **Componentes `ui/`** seguem o padrão shadcn: `cva` para variantes, helper `cn()` de `@/lib/utils`, `data-slot="..."`, e espalham `...props` sobre o primitivo Base UI.
- **`pnpm` é o gerenciador** — não `npm`/`yarn`.

### Workflow & Gotchas

- **Validar build após CLIs mexerem em config** (ex.: `shadcn add`, `prisma`): rodar `pnpm build` / `pnpm typecheck`. CLIs já quebraram arquivos de config antes neste projeto.
- **Prisma**: `db:push` para iteração local, `db:migrate` para mudanças versionadas; rodar `db:generate` após editar o schema.
- **Não commitar nem dar push sem o usuário pedir.** Mensagens de commit e PRs seguem o rodapé padrão da casa.
- **`docs/legacy/` é referência, não código vivo** — extrair regras de negócio e prompts de lá, mas implementar do zero na stack nova.
- **NÃO usar API do Radix** (`asChild`, imports de `@radix-ui/*`) — este projeto é Base UI. Confundir os dois quebra silenciosamente.
- **Datas e SSR**: `cookies()`/`params`/`searchParams` são Promises no Next 16 — esquecer o `await` causa erro em runtime, não em type-check às vezes.

---

---

## Como usar este arquivo

**Para agentes de IA:**
- Leia este arquivo antes de implementar qualquer código.
- Siga TODAS as regras como escritas. Na dúvida, escolha a opção mais restritiva.
- Atualize o arquivo quando um novo padrão recorrente emergir.

**Para humanos:**
- Mantenha lean e focado no que o agente erraria. Prefira a regra que evita um erro real a uma boa prática genérica.
- Atualize quando a stack ou os padrões mudarem; revise periodicamente e remova o que virou óbvio.

_Última atualização: 2026-06-18_
