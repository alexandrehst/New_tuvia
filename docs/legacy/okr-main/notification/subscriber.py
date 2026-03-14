from abc import ABC, abstractmethod

import logging
from dto.Objetivo_dto import ObjetivoDTO
from dto.Plano_usuario_dto import PlanoUsuarioDTO
from dto.User_dto import UserDTO
from model.KeyResult import KeyResult
from model.Okr import Okr
from model.Plan import Plan
from model.User import User
from service.BubbleAPIService import BubbleAPIService

logger = logging.getLogger()
class SubscriberFactory:
    PROPRIETARIO = "proprietario"
    RESPONSAVEL = "responsavel"
    VISUALIZADOR = "visualizador"
    USUARIO = "usuario"
    USUARIO_PLANO = "usuario_plano"


    def create_subscriber(self, type):
        if type == self.PROPRIETARIO:
            return Subscriber_proprietario()
        elif type == self.RESPONSAVEL:
            return Subscriber_Responsavel()
        elif type == self.VISUALIZADOR:
            return Subscriber_Visualizador()
        elif type == self.USUARIO:
            return Subscriber_Usuario()
        elif type == self.USUARIO_PLANO:
            return Subscriber_usuarios_plano()

        else:
            return Subscriber()

class Subscriber:

    def get_users(self, origem):
        #origem representa o objeto que originou o evento, por exemplo, um KeyResult
        pass

class Subscriber_Usuario(Subscriber):
    def get_users(self, origem):
        # para esse subscriber, a origem é um usuário, portanto o get_user apenas checa a regra

        if isinstance(origem, User):
            return [origem]

        logger.error(f"Subscriber_Usuario.get_users: origem não é um User")
        return None

class Subscriber_proprietario(Subscriber):
    def __init__(self, name):
        super().__init__()
        self.plano = None

class Subscriber_usuarios_plano(Subscriber):
    def get_users(self, origem):
        # Responsaveis a partir de um objetivo, portanto, precisamos buscar o objetivo dependendo da origem do evento
        if not isinstance(origem, Plan):
            logger.error(f"Subscriber_usuarios_plano: origem não é um Plano")
            return None

        dto = PlanoUsuarioDTO( BubbleAPIService() )
        planos_usuario = dto.get_usuarios_por_plano( origem.id )

        ids = [ plano_usuario.usuario_id for plano_usuario in planos_usuario]
        dto = UserDTO(BubbleAPIService())

        return dto.get_by_ids( ids)


class Subscriber_Responsavel(Subscriber):
    def __init__(self):
        super().__init__()
        self.objetivo = None

    def get_users(self, origem):
        # Responsaveis a partir de um objetivo, portanto, precisamos buscar o objetivo dependendo da origem do evento
        if isinstance(origem, Okr):
            objetivo = origem
        elif isinstance(origem, KeyResult):
            dto = ObjetivoDTO( BubbleAPIService() )
            objetivos = dto.get_objetivos_by_key_result(origem.id)
        else:
            logger.error(f"Subscriber_Responsavel.get_users: origem não é um Okr nem um KeyResult")
            return None

        dto = UserDTO( BubbleAPIService() )
        users = dto.get_by_ids(objetivos[0].responsaveis_ids)
        return users


class Subscriber_Visualizador(Subscriber):
    def __init__(self):
        super().__init__()
        self.plano = None
