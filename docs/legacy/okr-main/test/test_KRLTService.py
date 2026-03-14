import unittest
from datetime import datetime
from dto.KeyResult_dto import KeyResultDTO
from dto.Objetivo_dto import ObjetivoDTO
from service.KRLTService import KRLTService
from service.BubbleAPIService import BubbleAPIService

class TestKrService(unittest.TestCase):

    

    def test_atualiza_linha_tendencia(self):
        data_inicio = datetime.strptime("2024-01-01", "%Y-%m-%d")
        data_fim = datetime.strptime("2024-06-30", "%Y-%m-%d")

        dto = ObjetivoDTO(BubbleAPIService())
        objetivo = dto.get_by_id("1716928903497x509598706855247700")

        dto.objetivo = objetivo
        krs = dto.get_key_results()
        result = KRLTService.atualiza_linha_tendencia(krs, data_inicio, data_fim)

        self.assertTrue(result)

    def test_get_by_kr(self):
        dto = KeyResultDTO(BubbleAPIService())
        kr = dto.get_by_id("1733517126051x869602119683341400")
        self.assertIsNotNone(kr)

        krlt = KRLTService.get_by_kr(kr, so_ultimo=True)

        self.assertIsNotNone(krlt)

    def test_get_by_kr_returning_many(self):
        dto = KeyResultDTO(BubbleAPIService())
        kr = dto.get_by_id("1733517126051x869602119683341400")
        self.assertIsNotNone(kr)

        krlt = KRLTService.get_by_kr(kr, so_ultimo=True)

        self.assertIsNotNone(krlt)

    def test_get_by_kr_returning_none(self):
        dto = KeyResultDTO(BubbleAPIService())
        kr = dto.get_by_id("1733251627643x740474343417352800")
        self.assertIsNotNone(kr)

        krlt = KRLTService.get_by_kr(kr, so_ultimo=False)

        self.assertIsNone(krlt)    


    def test_get_linha_tendencia(self):
        # trimestre
        data_inicio = datetime.strptime("2024-01-01", "%Y-%m-%d")
        data_fim = datetime.strptime("2024-03-31", "%Y-%m-%d")
        valor_inicial = 0
        valor_final = 100
        numero_pontos = 3
        linha = KRLTService.get_linha_tendencia( data_inicio, data_fim, valor_inicial, valor_final, numero_pontos)

        self.assertEqual(linha, {'2024-01-01': 0.0, '2024-02-15': 50.0, '2024-03-31': 100.0})

        # semestre
        data_inicio = datetime.strptime("2024-01-01", "%Y-%m-%d")
        data_fim = datetime.strptime("2024-06-30", "%Y-%m-%d")
        valor_inicial = 0
        valor_final = 100
        numero_pontos = 6
        linha = KRLTService.get_linha_tendencia( data_inicio, data_fim, valor_inicial, valor_final, numero_pontos)
        expected = {'2024-01-01': 0.0, '2024-02-06': 20.0, '2024-03-13': 40.0, '2024-04-18': 60.0, '2024-05-24': 80.0, '2024-06-30': 100.0}
        self.assertEqual(linha, expected)

        # semestre descendente
        data_inicio = datetime.strptime("2024-01-01", "%Y-%m-%d")
        data_fim = datetime.strptime("2024-06-30", "%Y-%m-%d")
        valor_inicial = 100
        valor_final = 0
        numero_pontos = 6
        linha = KRLTService.get_linha_tendencia( data_inicio, data_fim, valor_inicial, valor_final, numero_pontos)
        expected = {'2024-01-01': 100.0, '2024-02-06': 80.0, '2024-03-13': 60.0, '2024-04-18': 40.0, '2024-05-24': 20.0, '2024-06-30': 0.0}
        self.assertEqual(linha, expected)        

if __name__ == '__main__':
    unittest.main()