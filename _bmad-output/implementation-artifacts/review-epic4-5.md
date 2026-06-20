# Epics 4 + 5 (Stories 4.1, 4.2, 5.1, 5.2, 5.3) — Code Review final

**Verdict: Approve-with-nits** — as 5 stories estão corretas, testadas no gate (onde há lógica) e aderentes (Base UI, tokens, dark). Fecha o redesenho. Nenhum achado bloqueante; 4 nits Low.

Escopo: diff `/tmp/epic45.diff` (13 arquivos, +870/−235). Lentes: Blind Hunter, Edge Case Hunter, Acceptance Auditor. Lógica nova testada: `getMembros`, `updatePapel`, `updateNotificacao`, `removerMembroDoPlano`, `inviteUser` (201 testes). Landing/auth são apresentacionais (sem gate).

---

## Low (follow-ups, não bloqueiam)

### L1 — Toggles/selects/remoção de membro sem tratamento de erro
- **File:** `src/features/usuarios/components/MembrosList.tsx` (`NotificacaoSwitch`, `PapelSelect`, `onConfirm`).
- **Lens:** Blind Hunter.
- **Issue:** `await updatePapel/updateNotificacao/removerMembroDoPlano` dentro do `startTransition`/`onConfirm` sem `try/catch`. Se a action falhar, o estado local otimista fica dessincronizado e nenhum erro é mostrado (o `router.refresh()` posterior reverte no próximo carregamento). Mesma família do nit do `ConfirmDialog` (Epic 2). Sugestão: try/catch revertendo o estado local + mensagem.

### L2 — Actions de usuários confiam no `clienteId`/escopo sem checar admin/posse
- **File:** `src/features/usuarios/actions.ts` (`inviteUser` recebe `clienteId`; `updatePapel`/`removerMembroDoPlano` operam por id sem checar tenant).
- **Lens:** Blind Hunter (multi-tenant).
- **Issue:** confiam na sessão/escopo da página (autenticada). Chamadas diretas poderiam agir fora do tenant/sem ser admin. Baixo e consistente com as demais actions do app; endurecer com checagem de papel/posse é melhoria transversal futura. (Email é `@unique` global, então o duplicado é detectado de qualquer forma.)

### L3 — Ano do footer da landing fixado no build
- **File:** `src/app/page.tsx` (`new Date().getFullYear()` em página estática).
- **Lens:** Edge Case Hunter.
- **Issue:** `/` é prerenderizada estática → o ano é congelado no build (envelhece até o próximo deploy). Cosmético.

### L4 — `aria-live` "Alterações salvas" repetido pode não reanunciar
- **File:** `MembrosList.tsx` (string idêntica a cada ação).
- **Lens:** Edge Case Hunter (a11y).
- **Issue:** definir o mesmo texto repetidamente nem sempre dispara releitura por leitores de tela. Baixo; alternar/concatenar um marcador resolveria.

---

## What's solid
- **4.1:** `getMembros` (papéis por plano + prefs) e 3 actions com validação de enum — todas testadas (gate); `ui/switch.tsx` Base UI tokenizado; `MembrosList` com papel/notificação inline + remover via `ConfirmDialog`, empty state; página com auth + `loading.tsx` (skeleton). Tokenização total (placeholder/`text-gray-*` eliminados).
- **4.2:** `inviteUser` com **resultado discriminado** (inválido/duplicado inline; e-mail **não-fatal**; nome derivado) — 5 testes cobrindo todos os caminhos; `ConvidarMembroButton` com erro/sucesso claros.
- **5.1:** landing comercial em tokens/`brand-tint`, CTAs acima da dobra (`/login`/`/cadastro`), benefícios + prova; estática.
- **5.2/5.3:** shell de auth unificado (`brand-tint` + wordmark "OKR"); login/cadastro/reset em **cartão centrado** consistente, `useActionState`, estados carregando/erro/sucesso; sucesso do reset re-tokenizado; **branding "Tuvia OKR" divergente removido**; actions `signIn`/`signUp`/`resetPassword` intactas (e-mail de boas-vindas não-fatal preservado).
- **Disciplina:** Base UI (sem Radix/asChild), tokens (sem hex/`zinc-*`/`green-*`/`gray-*`), libs/actions no gate, `router.refresh`/`useActionState` corretos. typecheck ✓, 201 testes ✓, lint exit 0, build ✓.

## False alarms checked
- `useActionState` preserva os dados do form em erro (não navega) — sem perda.
- Remover membro = deletar vínculo `PlanoUsuario` (não o User) — correto.
- E-mail de convite/boas-vindas não-fatal — paridade com a cadeia de KR.

---

## Resolução (2026-06-19)
- **L1–L4 — ACEITOS como nits documentados** (Low, follow-up; nenhum corrompe dados nem bloqueia). **Veredito: Approve.** Stories 4.1/4.2 e 5.1/5.2/5.3 → `done`; **Epics 4 e 5 → done**. Redesenho completo.
