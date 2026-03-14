from service.GPTService import GPTService
from service.KrService import KrService
from service.OkrService import OkrService
from service.mensageria.Interaction import Interaction


class InteractionResultadoChaveObjetivos(Interaction):
    def process(self, data):
        user = data['user']

        mensagem = f'Para qual objetivo você quer atualizar o resultado chave:\n\n'

        objetivos = OkrService.get_objetivos_user_id(user.id)
        self.data = objetivos
        if objetivos is None:
            return "Erro ao buscar objetivos."

        mensagem += f'Objetivos:\n'
        for i, objetivo in enumerate(objetivos):
            mensagem += f'{i+1}. {objetivo.descricao}\n'

        self.nextInteraction.data_received = self.data #propagate data to next interaction

        return mensagem



class InteractionResultadoChaveObjetivos2(Interaction):
    def process(self, data):
        message = data['message']

        selected_obj = int(message)
        objetivo = self.data_received[selected_obj - 1]

        krs = KrService.get_resultadoschave(objetivo.key_results_ids)
        self.data = krs

        mensagem = f'Objetivo: {objetivo.descricao}\n\n'
        mensagem += f'Resultados chave:\n'
        for i, kr in enumerate(krs):
            mensagem += f'{i+1}. {kr.descricao}\n'

        self.nextInteraction.data_received = self.data #propagate data to next interaction

        return mensagem

    def validate(self, data):

        message = data['message']

        if message.lower() in super().PALAVRAS_CANCELAMENTO:
            return False, "Ok, cancelado."

        try:
            selected_obj = int(message)
            if selected_obj > 0 and selected_obj <= len(self.data_received):
                return True, None
            else:
                return False, 'Digite um número válido.'
        except ValueError:
           return False, 'Digite um número válido.'

class InteractionResultadoPedeValor(Interaction):
    def process(self, data):
        message = data['message']
        selected_kr = int(message)
        kr = self.data_received[selected_kr - 1]
        self.data = kr

        mensagem = f'O valor atual do resultado chave é {kr.value} {kr.unit}. Qual o novo valor?'

        self.nextInteraction.data_received = self.data #propagate data to next interaction

        return mensagem

    def validate(self, data):
        message = data['message']

        if message.lower() in super().PALAVRAS_CANCELAMENTO:
            return False, "Ok, cancelado."
        try:
            if message is None:
                return False, 'Não consegui identificar o resultado chave.'

            selected_kr = int(message)

            if selected_kr > 0 and selected_kr <= len(self.data_received):
                return True, None
            else:
                return False, 'Digite um número válido.'
        except ValueError:
           return False, 'Digite um número válido.'

class InteractionResultadoAtualizaValor(Interaction):
    def process(self, data):
        message = data['message']
        valor = float(message)
        kr = self.data_received
        kr.value = valor

        result = KrService.set_resultadoschave_valor( kr, comentario="Atualização de valor via chat")

        if result:
            mensagem = f'Valor atualizado com sucesso!'
        else:
            mensagem = f'Erro ao atualizar valor.'

        return mensagem

class InteractionResultadoChaveIdentifica(Interaction):
    def process(self, data):

        user = data['user']
        objetivos = OkrService.get_objetivos_user_id(user.id)
        resultados_chave = []
        for objetivo in objetivos:
            if objetivo.key_results is not None:
                resultados_chave.extend(objetivo.key_results)


        krs = KrService.get_resultadoschave(resultados_chave)

        kr_descricoes = [kr.descricao for kr in krs]

        tools = [
                {
                    "type": "function",
                    "function": {
                        "name": "posicao",
                        "description": "Identifica posição da frase",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "Value": {"type": "number"}
                            }
                        }
                    }
                }
            ]

        gpt = GPTService()

        messages = [
            {"role": "system", "content": f"Retorne a posicao do item da lista {kr_descricoes} que mais se parece com o informado."},
            {"role": "user", "content": data['message'] }
        ]
        answer = gpt.generate(messages, function=tools)

        if answer['error']:
            return None

        try:
            self.data = krs[answer['message']['Value']]
            self.nextInteraction.data_received = self.data #propagate data to next interaction

        except:
            return None

        return answer['message']




