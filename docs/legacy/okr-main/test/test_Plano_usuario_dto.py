from datetime import datetime
import unittest
from unittest.mock import MagicMock
from dto.Objetivo_dto import ObjetivoDTO
from dto.Plano_usuario_dto import PlanoUsuarioDTO
from service.BubbleAPIService import BubbleAPIService



class MockService():
    PLANO = 'plan'
    OBJETIVO = 'objetivo'
    RESULTADO_CHAVE = 'resultadochave'
    USER =  'user'
    PLANO_USUARIO = 'planousuario'

    @classmethod
    def get_generic_by_id(cls, id:str, type:str):


        return {'error': True}

class TestPlanoUsuarioDTO(unittest.TestCase):

    def test_map(self):
        data = {
                "Modified Date": "2024-04-17T16:43:15.410Z",
                "Created Date": "2024-04-17T16:43:15.410Z",
                "Created By": "admin_user_tuvia---pe_test",
                "Papel": "Proprietário",
                "Usuario": "1713371728715x294175717266264260",
                "Plano": "1713372195105x386933276251914000",
                "_id": "1713372195410x922351742905227900"
            }

        dto = PlanoUsuarioDTO( MockService())
        plano_usuario = dto._map(data)

        modified_date = datetime.strptime("2024-04-17T16:43:15.410Z", '%Y-%m-%dT%H:%M:%S.%fZ')
        created_date = datetime.strptime("2024-04-17T16:43:15.410Z", '%Y-%m-%dT%H:%M:%S.%fZ')

        self.assertEqual(plano_usuario.id, "1713372195410x922351742905227900")

if __name__ == '__main__':
    unittest.main()