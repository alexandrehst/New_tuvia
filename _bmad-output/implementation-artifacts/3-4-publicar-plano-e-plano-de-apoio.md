---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 3.4: Publicar plano e plano de apoio

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a administrador (Carla),
I want publicar o plano e poder criar planos de apoio,
so that o plano vire operável e a hierarquia de departamentos exista.

> Última story do Epic 3. "Publicar" = a geração do wizard que já persiste o plano (AC1, feito na 3.2). O novo aqui é o **plano de apoio** (filho departamental).

## Acceptance Criteria

1. Concluído o wizard, a action existente (`createPlanoCorporativo`) persiste plano + objetivos + KRs e leva ao acompanhamento. (FR-17) — *já feito (3.2); manter.*
2. **A partir de um plano corporativo** posso criar um **plano de apoio** via nova action `createPlanoDepartamento(clienteId, data)` com `planoPaiId` correto, `tipo='apoio'`, `status='edicao'`. Testada (gate 90%). (FR-17)
3. **Trigger na UI**: na página do plano corporativo (`planos/[id]`), uma ação "Criar plano de apoio" abre um painel (título + datas) e, ao confirmar, cria o apoio e navega para o acompanhamento dele. O trigger só aparece em planos **corporativo**.
4. **Breadcrumb**: o plano de apoio mostra o pai na navegação (não árvore). — *já implementado na 1.5 (`getPlanoWithObjetivos.include.planoPai` + breadcrumb); confirmar.*
5. **Sem regressão / escopo**: não alterar `createPlanoCorporativo` nem o wizard; sem excluir plano (Epic 3 não cobre). `pnpm typecheck/lint/test/build` passam. Transversais: pt-BR, dark, Base UI, a11y.

## Tasks / Subtasks

- [x] **Task 1 — Schema + `createPlanoDepartamento` + teste** (AC: 2) — `src/features/plano/schemas.ts`, `actions.ts`, `__tests__/actions.test.ts`
  - [x] `createPlanoApoioSchema = z.object({ titulo: min3, planoPaiId: cuid, dataInicio: coerce.date, dataFim: coerce.date })` + `CreatePlanoApoioInput`.
  - [x] `createPlanoDepartamento(clienteId, data)`: `parse`; `prisma.plano.create({ data: { clienteId, planoPaiId, titulo, tipo: 'apoio', status: 'edicao', dataInicio, dataFim } })`; retorna `{ planoId }`. (`planoEstrategicoId` é nullable — apoio não tem.)
  - [x] Teste: cria com `tipo:'apoio'` + `planoPaiId` + `clienteId` + `status:'edicao'`; retorna `{ planoId }`; validação (título curto / cuid inválido) lança.
- [x] **Task 2 — `PlanoApoioButton` (trigger + Sheet)** (AC: 3) — novo `src/features/plano/components/PlanoApoioButton.tsx` (`'use client'`)
  - [x] Botão "Criar plano de apoio" (lucide `GitBranch`/`Plus`, variant outline) + `Sheet` com título + datas (`type=date`, pré-preenchidas com as do pai). `useTransition`, erro inline, `createPlanoDepartamento(clienteId, { planoPaiId, titulo, dataInicio, dataFim })` → `router.push('/planos/'+planoId)`.
- [x] **Task 3 — Ligar na página** (AC: 3, 4) — `src/app/(app)/planos/[id]/page.tsx`
  - [x] Ao lado do `PlanoEditButton`, renderizar `PlanoApoioButton` **apenas se `plano.tipo === 'corporativo'`** (envolver os botões num flex gap). Passar `clienteId`, `planoPaiId=plano.id`, datas do pai. Confirmar que o breadcrumb já mostra o pai (1.5) — sem mudança.
- [x] **Task 4 — Validação** (AC: 5) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Dev Notes

### Fatos verificados
- **`Plano`**: `tipo: TipoPlano (corporativo|apoio)`, `status: StatusPlano (edicao|publicado|arquivado)`, `planoPaiId String?`, `planoEstrategicoId String? @unique` (nullable → apoio sem plano estratégico próprio), `planoPai @relation("PlanoHierarquia")`. `getPlanoWithObjetivos` já inclui `planoPai {id,titulo}` e `planosFilhos`; `plano.tipo` está disponível na página (scalar).
- **`createPlanoCorporativo`** (não tocar): cria PlanoEstrategico + Plano corporativo + objetivos/KRs (IA) + tendência. O plano de apoio é **manual** (sem IA): cria o Plano filho vazio; objetivos/KRs entram pelo board (Epic 2 CRUD).
- **`updatePlano`** (2.8) existe; `PlanoEditButton` no cabeçalho da página `planos/[id]`. Adicionar o `PlanoApoioButton` ao lado.
- **Breadcrumb (1.5)**: a página já renderiza `plano.planoPai` como link quando presente (linhas ~88-97). AC4 satisfeito; só confirmar.
- **`createPlanoApoioSchema`**: usar `z.coerce.date()` (aceita string `YYYY-MM-DD` do input) e `z.string().cuid()` para `planoPaiId`.

### Decisões / escopo
- **"Publicar" = a confirmação do wizard** (AC1, já persiste e redireciona). Os ACs **não** pedem toggle de status `edicao→publicado`; não adicionar (fora de escopo / no-new-features).
- Plano de apoio criado em `status='edicao'` (consistente com o corporativo, que nasce em edição).
- Trigger só em `corporativo` (AC3: "a partir de um plano corporativo").

### Guardrails
- Action/schema em `features/plano` (gate — testar `createPlanoDepartamento`). `PlanoApoioButton` fora do gate.
- Base UI (sem asChild; `Button` usa `render`/`onClick`); tokens, dark; pt-BR. Reusa `Sheet`/`Input`/`Label`/`Button` (padrão de `PlanoEditButton`).

### Project Structure Notes
- NEW: `src/features/plano/components/PlanoApoioButton.tsx`.
- UPDATE: `src/features/plano/schemas.ts`, `src/features/plano/actions.ts` (+ `__tests__/actions.test.ts`), `src/app/(app)/planos/[id]/page.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3 / Story 3.4 (FR-17)]
- [Source: prisma/schema.prisma — Plano (tipo/status/planoPaiId/planoEstrategicoId nullable), enums TipoPlano/StatusPlano]
- [Source: src/features/plano/actions.ts (createPlanoCorporativo, updatePlano), schemas.ts (createPlanoSchema)]
- [Source: src/features/plano/components/PlanoEditButton.tsx (padrão de trigger+Sheet — 2.8)]
- [Source: src/app/(app)/planos/[id]/page.tsx (cabeçalho + breadcrumb com planoPai — 1.5)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-19):**
- **`createPlanoApoioSchema`** + **`createPlanoDepartamento(clienteId, data)`**: cria Plano filho `tipo:'apoio'`, `status:'edicao'`, `planoPaiId` (planoEstrategicoId nullable). +3 testes → **189 verdes**.
- **`PlanoApoioButton`** (`features/plano/components`): botão "Criar plano de apoio" + `Sheet` (título + datas pré-preenchidas com as do pai); `createPlanoDepartamento` → `router.push('/planos/'+planoId)`.
- **Página `planos/[id]`**: `PlanoApoioButton` ao lado do `PlanoEditButton`, **só quando `plano.tipo === 'corporativo'`** (cabeçalho em flex gap). Breadcrumb do pai já vinha da 1.5 (confirmado — sem mudança).
- **Escopo/decisão**: "Publicar" = a confirmação do wizard (AC1, já persiste/redireciona); ACs não pedem toggle `edicao→publicado` (não adicionado). Apoio é manual (objetivos/KRs via board).
- **Verificação:** `pnpm typecheck` ✓ · `pnpm test` 189/189 ✓ · `pnpm lint` exit 0 · `pnpm build` ✓.

### Change Log
- 2026-06-19 — Story 3.4: createPlanoDepartamento + schema (+3 testes); PlanoApoioButton; trigger na página só p/ corporativo. typecheck/test/lint/build verdes. **Fecha o Epic 3.**

### File List
- `src/features/plano/schemas.ts` (MODIFIED) — `createPlanoApoioSchema` + tipo.
- `src/features/plano/actions.ts` (MODIFIED) — `createPlanoDepartamento`.
- `src/features/plano/__tests__/actions.test.ts` (MODIFIED) — 3 testes.
- `src/features/plano/components/PlanoApoioButton.tsx` (NEW) — trigger + painel de plano de apoio.
- `src/app/(app)/planos/[id]/page.tsx` (MODIFIED) — liga o PlanoApoioButton (só corporativo).
