from dto.Plano_usuario_dto import PlanoUsuarioDTO
from model.PlanoUsuario import PlanoUsuario
from service.BubbleAPIService import BubbleAPIService
import logging

logger = logging.getLogger()

class PlanoUsuarioService:

    dto = PlanoUsuarioDTO(BubbleAPIService())

    @classmethod
    def insert(cls,  plan, user, papel = "Proprietário"):

        planoUsuario = PlanoUsuario(plano=plan, usuario= user, Papel=papel)
        planoUsuario.plano = plan.id
        planoUsuario.usuario = user.id
        #  Plano=plan_id, Usuario=user_id,
        return cls.dto.insert(planoUsuario)

    @classmethod
    def get_users(cls, ids):
        result = cls.dto.get_by_ids(ids)

        if result is None:
            logger.error(f"Erro ao buscar usuários")

        return result