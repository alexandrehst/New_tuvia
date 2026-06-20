# Addendum — PRD Redesenho de UX do OKR SaaS

Profundidade técnica e de mecanismo que não pertence ao corpo do PRD, mas serve ao `bmad-ux`/arquitetura downstream.

## Base técnica do design system

- **shadcn v4 sobre Base UI** (`@base-ui/react`), **não Radix**. Usar `render` prop, nunca `asChild`. Imports de `@radix-ui/*` quebram silenciosamente.
- **Tailwind v4**: configuração via CSS (`src/app/globals.css` + `@tailwindcss/postcss`), sem `tailwind.config.js`. Tokens de cor/tema definidos em CSS.
- Componentes `ui/` seguem padrão: `cva` para variantes, helper `cn()` de `@/lib/utils`, `data-slot="..."`, espalham `...props` sobre o primitivo Base UI.
- Primitivos já presentes em `src/components/ui/`: avatar, badge, card, collapsible, dropdown-menu, progress, separator, sheet, sidebar, skeleton, tooltip, input, label. (Base sólida para o redesenho.)
- Hook `use-mobile` disponível para comportamento responsivo da sidebar.

## Mapeamento status → cor (reuso da lógica existente)

- Pills de status devem derivar de `features/key-result/lib/calculos.ts` (`calculateRisk`). Não reimplementar a classificação na camada de UI; consumir o resultado e mapear para token de cor semântico.
- Tendência/projeção: `gerarLinhaTendencia` para a visualização de histórico (FR-28).

## Cadeia de atualização de KR (preservar — FR-26)

Ao salvar valor de KR: gravar `HistoricoValores` → recalcular progresso/risco do KR → recalcular progresso ponderado do `Objetivo` → disparar e-mail (Brevo, não-fatal, respeitando flag do usuário). A UI deve refletir o recálculo, mas não pode pular etapas da cadeia.

## Alternativa de IA de navegação considerada (R1)

- **Opção A (assumida no PRD):** lista de planos navegável → workspace de acompanhamento dedicado por plano; hierarquia via breadcrumb/switcher. Alinha com a referência (sidebar + tela dedicada). Risco: esconde a relação corporativo↔apoio se mal resolvida.
- **Opção B (atual, descartada por ora):** árvore expansível inline na própria lista (`list_planos` abre objetivos/KRs "embaixo, como árvore"). Mostra hierarquia de imediato, mas não escala visualmente e diverge da referência.
- Decisão a validar com o usuário antes do `bmad-ux`.

## Restrições de plataforma herdadas

- Next.js 16: `cookies()`, `params`, `searchParams` são async — afeta páginas de Server Component no redesenho.
- Server Components por padrão; `'use client'` só onde há estado/efeito/handlers (gauges interativos, toggles, painéis).
- Cobertura de testes mín. 90% em `features/**`; `src/app/**` e `src/components/**` são excluídos da cobertura — o redesenho de UI vive majoritariamente nessas pastas excluídas, mas mudanças em `features/` mantêm o gate.
