import logging

logger = logging.getLogger()

class Interaction:
    PALAVRAS_CANCELAMENTO = ['cancelar', 'cancela', 'sair', 'voltar', 'parar', 'cancel', 'exit', 'back', 'stop']

    def __init__(self, data = None):
        self.data = data
        self.data_received = None
        self.nextInteraction = None

    def validate(self, data):
        message = data['message']
        if message.lower() in self.PALAVRAS_CANCELAMENTO:
            return False, "Ok, cancelado."

        return True, None

    def process(self, data):
        return "Mensagem padrão"

    def execute(self, data):
        validated, message = self.validate(data)
        if validated:
            return True, self.process(data)

        return False, message

    def set_next_interaction(self, interaction):
        self.nextInteraction = interaction
        return self.nextInteraction
