from service.GPTService import GPTService
from service.KrService import KrService
from service.OkrService import OkrService
from service.mensageria.Interaction import Interaction


class InteractionSaudacao(Interaction):
    def process(self, data):
        user = data['user']

        gpt = GPTService()

        messages = [
            {"role": "system", "content": f"Responda a saudação de forma bem humorada. Lembre-se de citar pessoalmento o nome {user.nome}."},
            {"role": "user", "content": data['message'] }
        ]
        answer = gpt.generate(messages, None)

        if answer['error']:
            return None

        return answer['message']

