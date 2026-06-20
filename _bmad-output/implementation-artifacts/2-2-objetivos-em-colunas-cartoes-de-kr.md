---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 2.2: Objetivos em colunas + cartões de KR

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a usuário (Bruno/Marina),
I want ver os objetivos em colunas e cada resultado-chave como cartão,
so that eu encontre rapidamente o que me interessa e leia o estado de cada KR.

## Acceptance Criteria

1. **Objetivos em colunas**: cada Objetivo é uma coluna com cabeçalho — rótulo "OBJETIVO N", título, **progresso ponderado** (de `objetivo.progresso`) e os **avatares dos responsáveis** (`objetivo.responsaveis`, FR-24). (FR-19, UX-DR8)
2. **Cartão de KR**: para cada `ResultadoChave`, um cartão com descrição, **`StatusPill`** (de `kr.status`), **`KRProgress`** (de `kr.progresso` — verde+check a 100%), **% e valor atual/alvo** em `text-metric`, e **timestamp relativo** ("atualizado há X" de `kr.updatedAt`). (FR-20, UX-DR6)
3. **Ações no hover/trigger**: o cartão revela ações (atualizar valor / editar / histórico) no hover (desktop) e visíveis em touch. **Os painéis em si são as Stories 2.3-2.5** — nesta story as ações são o *trigger*; para **não regredir** a função existente, a ação "atualizar valor" continua abrindo o `KRPanel` atual (redesenho do painel = 2.3). (FR-21 trigger)
4. **Status unificado**: usa exclusivamente `StatusPill`/`KRProgress` da Story 2.1 — **nada de rótulos divergentes** ("Em dia"/"Atrasado") nem `Badge` com cores hardcoded. A 100%, o "concluído" é tratamento do progresso (verde+check), não um status. (NFR-7)
5. **Aposenta `PlanoTree`**: a lista de objetivos em `planos/[id]/page.tsx` passa a usar o novo componente de colunas; `PlanoTree.tsx` (com a `StatusBadge` divergente e o warning de import) é removido se não houver outro consumidor. (quita dívida do review)
6. **Responsivo**: `≥lg` colunas lado a lado com rolagem horizontal quando excede; `sm` empilham em coluna única, cartões full-width. (UX-DR19)
7. **Sem regressão / só leitura**: NÃO criar painéis de criar/editar/excluir (Stories 2.4-2.5); NÃO mexer na faixa de resumo (Story 2.1) nem no breadcrumb (1.5). Atualizar valor segue funcional via KRPanel existente. `pnpm typecheck/lint/test/build` passam.
8. **Transversais**: paridade dark; pt-BR; a11y (status com rótulo textual via StatusPill; ações alcançáveis por teclado, não só hover).

## Tasks / Subtasks

- [x] **Task 1 — Helper de tempo relativo** (AC: 2) — `src/features/key-result/lib/` (ou `src/lib`)
  - [x] `tempoRelativo(date)` → "agora"/"há N min"/"há N h"/"há N dias"/data curta. Pequeno, puro, **testado** se ficar em `features/**` (gate 90%). Usar `Intl`/cálculo simples (sem nova dependência).
- [x] **Task 2 — `KRCard`** (AC: 2, 3, 4, 8) — `src/features/key-result/components/KRCard.tsx` (`'use client'` se tiver hover/trigger state)
  - [x] Props: o `ResultadoChave` (descricao, valorAtual/Alvo, unidade, peso, progresso, status, updatedAt) + callback de "atualizar valor". Render: descrição, `StatusPill status={kr.status}`, `KRProgress value={kr.progresso}`, % + `valorAtual/valorAlvo unidade` em `text-metric`, timestamp relativo. Ações reveladas no hover (e visíveis em foco/touch); "atualizar" chama o callback.
- [x] **Task 3 — Colunas de Objetivo** (AC: 1, 5, 6) — novo `src/features/plano/components/ObjetivosBoard.tsx` (`'use client'`)
  - [x] Substitui `PlanoTree` na página. Renderiza cada Objetivo como coluna: cabeçalho (OBJETIVO N, título, progresso ponderado, avatares de `responsaveis`) + lista de `KRCard`. Layout `flex` com colunas (`min-w`/`max-w`), rolagem horizontal em `lg`, empilha em `sm`.
  - [x] Mantém o estado de abertura do `KRPanel` (preserva atualizar valor — não regredir). Importa `KRPanel` existente; redesenho dele é a 2.3.
- [x] **Task 4 — Trocar na página + remover PlanoTree** (AC: 5, 7) — `src/app/(app)/planos/[id]/page.tsx`
  - [x] Substituir `<PlanoTree planos={[plano]} initialExpanded={id} />` por `<ObjetivosBoard objetivos={objetivos} />` (ou props equivalentes). Manter o estado vazio (objetivos.length === 0) e o cabeçalho "Objetivos (N) + Novo objetivo" (o botão Novo objetivo é da Story 2.4 — manter como trigger sem painel novo).
  - [x] `grep` por `PlanoTree` em `src`; se só a página usava, **deletar** `src/features/plano/components/PlanoTree.tsx`.
- [x] **Task 5 — Validação** (AC: 7) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Dev Notes

### Componentes prontos da Story 2.1 (CONSUMIR, não recriar)
- `src/components/status-pill.tsx` → `StatusPill status={StatusRisco}` (rótulo + cor de token, a11y).
- `src/components/kr-progress.tsx` → `KRProgress value={number}` (verde+check a 100%).
- `src/features/key-result/lib/status.ts` → fonte única (não duplicar mapeamento).

### Estado atual — `PlanoTree.tsx` (o que substituir; LER)
- `features/plano/components/PlanoTree.tsx` (`'use client'`): hoje renderiza objetivos como cartões verticais empilhados, cada um expansível, com KRs em linhas. Tem `useState` para `expandedObjetivos` e `openKR`. Ao clicar num KR, abre o `KRPanel` inline (fluxo de **atualizar valor** — preservar!).
- **`StatusBadge` interno (l.115-127)** usa rótulos divergentes ("Em dia"/"Em risco"/"Atrasado") + "Concluído" a 100%, com classes Tailwind hardcoded → **descartar**; usar `StatusPill` + `KRProgress`.
- Tipos de dados (reaproveitar): `Objetivo {id, titulo, numero, progresso, resultadosChave[], responsaveis?: {user:{nome}}[]}`; `ResultadoChave {id, descricao, tipoMetrica, valorInicial, valorAlvo, valorAtual, unidade, peso, progresso, status}`. **`updatedAt`** existe no model Prisma (`@updatedAt`) — incluir no uso para o timestamp (vem no `include` de `getPlanoWithObjetivos`; se o tipo local não listar, estender o tipo).
- `CircleProgress` interno (gauge do objetivo) pode ser reaproveitado/movido ou recriado simples para o cabeçalho da coluna.

### Realidade do modelo (decisão de escopo)
- **Responsáveis são do Objetivo, não do KR** (`ObjetivoResponsavel`; o KR não tem responsável no schema). Portanto os avatares de responsáveis vão no **cabeçalho da coluna do Objetivo** (FR-24), não em cada cartão de KR. O FR-20 menciona "avatar do responsável" no KR — interpretar como responsável do objetivo no header da coluna; **não** inventar responsável por KR. (Anotar como nota; se o usuário quiser responsável por KR, é mudança de schema → fora do escopo.)

### Estado atual — `planos/[id]/page.tsx`
- Server Component. A faixa de resumo (Story 2.1) e o breadcrumb (1.5) já estão prontos — **não tocar**. A seção de objetivos (≈ l.174-194) tem o cabeçalho "Objetivos (N)" + botão "Novo objetivo" e renderiza `PlanoTree` (ou estado vazio). Trocar só o render da lista por `ObjetivosBoard`. O botão "Novo objetivo" permanece como trigger (painel de criar = Story 2.4).

### Guardrails / escopo
- **NÃO** criar/editar/excluir (Stories 2.3-2.5); **NÃO** redesenhar o `KRPanel` (2.3) — só mantê-lo funcional como trigger de atualizar.
- **CM1 (funcionalidade intacta):** atualizar valor de KR deve continuar funcionando após esta story (via KRPanel atual).
- Base UI, não Radix. Tokens/`StatusPill`/`KRProgress` — nada de cor de status hardcoded. Componentes de domínio em `features/*/components`.
- Colunas: cuidar de overflow horizontal sem quebrar o shell (a sidebar/topbar do Epic 1).

### Testes / verificação
- O helper `tempoRelativo` (se em `features/**`) entra no gate 90% → testar. Componentes (`KRCard`, `ObjetivosBoard`) em `features/*/components` e `src/components` ficam fora do gate (verificação por build/visual).
- Regressão: rodar `pnpm test` (148+ testes) — não quebrar. Conferir que remover `PlanoTree` não deixa import órfão.

### Project Structure Notes
- NEW: `src/features/key-result/components/KRCard.tsx`, `src/features/plano/components/ObjetivosBoard.tsx`, `src/features/key-result/lib/tempo.ts` (+ teste).
- UPDATE: `src/app/(app)/planos/[id]/page.tsx`.
- DELETE (se órfão): `src/features/plano/components/PlanoTree.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2 / Story 2.2 (FR-19/20/21/24, UX-DR6/8)]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/mockups/acompanhamento.html — colunas + KR cards de referência]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-okr-2026-06-18/DESIGN.md#Components (KR card, Coluna de Objetivo)]
- [Source: src/features/plano/components/PlanoTree.tsx — componente a substituir + tipos de dados]
- [Source: src/components/status-pill.tsx, src/components/kr-progress.tsx, src/features/key-result/lib/status.ts — Story 2.1]
- [Source: _bmad-output/implementation-artifacts/2-1-faixa-de-resumo-componentes-de-status.md — componentes consumidos]
- [Source: _bmad-output/implementation-artifacts/review-epic1.md — dívida: unificar status / aposentar labels divergentes]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-18):**
- **`tempo.ts`** (`features/key-result/lib`): `tempoRelativo()` (agora/min/h/dias/data) — função pura de módulo (Date.now fora de componente, sem violar regra de hooks). Teste com 6 casos → **162 testes verdes** (+6).
- **`KRCard`** (`features/key-result/components`): descrição + `StatusPill(kr.status)` + `KRProgress(kr.progresso)` + % (`text-lg`, tabular) + valor atual/alvo + timestamp relativo; ações (Atualizar/Editar/Histórico) reveladas em `group-hover`/`focus-within` (a11y por teclado). Atualizar dispara callback.
- **`ObjetivosBoard`** (`features/plano/components`, client): objetivos em **colunas** (`flex`, `lg:flex-row` + overflow-x; `sm` empilha). Cabeçalho = OBJETIVO N + título + progresso ponderado + avatares de `responsaveis` (FR-24). Lista de `KRCard`. **Preserva atualizar valor** abrindo o `KRPanel` existente inline (sem regressão — redesenho do painel = 2.3). Add-KR como trigger (criar = 2.4).
- **Página**: `PlanoTree` → `ObjetivosBoard objetivos={objetivos}`. Faixa de resumo (2.1) e breadcrumb (1.5) intocados.
- **`PlanoTree.tsx` DELETADO** (só a página usava) — elimina a `StatusBadge` divergente ("Em dia"/"Atrasado") e quita a dívida do review (status unificado via StatusPill/KRProgress). Bônus: sumiu 1 dos 2 warnings de lint pré-existentes.
- **Decisão de dados:** responsáveis no cabeçalho da coluna do Objetivo (schema não tem responsável por KR).
- **Verificação:** `pnpm typecheck` ✓ · `pnpm test` 162/162 ✓ · `pnpm lint` exit 0 (1 warning pré-existente em teste do criador) · `pnpm build` ✓.

### Change Log
- 2026-06-18 — Story 2.2: ObjetivosBoard (colunas) + KRCard consumindo StatusPill/KRProgress; tempoRelativo (+teste); PlanoTree aposentado. typecheck/test/lint/build verdes.

### File List
- `src/features/key-result/lib/tempo.ts` (NEW) — tempo relativo.
- `src/features/key-result/__tests__/tempo.test.ts` (NEW) — testes do tempo relativo.
- `src/features/key-result/components/KRCard.tsx` (NEW) — cartão de KR.
- `src/features/plano/components/ObjetivosBoard.tsx` (NEW) — colunas de objetivo.
- `src/app/(app)/planos/[id]/page.tsx` (MODIFIED) — usa ObjetivosBoard.
- `src/features/plano/components/PlanoTree.tsx` (DELETED) — substituído; rótulos de status divergentes eliminados.
