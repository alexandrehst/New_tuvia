from dto.User_dto import UserDTO
from model.User import User
from service.BubbleAPIService import BubbleAPIService
import logging
import random
import string

logger = logging.getLogger()

class UserService:

    dto = UserDTO(BubbleAPIService())

    @classmethod
    def set_user_token(cls, user:User):
        user.token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

        cls.dto.user = user
        return cls.dto.set_token()

    @classmethod
    def get_user(cls, id):
        result = cls.dto.get_by_id(id)

        if result is None:
            logger.error(f"Erro ao buscar usuário")

        return result

    @classmethod
    def get_users(cls, ids):
        result = cls.dto.get_by_ids(ids)

        if result is None:
            logger.error(f"Erro ao buscar usuários")

        return result