---
title: Ideação — Agente Conversacional de OKR ("o verbo")
status: tese pressionada (council OK) — PARADA, aguardando validação
stage: insight cru → tese → council (gate passado) → [Mágico de Oz] → product-brief → PRD
created: 2026-06-23
retomar_quando: produto atual (Epic 6 e anteriores) estiver sólido e testado pelo usuário
proxima_acao: Mágico de Oz (2 semanas, 2-3 times reais) ANTES de qualquer código
---

# Ideação — Agente Conversacional de OKR

> Sessão de ideação (modo "pensar em voz alta") que partiu de um insight cru e foi pressionada pelo `/council`. **Ainda NÃO é plano nem PRD.** Parada por decisão do usuário para retomar o desenvolvimento do produto atual; retomamos aqui depois.

## 1. O insight cru (origem)

No planejamento estratégico, o que mais importa é **acompanhamento/execução/atualização dos KRs**. O sistema atual tem os *mecanismos* de atualização, mas é **passivo** — espera o usuário vir até o app, achar o KR e digitar um número. Resultado típico da categoria: o dado apodrece, OKR vira teatro de dashboard. Pergunta: como o sistema poderia ser mais **agêntico, opinativo e desafiador** para que a atualização aconteça e os objetivos entrem no dia a dia da operação?

## 2. As três ambições trançadas (não confundir)

A frase original esconde três produtos diferentes:
1. **Aderência** — atualizar no prazo (problema de *nudge/cadência*).
2. **Honestidade** — atualizar com verdade (sem sandbagging/chute) (problema de *crítico/coach*).
3. **Encarnação na operação** — OKR como lente das decisões do dia (mudança de *comportamento organizacional*).

"Agêntico"→(3), "opinativo/desafiador"→(2), "atualizar"→(1). Definir o alvo muda o tamanho do produto.

## 3. Reframes-chave que sobreviveram à discussão

- **Inverter o ritual:** hoje *o usuário vai até o dado*. Agêntico = *o dado vai até o usuário, já rascunhado*. A pessoa **reage** a uma pergunta em vez de **autorar**.
- **A fonte de dado mais barata é linguagem natural.** No chat (WhatsApp/Slack), a pessoa responde "fechamos 1,2M" e o agente faz parse → atualiza → recalcula. **O humano é a integração.** Vale pra 100% dos KRs, zero conectores.
- **Integração de dados ≠ diferencial; é esteira de manutenção.** Mirar "carteira de ERPs" é armadilha — KR estratégico mora *agregado* (planilha, BI, SaaS de KPI), não cru no ERP. Sequência sã: **agente conversacional (NL) → Google Sheets (mata a cauda longa, ~50-70%) → anel de SaaS de KPI (Stripe/CRM/GA…) como acelerador.** A visão nunca fica refém do catálogo.
- **Predição de fonte→objetivo dissolve:** o sistema **não prevê**; o humano **amarra uma vez** (IA *sugere* o vínculo a partir da descrição do KR), e o agente assume a leitura no schedule.
- **Hipótese de especialista do usuário:** na maioria das orgs o número **nem é coletado** — atualizar exige *produzir* o dado. Logo o agente não é transportador, é **elicitador/coach**: a conversa *fabrica* o dado. Isso torna o agente MAIS central.
- **Chat = verbo, App = substantivo.** Não jogar fora a interface (recém-redesenhada). Chat = caminho de **escrita/cadência/elicitação**; App = caminho de **leitura/overview + sistema de registro**. O dashboard vira a *memória* pra onde o agente aponta. Conversa pura é pior pra ver o todo num relance.
- **Honestidade = integridade do produto, não enfeite.** Número fabricado na hora no chat é fácil de inventar → o lado desafiador (checar plausibilidade, pedir narrativa, questionar meta/relevância) é o que dá valor — mas pode virar vigilância chata.

## 4. A TESE (versão forte, pós-reframes)

> Não é "um bot de Slack em cima do app de OKR". É **um parceiro de accountability / chief-of-staff de OKR que vive no chat — e o app é o sistema de registro por trás.** É um **verbo** (ritual recorrente que cobra), não um **substantivo** (lugar onde o dado apodrece). O agente conduz a cadência, *fabrica* o dado por elicitação, e desafia a honestidade.

## 5. Veredito do `/council` (2026-06-23)

**Sobreviveu — saiu mais forte e mais estreita.** Reposicionada por consenso de "bot que desafia o IC" → "agente que roda a cadência da liderança".

- **Contrarian:** check-in via chat **já existe** (Lattice, Workboard, Viva Goals, Gtmhub) e não resolveu staleness — o ingrediente que falta é **consequência**, não IA. Bot desafiador no Slack tem meia-vida de ~1 semana até o "mute".
- **First Principles:** problema-raiz = OKR sem **consequência**. Alavanca real = a **cadência/cerimônia de revisão** (quem-cobra-quem), não a interface. O agente é só um mecanismo de entrega da cadência.
- **Expansionist:** upside 10x = **memória estratégica estruturada** (o *porquê* de cada movimento) + benchmark; mercado adjacente = qualquer **ritual de accountability** (1:1, status, board, investidor) — OKR é a cunha; comprador pode subir ao **gabinete do CEO**.
- **Outsider:** "mais um bot me cobrando, já ignoro"; **WhatsApp vs Slack** define tudo (Brasil/SMB vs enterprise global + compliance); "IA que questiona minha honestidade" soa ofensivo; **quem não atualiza é quem vai silenciar o agente — então quem é o usuário?**
- **Executor:** não construir nada — **Mágico de Oz**: ser o agente na mão por 2 semanas.
- **Peer review:** ponto mais crítico = diferenciação vs. incumbentes (Contrarian); alavanca certa = cadência (First Principles); subvalorizado = WhatsApp/geografia (Outsider); **o que todos quase perderam = comprador ≠ usuário** (agente serve o IC que se irrita, é comprado pela liderança que quer compliance — o "desafiador" é onde essa fratura explode).

**Chairman:** É **produto, não feature — mas só na versão "verbo".** 
- **Versão mais forte:** o agente que **roda a cadência de revisão da liderança** e torna a atualização inevitável (a decisão/reunião depende dela), vendido a quem tem autoridade de fazer as pessoas se importarem, entregue via chat.
- **Versão mais arriscada:** bot desafiador mandando DM pra ICs que nunca pediram → silenciado, indistinguível dos check-ins existentes.
- **Furos fatais a fechar antes de código:** (1) diferenciação vs. incumbentes — o wedge tem que ser *elicitação que fabrica o dado* + *honestidade desafiada*, não "tem IA"; (2) **comprador × usuário**.

## 6. Perguntas em aberto (responder antes do PRD)

1. **WhatsApp vs Slack** e **Brasil/SMB vs enterprise global** — precede produto, compliance e GTM.
2. **Quem compra × quem usa** — onde o "desafiador" pode virar churn.
3. Qual das 3 ambições (aderência/honestidade/encarnação) é o alvo primário.
4. (Hipótese a confirmar no teste) o número do KR já existe em algum lugar, ou precisa ser *produzido*?

## 7. Próxima ação (gate antes de virar PRD)

**Mágico de Oz** — 2 semanas, 2-3 times reais. O usuário (humano) atua como o agente: manda as perguntas de elicitação no canal, desafia plausibilidade, atualiza os KRs no app na mão. **Medir:** taxa de resposta · mudança na frescura dos KRs · honestidade (deu pra desafiar?) · sentimento (ajuda vs saco) · **qual persona puxa** (líder vs IC). Zero código. O roteiro do teste (mensagens + desenho) ainda não foi montado — TODO quando retomar.

Depois do Mágico de Oz: `bmad-product-brief` (enquadrar com o aprendizado) → `bmad-prd` → fluxo de execução normal.
