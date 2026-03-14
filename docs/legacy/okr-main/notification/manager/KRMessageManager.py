from message.manager.MessageManager import MessageManager


class KRMessageManager(MessageManager):
    def __init__(self, channel):
        super().__init__(channel=channel)
        # Add any additional initialization code here
    def send(self, kr, user):
        # Add any additional code here
        message = f'Olá {user}. Que tal atualizar o resultado chave {kr.descricao}? O valor atual é {kr.value} {kr.unit}.'
        self.process( kr, self.channel.send(message=message) )


    def process(self, kr, message):
        # if message is number, return number, otherwise return 'error'
        if message.isnumeric():
            print( f' Resultado chave {kr.descricao} atualizado para {message}')
            return int(message)
        else:
            return None
