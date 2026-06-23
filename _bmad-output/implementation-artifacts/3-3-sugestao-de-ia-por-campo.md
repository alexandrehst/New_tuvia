---
baseline_commit: 3fc72022d95bea1724c1ccc7cef4de6c56aeb95d
---

# Story 3.3: Sugestão de IA por campo

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a administrador (Carla),
I want sugestões de IA editáveis em cada campo,
so that eu acelere o preenchimento sem perder o controle.

> Refina o fluxo de sugestões que o `CriadorWizard` (3.2) já invoca. Endpoints `/api/ai/*` permanecem.

## Acceptance Criteria

1. Num campo assistido (visão/missão/valores/oportunidades/ameaças), acionar "Sugerir com IA" consome o `/api/ai/*` existente e mostra estado **carregando → sugestões editáveis**. (FR-15, UX-DR14)
2. **Conteúdo nunca é imposto**: as sugestões aparecem como opções; o usuário escolhe (campo único = substitui; lista = anexa) e pode editar/remover livremente antes de avançar. (FR-16)
3. **Falha da IA → mensagem inline associada ao campo** (`role="alert"`) e o usuário continua podendo escrever manualmente; o resto do wizard não é afetado. (UX-DR17)
4. **Resultado vazio** (IA não retornou nada) mostra feedback discreto ("Nenhuma sugestão gerada; escreva manualmente.") no campo.
5. **Helper testável**: a busca/parse de sugestões vive em `features/criador-plano/lib/sugestoes.ts` (lança em falha, retorna lista em sucesso) e é testada (gate 90%).
6. **Sem regressão**: geração final (`createPlanoCorporativo`) e estrutura em passos (3.2) intactas. `pnpm typecheck/lint/test/build` passam. Transversais: pt-BR, dark, Base UI, a11y.

## Tasks / Subtasks

- [x] **Task 1 — Helper `fetchSugestoes` + teste** (AC: 1, 5) — novo `src/features/criador-plano/lib/sugestoes.ts` + `__tests__/sugestoes.test.ts`
  - [x] `export async function fetchSugestoes(endpoint: string, body: object): Promise<string[]>`: `fetch('/api/ai/'+endpoint, POST json)`; se `!res.ok` → `throw new Error(...)`; senão `await res.text()` → split por linha, trim, filtra vazios, `slice(0,5)`. (usa `res.text()` em vez de ler o stream manualmente — equivalente para o uso atual e testável.)
  - [x] Teste (mock `global.fetch`): sucesso → lista parseada (trim/filtra/≤5); `!ok` → rejeita; corpo vazio → `[]`.
- [x] **Task 2 — Estados por campo no wizard** (AC: 1, 2, 3, 4) — `src/features/criador-plano/components/CriadorWizard.tsx`
  - [x] Substituir o `fetchAI` interno por `fetchSugestoes`. Estado `erros: Record<string,string>`. `suggest(key, endpoint, body)`: `setLoadingAI(key)`; limpa `erros[key]`; `try` → `suggestions[key] = items`; `catch` → `erros[key] = 'Não foi possível gerar sugestões. Escreva manualmente.'`; `finally setLoadingAI(null)`.
  - [x] Unificar campos-lista (valores/oportunidades/ameaças) ao mesmo padrão de **pick explícito**: as sugestões aparecem na lista `Suggestions`; clicar **anexa** o item (se ainda não estiver) — sem auto-impor.
  - [x] Render por campo assistido: `SuggestButton` + (se `erros[key]`) alerta inline `role="alert"` tokenizado + (se `suggestions[key]`) `Suggestions` (com nota "Nenhuma sugestão gerada…" quando vazio). Campo segue editável sempre.
- [x] **Task 3 — Validação** (AC: 6) — `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Dev Notes

### Estado atual (LER)
- **`CriadorWizard`** (reescrito na 3.2): tem `fetchAI` interno (lê o stream e retorna `[]` em falha — **engole o erro**), `suggest(key, endpoint, body)`, `loadingAI`, `suggestions: Record<string,string[]>`, e o sub-componente `Suggestions` (lista de botões → `onPick`). Campos único (visão/missão) usam `Suggestions` (pick substitui); **campos-lista (valores/oportunidades/ameaças) hoje auto-anexam** o resultado direto (sem pick). `SuggestButton` mostra "Gerando…".
- **Rotas `/api/ai/*`** (NÃO alterar): `visao`, `missao`, `valores`, `oportunidades`, `ameacas`, `objetivos`, `key-results`, `sugerir-objetivo`. Retornam `text/plain` (stream), uma sugestão por linha. `res.text()` lê o corpo completo (equivalente ao loop atual).
- **Primitivos**: `Button`/`Input`/`Textarea`/`Label` já em uso (3.2). Alerta inline: `div role="alert"` com `text-destructive`/`bg-destructive/10` (mesmo padrão de KRPanel/KRSheet).

### Decisões
- **Pick explícito também para listas** (atende "nunca imposto"): clicar a sugestão anexa ao array (sem duplicar). Substitui o auto-append atual.
- **`res.text()`** em vez de ler `ReadableStream` manualmente: simplifica e torna o helper testável; o wizard já esperava o buffer completo antes de exibir (não havia streaming incremental na UI).

### Guardrails / escopo
- Só a experiência de sugestão por campo. Não tocar nas rotas `/api/ai/*` nem em `createPlanoCorporativo`. Publicar = 3.4.
- Helper em `features/criador-plano/lib` (gate — testar). Componente fora do gate.
- Base UI, tokens, dark, pt-BR.

### Project Structure Notes
- NEW: `src/features/criador-plano/lib/sugestoes.ts` (+ `__tests__/sugestoes.test.ts`).
- UPDATE: `src/features/criador-plano/components/CriadorWizard.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3 / Story 3.3 (FR-15/16, UX-DR14/17)]
- [Source: src/features/criador-plano/components/CriadorWizard.tsx (fetchAI/suggest/Suggestions — 3.2)]
- [Source: src/app/api/ai/*/route.ts (endpoints text/plain)]
- [Source: src/features/key-result/components/KRPanel.tsx (padrão de alerta inline role=alert)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
- **Implementação (2026-06-19):**
- **`features/criador-plano/lib/sugestoes.ts`** (NEW): `fetchSugestoes(endpoint, body)` — `fetch` POST → `!ok` lança, senão `res.text()` → split/trim/filtra/≤5. 5 testes (mock `global.fetch`: parse, limite 5, vazio, erro, endpoint correto) → **186 verdes**.
- **`CriadorWizard`**: `fetchAI` interno (engolia erro) substituído por `fetchSugestoes`. Estado `erros: Record<string,string>` por campo; `suggest()` com try/catch/finally — sucesso preenche `suggestions[key]`, falha grava erro inline. Helper `assistedExtras(key, onPick, testIdPrefix)` renderiza alerta `role="alert"` + lista `Suggestions` (com nota "Nenhuma sugestão gerada…" quando vazio). Campo segue sempre editável.
- **Pick explícito também nas listas** (valores/oportunidades/ameaças): sugestões viram opções clicáveis que **anexam** (via `appendUnico`, sem duplicar) — não mais auto-impostas.
- **Preservado**: endpoints `/api/ai/*`, geração `createPlanoCorporativo`, estrutura em passos (3.2).
- **Verificação:** `pnpm typecheck` ✓ · `pnpm test` 186/186 ✓ · `pnpm lint` exit 0 · `pnpm build` ✓.

### Change Log
- 2026-06-19 — Story 3.3: fetchSugestoes (helper testável, +5 testes); erro/vazio inline por campo no wizard; pick explícito nas listas. typecheck/test/lint/build verdes.

### File List
- `src/features/criador-plano/lib/sugestoes.ts` (NEW) — helper de busca de sugestões.
- `src/features/criador-plano/lib/__tests__/sugestoes.test.ts` (NEW) — 5 testes.
- `src/features/criador-plano/components/CriadorWizard.tsx` (MODIFIED) — erro/vazio por campo, pick explícito, usa o helper.
