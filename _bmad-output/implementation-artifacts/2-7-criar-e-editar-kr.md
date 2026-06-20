---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 2.7: Criar e editar Resultado-Chave (KR)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a gestor,
I want criar e editar resultados-chave (metadados) num painel sobre o acompanhamento,
so that eu complete e ajuste os KRs sem sair da tela.

> Par da Story 2.4 (Objetivo), para KR. **Atualizar VALOR** é a Story 2.3; **excluir** é a 2.5.

## Acceptance Criteria

1. **`updateKeyResult` (nova Server Action)** em `features/key-result/actions.ts`: recebe `id` + `updateKeyResultSchema` (campos parciais, sem `objetivoId`); atualiza descricao/tipoMetrica/valorInicial/valorAlvo/unidade/peso. **Correção:** ao mudar a base (`valorInicial`/`valorAlvo`/`tipoMetrica`), **recalcula `progresso` e `status`** (de `calcularProgresso`/`calcularRisco` sobre o `valorAtual` atual) e **regenera a `LinhaTendencia`** (deleteMany + recriar de `gerarLinhaTendencia` com as datas do plano). Testada (gate 90%). (FR-25)
2. **Painel de KR em `Sheet`** (criar e editar): campos descrição, tipo de métrica (aumentar/reduzir/simNao), valor inicial, valor alvo, unidade, peso. Usa `createKeyResult`/`updateKeyResult`. Forms com `Input`/`Label`/`Button` + select de tipoMetrica (nativo tokenizado — não há primitivo Select). (FR-22, FR-25, UX-DR9/13)
3. **Triggers ligados**: "Adicionar KR" (rodapé de cada coluna no `ObjetivosBoard`) abre o painel em modo criar com o `objetivoId` da coluna; "Editar" (no `KRCard`, hoje `disabled`) abre em modo editar com os dados do KR. (FR-22/25)
4. **Reflexo**: após salvar, `router.refresh()` reflete a mudança; o painel fecha. (UX-DR13)
5. **Sem regressão / escopo**: NÃO atualizar valor (2.3) nem excluir (2.5); `createKeyResult` (com LinhaTendencia) preservado. `pnpm typecheck/lint/test/build` passam.
6. **Transversais**: paridade dark; pt-BR; a11y (labels, foco no Sheet, Esc); Base UI (sem asChild).

## Tasks / Subtasks

- [x] **Task 1 — `updateKeyResult` + teste** (AC: 1) — `features/key-result/actions.ts`, `__tests__/actions.test.ts`
  - [x] `export async function updateKeyResult(id: string, data: UpdateKeyResultInput)`: `updateKeyResultSchema.parse(data)`; buscar KR atual + `objetivo.plano` (datas) via `resultadoChave.findUniqueOrThrow({ include: { objetivo: { include: { plano: true } } } })`. Mesclar base nova (campo enviado ou valor atual) para `valorInicial`/`valorAlvo`/`tipoMetrica`. Recalcular `progresso` (`calcularProgresso`) e `status` (`calcularRisco`) usando o `valorAtual` atual. `resultadoChave.update` com metadados + progresso + status. Se o plano tiver datas, `linhaTendencia.deleteMany({ where: { resultadoChaveId: id } })` + recriar via `gerarLinhaTendencia`.
  - [x] Teste: mockar Prisma (`resultadoChave.findUniqueOrThrow/update`, `linhaTendencia.deleteMany/createMany`); verificar update com progresso/status recalculados + regeneração da tendência; e caso sem datas (sem regen).
- [x] **Task 2 — `KRSheet`** (AC: 2, 4, 6) — novo `features/key-result/components/KRSheet.tsx` (`'use client'`)
  - [x] Props: `mode` ('criar'|'editar'), `objetivoId` (criar), valores iniciais (editar: id + campos), `open`/`onOpenChange`. Form em `Sheet`. `useTransition`, erro inline, `router.refresh()` + fechar no sucesso. Select de `tipoMetrica` nativo com classes de token. Number inputs para valores/peso.
- [x] **Task 3 — Ligar triggers** (AC: 3) — `src/features/plano/components/ObjetivosBoard.tsx` + `src/features/key-result/components/KRCard.tsx`
  - [x] "Adicionar KR" (coluna) → abre `KRSheet` criar com `objetivoId={objetivo.id}`. `KRCard` passa a receber `onEditar` (ligado) → abre `KRSheet` editar com os dados do KR. Para editar, o KR precisa de `valorInicial` e `tipoMetrica` — incluir esses campos no tipo de KR do board (vêm do Prisma include).
- [x] **Task 4 — Validação** (AC: 5) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Dev Notes

### Estado atual (LER)
- **`features/key-result/actions.ts`**: `createKeyResult(data)` cria o KR (valorAtual=valorInicial) e, se o plano tem datas, gera `LinhaTendencia` via `gerarLinhaTendencia`. `updateKeyResultValor` (Story 2.3) atualiza valor + cadeia. **Falta `updateKeyResult`** (metadados) — criar. `calcularProgresso`/`calcularRisco`/`gerarLinhaTendencia` em `features/key-result/lib/calculos.ts`.
- **`features/key-result/schemas.ts`**: `createKeyResultSchema` = { objetivoId(cuid), descricao(min3), tipoMetrica(enum, default aumentar), valorInicial(default 0), valorAlvo(number), unidade?, peso(positive, default 1) }. `updateKeyResultSchema = createKeyResultSchema.omit({objetivoId}).partial()` (sem objetivoId; campos opcionais). `UpdateKeyResultInput` exportado.
- **`features/key-result/__tests__/actions.test.ts`**: já mocka `resultadoChave.{findUniqueOrThrow,update,create}`, `linhaTendencia.createMany`, etc. Adicionar `linhaTendencia.deleteMany` ao mock para o novo teste.
- **`KRCard`** (`features/key-result/components`): tem botões Atualizar/Editar/Histórico; Editar/Histórico ficam `disabled` quando sem handler. `KRCardData` tem descricao, valorAtual, valorAlvo, unidade, peso, progresso, status, updatedAt — **mas NÃO valorInicial nem tipoMetrica**. Para editar, esses dois vêm do Prisma (`getPlanoWithObjetivos` inclui todos os escalares do `ResultadoChave`); estender o tipo de KR no `ObjetivosBoard` para incluí-los e passar ao `KRSheet`.
- **`ObjetivosBoard`** (Story 2.2-2.4): client; já abre `Sheet` (KR valor) e `ObjetivoSheet`. Adicionar estado para o `KRSheet` (criar/editar) e ligar "Adicionar KR" + `onEditar` do KRCard.

### Recálculo (correção — por que importa)
- `progresso`/`status` dependem de `valorInicial`/`valorAlvo`/`tipoMetrica`. Editar a base sem recalcular deixaria a % e a pílula erradas. Reutilizar `calcularProgresso(tipoMetrica, valorInicial, valorAlvo, valorAtual)` e `calcularRisco({dataInicio,dataFim,valorInicial,valorAlvo,valorAtual,tipoMetrica})` (datas do plano). **Não** mexer no `valorAtual` (é gerido pela 2.3). A `LinhaTendencia` (baseline) também depende de valorInicial/valorAlvo → regenerar.

### Guardrails / escopo
- **NÃO** atualizar valor (2.3) nem excluir (2.5). Só metadados do KR (+ recálculo/tendência consequentes).
- Reutilizar `Sheet`/`Input`/`Label`/`Button`. `tipoMetrica`: select nativo `<select>` com classes de token (sem primitivo Select; sem dependência nova).
- Lógica/validação em `features/**` (action testada); `KRSheet` em `features/key-result/components` (fora do gate).
- `parse` lança em erro de validação — o client trata com try/catch e mostra erro inline.

### Testes / verificação
- `updateKeyResult` → `features/**` → teste obrigatório (gate 90%). Mockar Prisma; cobrir recálculo + regen de tendência (com e sem datas do plano).
- `KRSheet`/board/card → fora do gate; build/typecheck/visual.

### Project Structure Notes
- NEW: `src/features/key-result/components/KRSheet.tsx`.
- UPDATE: `src/features/key-result/actions.ts` (+ `__tests__/actions.test.ts`), `src/features/plano/components/ObjetivosBoard.tsx`, `src/features/key-result/components/KRCard.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2 / Story 2.7 (FR-22/25, UX-DR9/13) — split da 2.4]
- [Source: docs/architecture.md §3.1 (cria KR + LinhaTendencia), §4 (cálculos), §6]
- [Source: src/features/key-result/actions.ts (createKeyResult, updateKeyResultValor), schemas.ts (updateKeyResultSchema), lib/calculos.ts]
- [Source: src/features/key-result/components/KRCard.tsx (onEditar disabled), src/features/plano/components/ObjetivosBoard.tsx]
- [Source: _bmad-output/implementation-artifacts/2-4-criar-e-editar-objetivo.md (padrão de Sheet/form/action+teste)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-18):**
- **`updateKeyResult(id, data)`** (nova action): atualiza metadados; **recalcula progresso/status** (`calcularProgresso`/`calcularRisco` sobre o `valorAtual` atual, base mesclada) + **progresso ponderado do Objetivo** + **regenera `LinhaTendencia`** (deleteMany+createMany) quando o plano tem datas. 3 testes (recálculo+regen, sem datas, validação) → **170 testes verdes** (+3).
- **`KRSheet`** (`features/key-result/components`): Sheet criar/editar com descrição, `tipoMetrica` (select nativo tokenizado), valor inicial/alvo, unidade, peso; `useTransition`, erro inline, `router.refresh()` no sucesso. Payload de update sem objetivoId; create com objetivoId.
- **`ObjetivosBoard`**: tipo de KR estendido com `valorInicial`+`tipoMetrica` (vêm do Prisma include); "Adicionar KR" (coluna) abre criar; `onEditar` do `KRCard` (antes inerte) abre editar. KRSheet remonta por `key`.
- **Escopo:** só metadados. Atualizar valor (2.3) e excluir (2.5) intactos; `createKeyResult`+LinhaTendencia preservado.
- **Verificação:** `pnpm typecheck` ✓ · `pnpm test` 170/170 ✓ · `pnpm lint` exit 0 · `pnpm build` ✓.

### Change Log
- 2026-06-18 — Story 2.7: updateKeyResult (recálculo + regen tendência, +3 testes); KRSheet (criar/editar); ObjetivosBoard liga Adicionar KR + Editar do card. typecheck/test/lint/build verdes.

### File List
- `src/features/key-result/actions.ts` (MODIFIED) — nova action `updateKeyResult`.
- `src/features/key-result/__tests__/actions.test.ts` (MODIFIED) — 3 testes de updateKeyResult + mock deleteMany.
- `src/features/key-result/components/KRSheet.tsx` (NEW) — painel criar/editar KR.
- `src/features/plano/components/ObjetivosBoard.tsx` (MODIFIED) — Adicionar KR / Editar KR + tipo estendido.
