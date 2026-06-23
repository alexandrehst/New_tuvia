# Code Review — Epic 6 (Contrato Comportamental & de Segurança)

Data: 2026-06-23 · Modo: full (3 camadas: Blind Hunter, Edge Case Hunter, Acceptance Auditor)
Escopo: working tree não commitado (Epic 6 + fixes de segurança da sessão). Diff: 44 arquivos, ~2600 linhas.
Veredito-base: **backend de autorização sólido e conforme a spec** (D1–D4, 6.2, 6.3 verificados ✓). Achados concentram-se em endurecimento e UI.

## Triagem: 3 decision-needed · 9 patch · 6 defer · 5 dismissed

### 🟠 Decision-needed — RESOLVIDOS (2026-06-23)

- [x] **Leitura intra-tenant (`getKRHistorico`)** → **RESOLVIDO: aceitar leitura intra-tenant.** Membros do mesmo cliente podem ler todos os planos do tenant. Sem patch (dismiss).
- [x] **`gerirPlano` em `arquivado`** → **RESOLVIDO: bloquear.** Arquivado = somente leitura também para gestão de membros. Virou patch (ver P10).
- [x] **Transição `edicao → arquivado`** → **RESOLVIDO: manter** (arquivar rascunho). Sem mudança.

### 🔴 Patch (correção sem ambiguidade)

- [x] **[Review][Patch] Redirect interno arbitrário via `next` no callback de recovery** [src/app/auth/confirm/route.ts:10] — `next` da query é concatenado sem validação; após `exchangeCodeForSession` (já autenticado) redireciona para path arbitrário. Validar que `next` começa com `/` e não com `//`/`/\`/scheme; senão `/nova-senha`. (blind+edge)
- [x] **[Review][Patch] `PlanoLifecycleControls`: reabrir/arquivar não desabilitam (duplo-submit)** [src/features/plano/components/PlanoLifecycleControls.tsx] — `confirmarTransicao` roda fora de `startTransition`, então `isPending` nunca fica true para esses botões → duplo-clique dispara a action 2x. Usar startTransition (ou o pending do ConfirmDialog). (blind)
- [x] **[Review][Patch] TOCTOU nas transições de estado** [src/features/plano/actions.ts:256] — `transicionarPlano` lê o status e depois faz `update` sem compare-and-swap; dois cliques concorrentes podem materializar transição inválida. Usar `update({ where: { id, status: <esperado> } })`. (blind+edge)
- [x] **[Review][Patch] Testes de action não asseguram a operação correta** [src/features/*/__tests__/actions.test.ts] — com o guard mockado no-op, nenhum teste verifica que a action chama `assertPodeMutarPlano` com a operação/planoId certos; uma inversão de operação (afrouxando estado) passaria verde. Adicionar `toHaveBeenCalledWith(planoId, user, '<op>')`. (blind, auditor)
- [x] **[Review][Patch] `definirNovaSenha`: sessão de recovery pode sobreviver** [src/features/auth/actions.ts:131] — se `updateUser` falhar, a função retorna sem `signOut`, deixando a sessão de recovery viva; e o retorno do `signOut` é descartado. Fazer signOut também no erro e tratar falha. (blind+edge)
- [x] **[Review][Patch] Board/KRPanel não refletem o estado (6.4 AC-6)** [src/app/(app)/planos/[id]/page.tsx, ObjetivosBoard.tsx, KRPanel.tsx] — controles de criar/editar estrutura ficam habilitados em `publicado`/`arquivado` e "Atualizar valor" em `arquivado` (backend bloqueia, mas UI só mostra banner). Passar `status`/`podeEdicao` e desabilitar. (auditor)
- [x] **[Review][Patch] Transição idempotente X→X gera erro confuso** [src/features/plano/lib/status.ts] — `ativarPlano` num plano já Ativo lança "transição inválida de Ativo para Ativo" (comum em duplo-clique). Tratar destino==estado como no-op benigno. (edge)
- [x] **[Review][Patch] Mensagem de erro de estado enganosa para status desconhecido** [src/features/auth/guards.ts:120] — o `else` assume "publicado"; um estado fora do enum reporta "Plano publicado…" incorretamente. Mensagem genérica/defensiva. (edge)
- [x] **[Review][Patch] Erro do `/auth/confirm` não é exibido** [src/app/(auth)/reset-senha/page.tsx] — redireciona com `?erro=link-invalido`, mas a página não lê o param (a rota `/reset-senha` existe — não é 404). Exibir a mensagem. (blind)
- [x] **[Review][Patch] Bloquear `gerirPlano` em `arquivado`** [src/features/auth/guards.ts:85] — (decisão do usuário) `estadoPermiteOperacao` deve negar `gerirPlano` quando `status === 'arquivado'` (transições continuam tratadas pela máquina de estado). Arquivado = somente leitura também para gestão de membros. + teste no guards.test.ts.

### 🟢 Defer (pré-existente ou decisão explícita)

- [x] **[Review][Defer] RLS inerte no caminho atual (Opção C)** — Prisma conecta como `postgres` (BYPASSRLS); RLS só atua via supabase-js. Decisão consciente (Opção C); Opção B é follow-up. (blind+edge)
- [x] **[Review][Defer] `createPlanoCorporativo` não-transacional + `choices[0]` sem guarda** [plano/actions.ts] — estado parcial/órfão se OpenAI falhar; pré-existente ao Epic 6. (edge)
- [x] **[Review][Defer] `calcularRisco` usa `new Date()` quando plano sem datas** [key-result/actions.ts] — intervalo zero → risco errado; pré-existente; inconsistente com a tendência (que guarda por datas). (edge)
- [x] **[Review][Defer] `inviteUser` cria User sem id do Supabase** [usuarios/actions.ts] — reconciliação convite→signup quebrada (id cuid ≠ auth.uid); pré-existente (Epic 4). (edge)
- [x] **[Review][Defer] `assertMesmoTenant` aceita null/null** [guards.ts:30] — latente (User.clienteId é non-null hoje). (edge)
- [x] **[Review][Defer] `updatePlano` lê o plano duas vezes** [plano/actions.ts] — guard refaz o `findUniqueOrThrow`; perf menor, sem impacto de correção. (auditor)

### ⚪ Dismissed (ruído/falso-positivo/by-design)

- `updateNotificacao` "perdeu o guard" (blind) — **falso**: função inalterada, mantém `requireAdmin` + `assertMesmoTenant`.
- owner ≠ admin é ampliação de privilégio (blind) — **by design** (D1/D2: owner gere o próprio plano).
- `signUp` catch vazio / `data.session` (blind) — **by design** (e-mail não-fatal; `data.user` é checado antes).
- Teste de redirect "fraco" (blind) — padrão-padrão de mock de `next/navigation`.
- Nome `ativarPlano` vs `publicarPlano` (auditor) — cosmético; o D3 prioriza o rótulo "Ativar".
