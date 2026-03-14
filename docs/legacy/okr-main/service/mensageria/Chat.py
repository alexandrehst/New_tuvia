from model import User
from service.GPTService import GPTService
from service.mensageria.IntentFactory import IntentFactory
import logging

logger = logging.getLogger()

class Chat:

    ERROR_MESSAGE = "Desculpe, não sei falar sobre esse assunto."
    ITERACTION_NAO_IDENTIFICADA = "Desculpe, não sei falar sobre esse assunto."

    def __init__(self, user: User):
        self.user = user
        self.currentIntent = None

    def initial_message(self):
        mensagem = f"Olá {self.user.nome}.\n Como posso te ajudar?\nUma dica: digite 'ajuda' para ver o que posso fazer."

        return mensagem

    def execute(self, message: str):

        logger.info(f'Chat.execute: {self.currentIntent} {self.user.id},  {self.user.nome}  {self.user.cliente} {message}')

        if self.currentIntent is None:
            intent = IntentFactory().build( message)
            if intent is None: # None significa que não foi possível identificar a intenção
                return self.ITERACTION_NAO_IDENTIFICADA

            self.currentIntent = intent

        result, intent_message = self.currentIntent.process(self.user, message)

        if not result: # None significa que a resposta na interação não foi identificada
            self.currentIntent = None
            return intent_message

        if self.currentIntent.currentInteraction is None:
            # indica o fim da interação
            self.currentIntent = None

        return intent_message


