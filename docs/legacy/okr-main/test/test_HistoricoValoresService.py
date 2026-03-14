import unittest
from dto.KeyResult_dto import KeyResultDTO
from service.BubbleAPIService import BubbleAPIService
from service.HistoricoValoresService import HistoricoValoresService
from model.KeyResult import KeyResult

class TestHistoricoValoresService(unittest.TestCase):

    def setUp(self):
        self.service = HistoricoValoresService()
        self.kr = KeyResultDTO(BubbleAPIService())._map(   {
                                                "Modified Date": "2024-06-13T20:22:43.107Z",
                                                "Created Date": "2024-04-17T16:45:41.558Z",
                                                "Created By": "admin_user_tuvia---pe_test",
                                                "Descricao": "Reduzir o tempo de entrega dos projetos",
                                                "Valor": 20,
                                                "Peso": 1,
                                                "Tipo_metrica": "Reduzir até",
                                                "Unidade": "%",
                                                "Temporario": True,
                                                "Progresso": 0,
                                                "Progresso_ponderado": 0,
                                                "Valor Inicial": 0,
                                                "Status": "Em atraso",
                                                "_id": "1716928893565x841357227633959600"
                                            })

    def test_get_historicos_por_kr_success(self):

        # Act
        historicos = self.service.get_historicos_por_kr(self.kr)

        # Assert
        self.assertIsNotNone(historicos)

if __name__ == '__main__':
    unittest.main()