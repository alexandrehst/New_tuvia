from datetime import datetime
import unittest

from dto.Objetivo_dto import ObjetivoDTO
from service.BubbleAPIService import BubbleAPIService
from service.OkrService import OkrService


class TestObjetivoService(unittest.TestCase):

    def setUp(self):
        self.dto = ObjetivoDTO(BubbleAPIService() )
        self.objetivo_json = {
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
    def test_insere(self):
        objetivo = self.dto._map(self.objetivo_json)

        ids = OkrService().insere(objetivo)

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

if __name__ == '__main__':
    unittest.main()