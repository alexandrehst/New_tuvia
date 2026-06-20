# Roteiro de testes manuais — OKR (redesenho de UX)

Guia passo a passo para exercitar a aplicação inteira. Cobre os 5 epics do redesenho.
Cada cenário traz **passos** e o **resultado esperado**. Itens marcados com 🔁 dependem de dados já existentes no workspace.

## Pré-requisitos

1. **Supabase ativo** (o projeto não pode estar pausado) e `.env.local` configurado.
2. Subir a aplicação: no prompt do Claude Code, digite `! pnpm dev` (ou rode `pnpm dev` no terminal). Acesse **http://localhost:3000**.
3. Ter uma **conta admin** do cliente (ex.: `admin@demo.com`). Para o teste de segurança (seção 9) é útil uma **segunda conta não-admin**.
4. Dica: o botão de **tema (claro/escuro)** fica na topbar — repita os cenários-chave nos dois temas.

---

## 1. Entrada pública (landing + auth) — Epic 5

1.1 **Landing** — abra `/` (deslogado).
- Esperado: hero com proposta de valor, **"Entrar"** e **"Comece agora"** visíveis sem rolar; seção de benefícios (3 cartões); faixa de prova; footer. Fundo com realce `brand-tint`. Responsivo (reduza a janela).

1.2 **Ir para login** — clique em **"Entrar"**.
- Esperado: vai para `/login`; **cartão centrado** sobre fundo brand-tint, com a marca "OKR" acima.

1.3 **Login inválido** — e-mail válido + senha errada → **Entrar**.
- Esperado: mensagem de erro inline (alerta), **sem sair** da página; o e-mail digitado permanece.

1.4 **Login válido** — credenciais corretas → **Entrar**.
- Esperado: botão mostra "Entrando…" e redireciona para `/planos`.

1.5 **Reset de senha** — em `/login`, clique **"Esqueci a senha"**, informe o e-mail, **Enviar link**.
- Esperado: estado de carregando e depois confirmação verde "Email enviado!".

1.6 **Cadastro** — em `/login`, clique **"Criar conta"** (`/cadastro`).
- Esperado: mesmo padrão de cartão centrado; nome/email/senha; erro inline em dados inválidos; ao criar, e-mail de boas-vindas é disparado e você entra no app.

---

## 2. Shell, navegação e tema — Epic 1

2.1 **Sidebar** — autenticado, veja a navegação lateral.
- Esperado: itens **Planos** e **Usuários**; o item ativo fica destacado (`aria-current`). O nome do **cliente/workspace** aparece (não é um botão de troca — é 1 cliente por usuário).

2.2 **Tema** — alterne o toggle de tema.
- Esperado: a UI inteira troca entre claro/escuro **sem cores quebradas**; a escolha persiste ao recarregar.

2.3 **Logout** — menu de conta na topbar → sair.
- Esperado: volta para `/login`.

2.4 **Rota protegida** — deslogado, tente abrir `/planos` direto.
- Esperado: redireciona para `/login`.

---

## 3. Criar plano com o wizard de IA — Epic 3

3.1 **Abrir o wizard** — em `/planos`, clique **"Novo plano"** (ou "Criar primeiro plano" se vazio) → `/criador`.
- Esperado: wizard em **um passo por vez**, com indicador **"Passo 1 de N"** e barra de progresso.

3.2 **Passo 1 (empresa)** — sem preencher, observe o botão **Próximo**.
- Esperado: **Próximo desabilitado**; ao preencher **Nome da empresa** e **Ramo**, fica habilitado.

3.3 **Sugestões de IA** — avance até **Visão**/**Missão** e clique **"Sugerir"**.
- Esperado: estado "Gerando…" → aparecem sugestões clicáveis; clicar **preenche o campo** (editável); se a IA falhar, aparece **erro inline** e você ainda pode digitar à mão; se não vier nada, mostra "Nenhuma sugestão gerada".

3.4 **Listas (valores/oportunidades/ameaças)** — adicione itens manualmente e via "Sugerir".
- Esperado: sugestões viram opções que **anexam** ao clicar (nunca impostas); dá para remover itens.

3.5 **Navegação preserva dados** — preencha, **Próximo**, depois **Voltar**.
- Esperado: o que foi digitado continua lá.

3.6 **Gerar plano** — no último passo, **Gerar plano**.
- Esperado: estado "Gerando…", depois "Plano criado com sucesso!" e redireciona para o acompanhamento do plano.

---

## 4. Lista de planos — Epic 3

4.1 **Cartões** — em `/planos`.
- Esperado: planos como **cartões navegáveis** (não árvore), com **badge de status** (Edição/Publicado/Arquivado) tokenizado (cor correta no claro e escuro), data fim e nº de objetivos.

4.2 **Abrir** — clique num cartão.
- Esperado: abre o **workspace de acompanhamento** do plano.

4.3 **Estado vazio** 🔁 — (se não houver planos) "Nenhum plano ainda. Crie o primeiro." + CTA.

---

## 5. Acompanhamento (board) — Epic 2 🔁

> Use um plano com objetivos/KRs (ou crie via wizard).

5.1 **Faixa de resumo** — topo do plano.
- Esperado: progresso geral (anel/percentual) e métricas; tipografia de número (`text-metric`).

5.2 **Board** — objetivos em **colunas**; cada KR é um cartão com **status** (No prazo/Em atraso/Em risco/Risco alto) e barra de progresso.

5.3 **Criar objetivo** — **"Novo objetivo"** → preencha título + responsáveis → salvar.
- Esperado: painel lateral (Sheet); ao salvar, a coluna aparece.

5.4 **Editar objetivo** — ícone de lápis na coluna.
- Esperado: edita título/responsáveis; reflete após salvar.

5.5 **Adicionar KR** — "Adicionar KR" na coluna → descrição, tipo de métrica, valores, unidade, peso → salvar.
- Esperado: KR novo no objetivo.

5.6 **Atualizar valor de KR** — "Atualizar" no cartão → novo valor (+ comentário) → salvar.
- Esperado: progresso e **status do KR recalculam** na hora; o progresso do objetivo também; (se houver responsáveis com notificação ligada, e-mail é enviado — falha de e-mail não quebra a operação).

5.7 **Editar KR** — lápis no cartão → mude o **valor alvo** → salvar.
- Esperado: % e status recalculam; a linha de tendência é regenerada.

5.8 **Histórico** — ícone de gráfico no cartão.
- Esperado: painel com **gráfico** (linha "Realizado" + "Tendência" tracejada); enquanto carrega, skeleton; sem dados, "Sem histórico ainda."

5.9 **Excluir (KR e objetivo)** — ícone de lixeira.
- Esperado: **diálogo de confirmação** com a consequência (excluir objetivo remove os KRs; excluir KR remove o histórico); cancelar não muda nada; confirmar remove.

---

## 6. Editar plano e plano de apoio — Epic 2/3 🔁

6.1 **Editar plano** — cabeçalho do plano → **"Editar plano"**.
- Esperado: Sheet com título, datas e frequência; ao salvar, reflete. **Se mudar as datas**, o risco/tendência de **todos os KRs** do plano é recalculado.

6.2 **Criar plano de apoio** — num plano **corporativo**, **"Criar plano de apoio"**.
- Esperado: o botão só aparece em corporativo; cria um plano filho e leva ao acompanhamento dele.

6.3 **Breadcrumb** — dentro do plano de apoio.
- Esperado: a trilha mostra **Planos › Plano-pai › Plano de apoio** (links navegáveis, não árvore).

---

## 7. Usuários: membros, papéis e notificações — Epic 4

7.1 **Lista** — abra `/usuarios`.
- Esperado: cartão por membro (nome/e-mail + badge admin/membro), **papéis por plano** e **toggles de notificação**. Recarregando, há skeleton de carregamento.

7.2 **Trocar papel** — mude o papel num vínculo de plano.
- Esperado: salva (anúncio "Alterações salvas"); se a operação falhar, o valor **reverte** e aparece aviso de erro.

7.3 **Notificações** — ligue/desligue um switch (Plano/Objetivo/Resultado).
- Esperado: persiste; em falha, reverte com aviso.

7.4 **Remover do plano** — lixeira no vínculo.
- Esperado: **confirmação** explicando que o usuário perde acesso ao plano (a conta não é excluída).

7.5 **Convidar membro** — **"Convidar membro"** → e-mail (+ nome opcional) → **Enviar convite**.
- Esperado: "Convite enviado"; **e-mail inválido** ou **duplicado** mostram erro inline; se o envio de e-mail falhar, mostra "Convite criado, mas o e-mail não pôde ser enviado." (o membro ainda é criado).

---

## 8. Transversais

- **Dark mode**: repita 3 (wizard), 5 (board) e 7 (usuários) no tema escuro — nada de cor "estourada".
- **Responsivo**: reduza a janela na landing e no board — layout se adapta (colunas empilham).
- **Acessibilidade rápida**: navegue por **teclado** (Tab) nos formulários/Sheets; `Esc` fecha os painéis; leitores de tela anunciam erros (campos com `role="alert"`).

---

## 9. Segurança multi-tenant (L2) — requer 2ª conta

> Valida o endurecimento de autorização nas Server Actions.

9.1 **Não-admin** — logado como **membro comum** (não admin), abra `/usuarios`.
- Esperado: ações de gestão (trocar papel, remover, convidar) **não devem** completar — as actions exigem admin (`requireAdmin`). *(Observação: a UI hoje não esconde a página para não-admin; a proteção está no servidor — uma tentativa falha em vez de aplicar.)*

9.2 **Isolamento entre clientes** — (avançado) qualquer tentativa de operar sobre um recurso (plano/objetivo/KR/membro) de **outro cliente** é rejeitada no servidor (`assertMesmoTenant`), mesmo que a chamada seja forjada fora da UI.

---

## Notas / limitações conhecidas (follow-ups)
- Datas dos inputs usam UTC — em fusos negativos pode haver diferença de 1 dia na exibição.
- Ano do rodapé da landing é fixado no build (página estática).
- A página `/usuarios` não é escondida de não-admin (a barreira é no servidor) — esconder no client é melhoria futura.
- Suíte E2E (Playwright) cobre login/usuários e o esqueleto de wizard/board; cenários com 🔁 e os de IA precisam de dados/seed e chave de OpenAI para rodar de ponta a ponta (`pnpm test:e2e`).
