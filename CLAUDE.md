# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Rebuilding an OKR (Objectives and Key Results) management SaaS originally built in Bubble. The legacy system lives in `docs/legacy/` for reference — the new implementation is a Next.js full-stack app.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| Backend | Next.js API Routes + Server Actions |
| Database | PostgreSQL via Supabase, Prisma ORM |
| Unit/Integration tests | Vitest |
| E2E tests | Playwright |
| Error tracking | Sentry |
| Analytics | PostHog |
| Deploy | Vercel + GitHub CI/CD |

## Commands

```bash
# Install
pnpm install

# Dev server
pnpm dev

# Tests
pnpm test              # Vitest unit + integration
pnpm test:coverage     # Coverage report (min 90%)
pnpm test:e2e          # Playwright E2E

# Lint + type check
pnpm lint
pnpm typecheck

# Prisma
pnpm db:generate       # prisma generate
pnpm db:migrate        # prisma migrate dev
pnpm db:push           # prisma db push (for local iteration)
pnpm db:studio         # prisma studio
```

## Architecture

Feature-based modular structure — each domain feature is self-contained:

```
src/
  app/                  # Next.js App Router pages and layouts
  features/             # Domain features (plans, objectives, key-results, users, auth)
    <feature>/
      components/       # React components for this feature
      actions/          # Server Actions
      queries/          # Data fetching (server-side)
      hooks/            # Client-side React hooks
      schemas/          # Zod validation schemas
      types.ts          # Feature-specific types
      __tests__/        # Vitest unit + integration tests
  lib/
    prisma.ts           # Prisma client singleton
    supabase.ts         # Supabase client
    openai.ts           # OpenAI client
  components/           # Shared UI components
```

## Domain Model (key entities)

```
Cliente (org/tenant)
  └── PlanoEstrategico (top-level strategic plan with SWOT)
        └── Plano (plan, hierarchical — company or department level)
              └── Objetivo (objective, with assigned Responsaveis)
                    └── ResultadoChave (key result, with progress tracking)
                          └── HistoricoValores (value history over time)
```

Key concepts:
- Plans are hierarchical: a company plan (`Plano-pai: null`) has child department plans
- Key Results have weighted progress (`Progresso_ponderado`) and metric types
- Users have roles per plan (`PlanoUsuario.Papel`) and receive email notifications
- AI suggestions are generated for objectives and improvements via OpenAI
- Multi-tenant: each `Cliente` has isolated data

## Development Rules

**Test-first:** write tests before implementation. Minimum 90% coverage.

**Mock external calls:** OpenAI and Supabase/Prisma must be mocked in unit tests. Use `vi.mock()` for Vitest.

**Server Actions over API Routes** for mutations; API Routes only for webhooks and third-party integrations.

**No direct Prisma calls in components** — always go through Server Actions or query functions in `features/<name>/queries.ts`.

## Reference Docs

- `docs/architecture.md` — system architecture, data flow, API surface
- `docs/test-plan.md` — complete test plan
- `docs/database.md` — original Bubble schema (used for Prisma migration reference)
- `docs/flows/` — user flows (Portuguese)
- `docs/screens/` — UI mockups (PNG)
- `prisma/schema.prisma` — database schema
- `docs/legacy/okr-main/` — legacy Python backend (reference for business rules and OpenAI prompts)
