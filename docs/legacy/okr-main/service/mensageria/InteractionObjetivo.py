from service.KrService import KrService
from service.OkrService import OkrService
from service.UserService import UserService
from service.mensageria.Interaction import Interaction
import logging

logger = logging.getLogger()

class InteractionObjetivoInicial(Interaction):
    def process(self, data):
        logger.info(f'InteractionObjetivoInicial.process: {data}')
        user = data['user']

        self.data = OkrService.get_objetivos_user_id(user.id)
        if self.data is None: return None

        mensagem = f'Aqui estão seus Objetivos:\n\n'

        for i, objetivo in enumerate(self.data):
            mensagem += f'{i+1}. {objetivo.titulo} - Progresso {objetivo.progresso}%\n'

        mensagem += f'\n\nDetalhes de algum objetivo? É só digitar o número dele. Ex: 1\nOu então, pode digitar cancelar para comerçarmos novamente.\n'

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

class InteractionObjetivoDetalhamento(Interaction):
    def process(self, data):
        logger.info(f'InteractionObjetivoDetalhamento.process: {data}')
        message = data['message']

        selected_obj = int(message)
        objetivo = self.data_received[selected_obj - 1]
        mensagem = f'Objetivo: {objetivo.titulo}\n\n'

        if objetivo.responsaveis_ids:
            mensagem += f'---------------------------\nOs responsáveis são:\n'
            responsaveis = UserService().get_users(objetivo.responsaveis_ids)
            for responsavel in responsaveis:
                mensagem += f'{responsavel.nome}\n'
        else:
            mensagem += f'---------------------------\nNão existem responsáveis para essse objetivo\n'
        mensagem += f'---------------------------\nOs resultados chave são:\n'
        # obtem resultados chave
        resultados_chave = KrService().get_resultadoschave(objetivo.key_results_ids)
        if resultados_chave is None or len(resultados_chave) == 0:
            return None

        for i, resultado_chave in enumerate(resultados_chave):
            if "Valor atual" in resultado_chave:
                mensagem += f'{i+1}. {resultado_chave.descricao} - Valor atual:{resultado_chave.valor_atual} {resultado_chave.unit} - Progresso {resultado_chave.progress}%\n'
            else:
                mensagem += f'{i+1}. {resultado_chave.descricao} - Valor atual: 0 {resultado_chave.unit} -  Progresso {resultado_chave.progresso}%\n'


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
