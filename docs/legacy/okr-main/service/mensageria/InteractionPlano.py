from model.Plan import Plan
from service.OkrService import OkrService
from service.PlanService import PlanService
from service.mensageria.Interaction import Interaction


class InteractionPlanoInicial(Interaction):
    def process(self, data):
        user = data['user']

        self.data = PlanService.get_plans(user.cliente )
        if self.data is None: return None

        mensagem = f'Aqui estão seus planos:\n\n'

        for i, plano in enumerate(self.data):
            mensagem += f'{i+1}. {plano.title}\n'

        mensagem += f'\n\nQual plano você deseja ver detalhes?'

        self.nextInteraction.data_received = self.data #propagate data to next interaction

        return mensagem

class InteractionPlanoDetalhamento(Interaction):
    def process(self, data):
        message = data['message']

        selected_plan = int(message)

        plan = self.data_received[selected_plan - 1]

        objetivos = OkrService.get_objetivos( plan.okr_ids)
        if objetivos is None:
            return "Erro ao buscar objetivos."

        mensagem = f'Plano: {plan.title}\n\n'
        mensagem += f'Objetivos:\n'
        for i, objetivo in enumerate(objetivos):
            mensagem += f'- {objetivo.descricao}\n'

        mensagem += f'\n\nDigite ajuda para mais informações.'
        return mensagem

    def validate(self, data):
        message = data['message']
        if message.lower() in super().PALAVRAS_CANCELAMENTO:
            return False, "Ok, cancelado."
        try:
            selected_plan = int(message)
            if selected_plan > 0 and selected_plan <= len(self.data_received):
                return True, None
            else:
                return False, 'Digite um número válido.'
        except ValueError:
            return False, 'Digite um número de plano válido.'
        return self.data_received is not None