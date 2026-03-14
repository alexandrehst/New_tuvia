from model.Plan import Plan
from model.User import User
from notification.canais import CanalEmail, CanalNotificacao
from notification.subscriber import SubscriberFactory
from model.KeyResult import KeyResult
import datetime
import logging

logger = logging.getLogger()

class EventoFactory:
    RESULTADO_CHAVE_ATUALIZADO =  'ResultadoChaveAtualizado'
    BOASVINDAS = 'BoasVindas'
    LP_PLANEJAMENTO = 'e_mailPlanejamento'
    CONVITE = 'Convite'
    RESPONSAVEL_OBJETIVO = 'ResponsavelObjetivo'    

    def create_evento(self, type, *args, **kwargs):
        if type == self.RESULTADO_CHAVE_ATUALIZADO:
            return ResultadoChaveAtualizado(*args, **kwargs)
        elif type == self.BOASVINDAS:
            return EventoBoasVindas(*args, **kwargs)
        elif type == self.LP_PLANEJAMENTO:
            return EventoEmailLPPLanejamento(*args, **kwargs)
        elif type == self.CONVITE:
            return EventoConviteUsuario(*args, **kwargs)
        elif type == self.RESPONSAVEL_OBJETIVO:
            return EventoResponsavelObjetivo(*args, **kwargs)
        else:
            return None

class Evento:


    def __init__(self, subscribers, canais, autor: User, data:str=None):
        self.subscribers = subscribers
        self.canais = canais
        self.autor = autor
        if data is None:
            self.data = datetime.datetime.now()
        else:
            self.data = datetime.datetime.strptime(data, "%Y-%m-%d %H:%M:%S")

    def execute(self, origem, notificacao = None):
        #origem representa o objeto que originou o evento, por exemplo, um KeyResult

        users_ids = []
        for subscriber in self.subscribers:
            users = subscriber.get_users(origem)
            if users:
                users_ids.extend(users)

        if len(users_ids) == 0:
            logger.info(f'Evento.execute: Nenhum usuário encontrado para notificar. {origem}, {notificacao}')
            return

        for canal in self.canais:
            resposta = canal.notifica( users_ids, notificacao)
            if not resposta:
                logger.error(f'Evento.execute: Falha ao notificar {users_ids} no canal {type(canal)}')


class EventoBoasVindas(Evento):
    def __init__(self, autor: User, data:str=None ):
        super().__init__(
            [SubscriberFactory().create_subscriber(SubscriberFactory().USUARIO)],
            [CanalEmail.create_canal( CanalEmail.BOAS_VINDAS)],
            autor,
            data
        )

    def execute(self, origem: User):

        super().execute(origem )


class ResultadoChaveAtualizado(Evento):
    def __init__(self, autor: User, data:str=None ):
        super().__init__(
            [SubscriberFactory().create_subscriber(SubscriberFactory().RESPONSAVEL)],
            [CanalNotificacao()],
            autor,
            data
        )

    def execute(self, origem: KeyResult):

        notificacao = f'O resultado chave {origem.descricao} foi atualizado.'

        super().execute(origem, notificacao)

class EventoDetalhesPlano(Evento):
    def __init__(self, autor: User, data:str=None ):
        super().__init__(
            [SubscriberFactory().create_subscriber(SubscriberFactory().USUARIO_PLANO)],
            [CanalEmail.create_canal( CanalEmail.DETALHE_PLANO )],
            autor,
            data
        )

    def execute(self, origem: Plan):

        super().execute(origem, origem ) # O parametro está duplicado, porque o plano vai ser enviado para a construção da mensagem

class EventoEmailLPPLanejamento(Evento):
    def __init__(self, autor: User, data:str=None ):
        super().__init__(
            [SubscriberFactory().create_subscriber(SubscriberFactory().USUARIO)],
            [CanalEmail.create_canal( CanalEmail.LP_PLANEJAMENTO )],
            autor,
            data
        )

    def execute(self, origem, notificacao):
        # nesse evento, notificacao contém o link do arquivo do plano

        super().execute(origem, notificacao)

class EventoConviteUsuario(Evento):
    def __init__(self, autor: User, data:str=None ):
        super().__init__(
            [SubscriberFactory().create_subscriber(SubscriberFactory().USUARIO)],
            [CanalEmail.create_canal( CanalEmail.CONVITE )],
            autor,
            data
        )

    def execute(self, origem: str, notificacao: str):

        super().execute(origem, notificacao ) # Origem é o usuário, notificação é o nome da empresa

class EventoResponsavelObjetivo(Evento):
    def __init__(self, autor: User, data:str=None ):
        super().__init__(
            [SubscriberFactory().create_subscriber(SubscriberFactory().USUARIO)],
            [CanalEmail.create_canal( CanalEmail.RESPONSAVEL_OBJETIVO )],
            autor,
            data
        )

    def execute(self, origem: str, notificacao: str):

        super().execute(origem, notificacao ) # Origem é o usuário, notificação é o nome da empresa

