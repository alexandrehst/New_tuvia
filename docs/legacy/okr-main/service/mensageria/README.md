# Mensageria

A mensageria se refere ao subsistema capaz de receber mensagens e responder. Esse subsistema não conhece o modal de emissão da mensagem (ex.: Telegram, Whatsapp, e-mail), seu foco é na identificação e resposta.

## Componentes
Existem quatro componentes principais:

*Chat*

O Chat é o orquestrador principal. Ele delega para uma _intention_ o que deverá ser feito.

*ChatPool*

Como o nome diz, é um pool de chats. Seu objetivo é manter as "sessões" de chat abertas e fazer o diálogo  fluir.


*Intention*

A classe genérica `Intention` representa o fluxo de diálogo para uma intenção do usuário. A intenção é o assunto e é identificado pela IA. Uma intention contém uma cadeia de interações (interaction).

*Interaction*

A classe genérica `Interaction` representa uma interação. Uma interação é um passo do diálogo. Cada classe concreta deve sobreescrever dois métodos:
1. Método `validate`. Esse método lê o conteúdo de `data['message']` e verifica se é válido.
1. Método `process`. Esse é o método responsável pelo processamento da mensagem. Ele deve fazer duas coisas:
    1. Seta `self.nextInteraction.data_received` com os dados necessários para a próxima etapa do diálogo. (Apenas se não for o último passo)
    1. Constrói a mensagem segundo a lógica desejada e retorna

## Como criar uma nova conversa

### Criando as interactions

O ideal é começar _botton up_, isto é, construir primeiro as interactions, depois a intention.
1. Desenhe as _interactions_, identificando a mensagem recebida, validação e resposta.
1. Para cada _interaction_ desenhada, crie uma nova classe que herde de `Interaction` e escreva os métodos `validate` e `process`. Todas as classe podem ficar no mesmo módulo `Interaction<nome>.py`.

### Criando a intention

1. No módulo `Intention.py` (preferencialmente), crie uma nova classe que herde de `Intention`.
1. Você só precisa escrever o método `__init__`.
    1. sete a primeira _interaction_ em `self.currentInteraction`
    1. sete a próxima em `self.currentInteraction.set_next_interaction` de forma a construir a cadeia
    1. continue esse processo.

O método `set_next_interaction` retorna a interação setada, facilitando a construção da cadeia. Um exemplo de cadeia de interações usando esse retorno seria:

```
    self.currentInteraction =  InteractionPrimeiraInteracao()
    self.currentInteraction.set_next_interaction(
            InteractionSegunda()
        ).set_next_interaction(
            InteractionTerceira()
        ).set_next_interaction(
            InteractionQuarta()
        )
```

Por fim, altere `IntentFactory.py`

1. Coloque a intensão em:
````
    "Intensao": {
        "type": "string",
        "enum": [ <LISTA DE INTENSOES>]
    },
````
2. Coloque a mesma intensão no `if` da construção


