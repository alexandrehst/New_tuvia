# Deferred Work

## Deferred from: code review of Epic 6 (2026-06-23)

Itens reais mas não acionáveis agora — pré-existentes ao Epic 6 ou decisão explícita. Ver `review-epic6.md`.

- **RLS inerte no caminho atual (Opção B é o follow-up real).** Prisma conecta como `postgres` (BYPASSRLS); a RLS escrita (Opção C) só atua via supabase-js, que hoje só faz Auth. Defesa em profundidade real exige Opção B (Prisma sob role não-privilegiado + `SET LOCAL app.current_tenant` por request). Decisão consciente; abrir story dedicada quando justificar. [prisma/sql/rls_tenant_isolation.sql]
- **`createPlanoCorporativo` não-transacional + `choices[0]` sem guarda.** Estado parcial/órfão (`PlanoEstrategico` sem `Plano`, ou plano sem todos objetivos) se a OpenAI falhar no meio; acesso a `choices[0]` sem checar `choices: []`. Pré-existente ao Epic 6. [src/features/plano/actions.ts]
- **`calcularRisco` usa `new Date()` quando o plano não tem datas.** Intervalo de duração zero → risco/projeção potencialmente errados. Pré-existente; inconsistente com a linha de tendência (que já guarda por `if (dataInicio && dataFim)`). [src/features/key-result/actions.ts, plano/actions.ts]
- **`inviteUser` cria `User` sem o `id` do Supabase Auth.** Reconciliação convite→signup quebrada: o cuid gerado não bate com `auth.uid()`, então `getCurrentUser` não encontra o usuário (ou cria duplicado violando `@unique(email)`). Pré-existente (Epic 4). [src/features/usuarios/actions.ts]
- **`assertMesmoTenant` aceita `null/null` como "mesmo tenant".** Latente — `User.clienteId` é non-null hoje, então não disparável; endurecer se algum caminho passar clienteId vazio. [src/features/auth/guards.ts:30]
- **`updatePlano` lê o plano duas vezes.** A action faz `findUniqueOrThrow` (datas) e o guard refaz outro `findUniqueOrThrow` (status/clienteId). Perf menor, sem impacto de correção. [src/features/plano/actions.ts]
- **Leitura intra-tenant entre planos (decisão: aceitar).** `getKRHistorico` e demais reads não checam vínculo no plano — qualquer membro do tenant lê qualquer plano. Aceito por decisão do usuário (2026-06-23); reavaliar se surgir requisito de isolamento por plano. [src/features/key-result/actions.ts]
