from service.mensageria.InteractionAjuda import InteractionAjuda
from service.mensageria.InteractionPlano import InteractionPlanoInicial, InteractionPlanoDetalhamento
from service.mensageria.InteractionObjetivo import InteractionObjetivoInicial, InteractionObjetivoDetalhamento
from service.mensageria.InteractionResultadoChave import InteractionResultadoAtualizaValor, InteractionResultadoChaveIdentifica, InteractionResultadoChaveObjetivos, InteractionResultadoChaveObjetivos2, InteractionResultadoPedeValor
from service.mensageria.InteractionSaudacao import InteractionSaudacao

class Intent:
    def __init__(self):
        self.interactions = []
        self.currentInteraction = None
        self.tentativas = 0 # acompanha o número de tentativas de interação

    def process(self, user, message):
        if self.currentInteraction is None:
            return None

        result, interaction_message = self.currentInteraction.execute( data={'user': user, 'message': message})
        if not result:

            return False, interaction_message

        self.currentInteraction = self.currentInteraction.nextInteraction
        self.tentativas = 0

        resultado = interaction_message is not None # algumas interações retornam None quando dá problema
        return resultado, interaction_message

class IntentPlano(Intent):

    def __init__(self):


        inicial = InteractionPlanoInicial()
        detalhe_plano = InteractionPlanoDetalhamento()

        inicial.nextInteraction = detalhe_plano

        self.currentInteraction = inicial

class IntentObjetivo(Intent):

    def __init__(self):

        self.currentInteraction = InteractionObjetivoInicial()
        self.currentInteraction.set_next_interaction( InteractionObjetivoDetalhamento() )


class IntentResultadoChave(Intent):

        def __init__(self,  data):
            # Essa intente aceita:
            # - apenas a intenção
            # - intenção e resultado chave
            # - intenção, resultado chave e valor a atualizar

            self.assunto = data['assunto'] if 'assunto' in data else None
            self.qualificador = data['qualificador assunto'] if 'qualificador assunto' in data else None
            self.valor = data['valor'] if 'valor' in data else None

            if self.qualificador is None:

                self.currentInteraction =  InteractionResultadoChaveObjetivos() # Buscar objetivos
                self.currentInteraction.set_next_interaction(
                    InteractionResultadoChaveObjetivos2()
                 ).set_next_interaction(
                      InteractionResultadoPedeValor()
                 ).set_next_interaction(
                    InteractionResultadoAtualizaValor()
                 )

            else:

                #identifica resultado chave
                self.currentInteraction =  InteractionResultadoChaveIdentifica()
                self.currentInteraction.set_next_interaction(
                     InteractionResultadoPedeValor()
                ).set_next_interaction( InteractionResultadoAtualizaValor())


class IntentSaudacao(Intent):

        def __init__(self):
                self.currentInteraction =  InteractionSaudacao() # Buscar objetivos

class IntentAjuda(Intent):

        def __init__(self):
                self.currentInteraction =  InteractionAjuda() # Buscar objetivos