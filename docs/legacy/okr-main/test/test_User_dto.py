from datetime import datetime
import unittest
from unittest.mock import MagicMock
from dto.User_dto import UserDTO
from service.BubbleAPIService import BubbleAPIService
from dateutil.parser import parse


class MockService():
    PLANO = 'plan'
    OBJETIVO = 'objetivo'
    RESULTADO_CHAVE = 'resultadochave'
    USER =  'user'

    @classmethod
    def get_generic_by_id(cls, id:str, type:str):
        if type == cls.RESULTADO_CHAVE:
            return {'error': False, 'resultadochave': {
                                                        '_id': id,
                                                       'Descricao': 'Key Result 1',
                                                       'Valor': 10,
                                                       'Unidade': '%',
                                                       'Tipo_metrica': 'Reason 1',
                                                       }
                                                    }
        return {'error': True}

    @classmethod
    def update_generic(cls, type, id, key, valor):
        return 1

class TestUserDTO(unittest.TestCase):

    valid_id = "1712602220283x155804620698294820"

    def setUp(self):
        self.service = MockService()
        self.keyresult_mock = MagicMock()
        self.dto = UserDTO(self.service )

    def test_init(self):
        self.assertEqual(self.dto.type, self.service.USER)

    def test_map(self):
        data = {
                    "Modified Date": "2024-04-26T18:18:18.294Z",
                    "Created Date": "2024-04-08T18:50:20.283Z",
                    "authentication": {
                        "email": {
                            "email": "alexandrehst@gmail.com",
                        }
                    },
                    "Nome": "Alexandre Torres",
                    "Foto": "//26adcd58c1eee8463571ca90068a54e1.cdn.bubble.io/f1712953044872x223553218245704500/foto_perfil_circulo.jpg",
                    "Expirado": False,
                    "telegram_user_id": "6839476266",
                    "Status_user": "Ativo",
                    "Tipo_user": "Administrador",
                    "cliente": "1712601227283x577580915930753700",
                    "tem_convite": True,
                    "token": "123456",
                    "cliente_stripe": False,
                    "falta_autorizar_usuario_dominio": False,
                    "_id": "1712602220283x155804620698294820"
                }

        user = self.dto._map(data)

        modified_date = parse("2024-04-26T18:18:18.294Z")
        created_date = parse("2024-04-08T18:50:20.283Z")

        self.assertEqual(user.id, data.get("_id"))
        self.assertEqual(user.modified_date, modified_date)
        self.assertEqual(user.created_date, created_date)
        self.assertEqual(user.email, data.get("authentication").get("email").get("email"))
        self.assertEqual(user.nome, data.get("Nome"))
        self.assertEqual(user.telegram_user_id, data.get("telegram_user_id"))
        self.assertEqual(user.status_user, data.get("Status_user"))
        self.assertEqual(user.tipo_user, data.get("Tipo_user"))
        self.assertEqual(user.cliente, data.get("cliente"))
        self.assertEqual(user.token, data.get("token"))


    # def test_get_by_id_success(self):
    #     id = 1
    #     kr = self.dto.get_by_id(1)

    #     self.assertEqual(kr, expected_kr)

    # def test_get_by_id_bubble(self):
    #     kr = dto.get_by_id(self.valid_id)

    #     self.assertIsNotNone(kr)
    #     self.assertEqual(kr.id, self.valid_id)

    # def test_update_risco_bubble(self):
    #     kr = dto.get_by_id(self.valid_id)

    #     self.assertIsNotNone(kr)

    #     risco_antes = dto.keyresult.status

    #     novo_risco = 'Em risco'
    #     if risco_antes == 'Em risco':
    #         novo_risco = 'No prazo'

    #     dto.keyresult.status = novo_risco
    #     kr = dto.update_risco()
    #     self.assertIsNotNone(kr)

    #     dto.get_by_id(self.valid_id)
    #     self.assertEqual(dto.keyresult.status, novo_risco)


if __name__ == '__main__':
    unittest.main()