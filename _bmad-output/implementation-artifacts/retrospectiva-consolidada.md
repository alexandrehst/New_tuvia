# Retrospectiva consolidada — Redesenho de UX (Epics 1–5)

**Período:** 2026-06-18 a 2026-06-21 · **Facilitação:** consolidada (Scrum Master)
**Objetivo do projeto:** validar o uso do método BMad re-skinando a UX de um SaaS de OKR (Bubble → Next.js), sem features novas.

## 1. Resultado (o quê)

| Métrica | Valor |
|---|---|
| Epics entregues | 5/5 `done` |
| Stories entregues | 22/22 `done` |
| Testes unit (Vitest) | 210 verdes |
| Laudos de code-review | 6 (todos Approve / Approve-with-nits) |
| Commits na branch | 3 (redesenho + nits + segurança/observabilidade) |
| typecheck / lint / build | limpos em toda a sequência |
| Entrega | branch `feat/redesenho-ux`, PR #1 aberto |

Escopo do PRD (NFR-1..7: design system, responsivo, dark, a11y, perf percebida, pt-BR, consistência de status) **100% atendido**.

## 2. O que foi bem 🟢

- **Disciplina do loop BMad** (`create-story → dev-story → code-review`) deu ritmo previsível e rastreável; cada story validada (typecheck/lint/test/build) antes de fechar.
- **Fonte única de verdade** repetida com sucesso: `key-result/lib/status.ts` e `plano/lib/status.ts` (NFR-7) — eliminou divergências de status e o `PlanoTree`.
- **Code-review pegou problemas reais**, não cosméticos: o CRITICAL do Epic 1 (rewrite do `globals.css` quebrando tokens legados do KRPanel/CriadorWizard) e a unificação de 3 mapeamentos de status divergentes.
- **Fatiamento sob demanda** (Story 2.4 → 2.4/2.7/2.8 por entidade) manteve as stories pequenas e revisáveis.
- **Dívida tratada como cidadã de primeira classe**: tokens legados rastreados desde o Epic 1 e **eliminados** na 3.2 (com grep provando zero consumidores antes de remover).
- **Decisões de escopo registradas** (ex.: recálculo de KRs ao mudar datas do plano; "publicar" = geração do wizard) — o `AskUserQuestion` foi usado quando a decisão era genuinamente do usuário.
- **`party-mode`** ajudou a destravar a estrutura dos epics (ordem, onde colocar editar/excluir).

## 3. O que não foi bem / atritos 🔴

- **A "gate de 90%" era fantasma.** O `CLAUDE.md`/stories falavam em 90%, mas o `vitest.config` não tinha `thresholds` e ainda contava componentes (0%) → cobertura agregada real ~65%. "Testado" significava "lógica em lib/actions testada", não um número aplicado.
- **Componentes de UI sem teste** → bugs de integração escaparam para o runtime: o `MenuGroupRootContext is missing` (topbar) só apareceu ao abrir o menu, em uso manual. Unit de lógica não pega isso.
- **Specs E2E desatualizadas descobertas tarde** — `acompanhamento.spec`/`criar-plano.spec` apontavam para a UI antiga (árvore/labels); estavam "verdes" só porque não rodavam. Realinhadas depois.
- **Segurança ficou implícita até ser auditada.** `getSession()` (inseguro) foi usado inclusive nos guards novos do L2; RLS nunca existiu. Só viraram tema quando o usuário perguntou.
- **Ambiente travou verificação visual**: Supabase pausado (NXDOMAIN) bloqueou o login; e o usuário seedado era `membro`, então o L2 (requireAdmin) travou a tela de usuários até promovê-lo.
- **Fricções de tooling**: subagent types `bmad-agent-*` inexistentes (party-mode); script em `/tmp` sem resolver módulos pnpm; caracteres especiais de path (`(app)`/`[id]`) quebrando comandos no zsh.

## 4. Aprendizados 💡

- **Re-skin brownfield expõe lacunas de integração que o unit não cobre** → E2E e/ou testes de componente são o investimento certo de qualidade aqui (não unit com mock pesado de UI).
- **"Gate" tem que ser executável.** Afirmar cobertura sem `thresholds` no config é teatro; medir por camada (lógica vs. apresentação) e aplicar de fato.
- **Escopo do PRD ≠ riscos reais do produto.** O PRD do redesenho (só UX) era um bom recorte, mas segurança/observabilidade eram riscos vivos — vale um checklist transversal de NFR de plataforma mesmo num projeto "só de UX".
- **Endurecimento precisa de fundação correta**: o L2 (autorização) só vale com `getUser()` por baixo; fazer na ordem errada dá falsa sensação de segurança.
- **Dados de teste fazem parte do "pronto"**: seed com papéis coerentes (um admin) evita que regras de autorização pareçam bug.

## 5. Destaques por epic

- **E1 Fundação** — tokens/dark/shell/breadcrumb; review pegou o quebra-tokens (corrigido com aliases temporários, depois removidos).
- **E2 Acompanhamento (herói)** — o maior: board, CRUD objetivo/KR, atualizar valor (cadeia + e-mail), histórico (SVG), excluir, editar plano; fatiado em 8.
- **E3 Criação de planos** — wizard reescrito em passos + IA por campo; **dívida de tokens legados zerada**.
- **E4 Usuários** — membros/papéis/notificações + convite (Brevo não-fatal); base do L2.
- **E5 Entrada pública** — landing + auth em cartão; shell de auth unificado.

## 6. Ações de follow-up (carry-forward)

| # | Ação | Prioridade | Estado |
|---|---|---|---|
| 1 | `getSession → getUser` (revalidar JWT) | Alta | ✅ feito (pós-redesenho) |
| 2 | Autorização multi-tenant nas actions (L1/L2) | Alta | ✅ feito |
| 3 | Sentry (observabilidade) | Alta | ✅ wirado (ativa com DSN) |
| 4 | **RLS no Supabase** (defesa no banco) | Alta | ⬜ pendente |
| 5 | Configurar `thresholds` de cobertura por camada | Média | ⬜ pendente |
| 6 | Testes de componente / E2E com seed (rodar de fato) | Média | ⬜ parcial (specs realinhadas; faltam dados) |
| 7 | Headers de segurança (CSP/HSTS) + rate limiting | Média | ⬜ pendente |
| 8 | PostHog (analytics) | Baixa | ⬜ pendente |
| 9 | Realinhar/seedar specs E2E em `fixme` | Baixa | ⬜ pendente |

## 7. Avaliação do BMad (este projeto era um teste do método)

**Funcionou bem:** o encadeamento PRD → UX → Epics/Stories → Sprint → loop de implementação deu estrutura e rastreabilidade reais; o `dev-story` com validação obrigatória e o `code-review` adversarial agregaram qualidade concreta; os artefatos (`_bmad-output/`) viraram memória útil entre sessões.

**Pontos de atrito do método:** muito boilerplate de prompt re-injetado a cada invocação de skill (custo de contexto); o conceito de "gate" não se conectou a uma config executável; nenhum passo forçou E2E/teste de UI, então a lacuna de qualidade de runtime passou. `create-architecture` foi pulado (brownfield) sem prejuízo.

**Veredito:** para um re-skin brownfield, o BMad **entregou o ciclo de planejamento→execução→revisão com disciplina**. O que ele não substitui: um plano de testes de integração/E2E e um checklist de NFR de plataforma — que precisaram ser puxados manualmente.

---

_Retrospectiva consolidada dos Epics 1–5. Marca o encerramento formal do exercício de redesenho._
