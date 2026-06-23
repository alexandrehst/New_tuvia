# Stories 2.3 + 2.4 — Code Review

**Verdict: Approve-with-nits** — implementação correta e aderente às regras; só 3 nits Low (sem bloqueio). Cadeia de KR e validações reutilizadas; nenhuma regressão.

Escopo: diff congelado `/tmp/epic2-2334.diff` (8 arquivos, +719/−173). Lentes: Blind Hunter, Edge Case Hunter, Acceptance Auditor.

---

## Low

### L1 — `descricao` não pode ser limpa na edição de objetivo
- **File:** `src/features/objetivo/components/ObjetivoSheet.tsx` (`descricao: descricao.trim() || undefined`).
- **Lens:** Edge Case Hunter.
- **Issue:** ao editar, esvaziar a descrição envia `undefined` → `prisma.objetivo.update` **ignora** o campo (não limpa). Usuário não consegue remover uma descrição existente. (No create é irrelevante.)
- **Fix (opcional):** no modo editar, enviar a string aparada (`descricao: descricao.trim()`) para permitir limpar; manter `|| undefined` no create.

### L2 — `numero` de novo objetivo é calculado no cliente (corrida teórica)
- **File:** `src/features/plano/components/ObjetivosBoard.tsx` (`proximoNumero = max(numero)+1`).
- **Lens:** Edge Case Hunter.
- **Issue:** dois "Novo objetivo" em sequência antes do `router.refresh()` poderiam reusar o mesmo número. Mitigado: o Sheet fecha + `router.refresh()` recomputa a cada abertura. Sem constraint de unicidade no schema (pré-existente). Risco baixo.
- **Fix (opcional):** computar o próximo número no servidor na criação.

### L3 — Override otimista de KR persiste após `router.refresh()` de edição de objetivo
- **File:** `src/features/plano/components/ObjetivosBoard.tsx` (`overrides` em estado de cliente).
- **Lens:** Blind Hunter.
- **Issue:** editar um objetivo dispara `router.refresh()` (refaz o Server Component) mas o estado de `overrides` do KR persiste no cliente. Benigno — o override igual ao valor já persistido no banco; não diverge dentro da sessão. Nota apenas.

---

## What's solid
- **2.3:** `KRPanel` migrado para tokens novos + `Input`/`Label`/`Button` + `StatusPill`/`KRProgress` (grep confirmou zero token legado); cadeia `updateKeyResultValor` reutilizada (não reimplementada); reflexo otimista via override no card + `aria-live`; erro inline `role="alert"` com valor preservado; painel em `Sheet` (foco/Esc do primitivo). Quita a dívida de tokens do KRPanel.
- **2.4:** `updateObjetivo` reconcilia responsáveis corretamente (deleteMany+createMany), respeitando que `updateObjetivoSchema` omite `planoId`; `getClienteUsuarios` escopado a `clienteId`. Ambos testados no gate `features/**` (167 testes). `ObjetivoSheet` separa payload create (com planoId) vs update (sem); `router.refresh()` reflete a mudança; multi-seleção de responsáveis com labels (a11y). `ObjetivosBoard` remonta o Sheet por `key` (reset de form). Página delega corretamente e busca usuários por `plano.clienteId`.
- **Disciplina:** Base UI (sem Radix/asChild), tokens (sem hex de status), Server Components/Client boundaries corretos, `parse`/zod nas fronteiras. typecheck ✓, lint exit 0, build ✓.

## False alarms checked
- `createObjetivo` vs `updateObjetivo` payloads — divergência de schema (planoId) tratada corretamente (não é bug).
- Dois `Sheet` (KR + Objetivo) montados juntos — ok, só um abre por vez.
- `descricao` null do Prisma no `initial` — `?? ''` no estado trata.

---

## Resolução (2026-06-18)
- **L1/L2/L3 — ACEITOS como nits documentados** (não bloqueiam; baixo impacto). L1 (limpar descrição) e L2 (numero server-side) ficam como melhoria futura; L3 é benigno. **Veredito: Approve.**
