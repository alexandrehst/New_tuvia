from service.mensageria.channels.MessageChannel import MessageChannel


class TerminalChannel(MessageChannel):
    def send(self, message):
        print(message)
        #return self.receive()

    def receive(self):
        user_input = input("Mensagem: ")
        return user_input
