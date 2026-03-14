from datetime import datetime
import unittest
from unittest.mock import MagicMock
from dto.Objetivo_dto import ObjetivoDTO
from service.BubbleAPIService import BubbleAPIService

class MockService():
    PLANO = 'plan'
    OBJETIVO = 'objetivo'
    RESULTADO_CHAVE = 'resultadochave'
    USER =  'user'

    @classmethod
    def get_generic_by_id(cls, id:str, type:str):
        if type == cls.OBJETIVO:
            return {
            "Modified Date": "2024-04-17T16:48:04.240Z",
            "Created Date": "2024-04-17T16:45:41.924Z",
            "Created By": "admin_user_tuvia---pe_test",
            "Descricao": "Aumentar a eficiência operacional para reduzir custos",
            "Numero": 4,
            "Titulo": "Aumentar a eficiência operacional para reduzir custos",
            "Progresso": 0,
            "Resultados-Chave": [
                "1713372341558x884063154409911600",
                "1713372341559x512471337526750460"
            ],
            "Responsaveis": [
                "1713371728715x294175717266264260"
            ],
            "_id": "1713372341924x771285652133084900"
        }

        return {'error': True}

class TestObjetivoDTO(unittest.TestCase):

    def setUp(self):
        self.service = MockService()
        self.keyresult_mock = MagicMock()
        self.dto = ObjetivoDTO(self.service )

    def test_init(self):
        self.assertEqual(self.dto.type, self.service.OBJETIVO)

    def test_map(self):
        data = {
            "Modified Date": "2024-04-17T16:48:04.240Z",
            "Created Date": "2024-04-17T16:45:41.924Z",
            "Created By": "admin_user_tuvia---pe_test",
            "Descricao": "Aumentar a eficiência operacional para reduzir custos",
            "Numero": 4,
            "Titulo": "Aumentar a eficiência operacional para reduzir custos",
            "Progresso": 0,
            "Resultados-Chave": [
                "1713372341558x884063154409911600",
                "1713372341559x512471337526750460"
            ],
            "Responsaveis": [
                "1713371728715x294175717266264260"
            ],
            "_id": "1713372341924x771285652133084900"
        }

        objetivo = self.dto._map(data)

        modified_date = datetime.strptime("2024-04-17T16:48:04.240Z", '%Y-%m-%dT%H:%M:%S.%fZ')
        created_date = datetime.strptime("2024-04-17T16:45:41.924Z", '%Y-%m-%dT%H:%M:%S.%fZ')

        self.assertEqual(objetivo.id, "1713372341924x771285652133084900")
        self.assertEqual(objetivo.created_by, "admin_user_tuvia---pe_test")
        self.assertEqual(objetivo.titulo, "Aumentar a eficiência operacional para reduzir custos")
        self.assertEqual(objetivo.numero, 4)
        self.assertEqual(objetivo.descricao, "Aumentar a eficiência operacional para reduzir custos")
        self.assertEqual(objetivo.progresso, 0)
        self.assertEqual(objetivo.responsaveis_ids, ["1713371728715x294175717266264260"])

    def test_objetivos_com_responsaveis(self):
        dto = ObjetivoDTO(BubbleAPIService)
        result = dto.get_objetivos_com_responsaveis()
        self.assertIsNotNone(result)

    def test_objetivos_get_responsaveis(self):
        dto = ObjetivoDTO(BubbleAPIService)
        result = dto.get_by_id('1712862044676x548868872065710200')

        dto.objetivo = result
        responsaveis = dto.get_responsaveis()

        self.assertIsNotNone(responsaveis)
if __name__ == '__main__':
    unittest.main()