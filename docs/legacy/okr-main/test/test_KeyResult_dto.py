from datetime import datetime
import unittest
from unittest.mock import MagicMock
from dto.KeyResult_dto import KeyResultDTO
from service.BubbleAPIService import BubbleAPIService

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

class TestKeyResultDTO(unittest.TestCase):

    valid_id = "1713194562739x372142124497993900"

    def setUp(self):
        self.service = MockService()
        self.keyresult_mock = MagicMock()
        self.dto = KeyResultDTO(self.service )

    def test_init(self):
        self.assertEqual(self.dto.type, self.service.RESULTADO_CHAVE)

    def test_map(self):
        data = {
            "_id": "123",
            "Modified Date":  "2024-04-15T18:03:12.141Z",
            "Created Date": "2024-04-15T15:22:42.739Z",
            "Created By": "John Doe",
            "Descricao": "Sample description",
            "Valor": 10,
            "Peso": 1,
            "Tipo_metrica": "Aumentar até",
            "Unidade": "%",
            "Progresso": 80,
            "Progresso_ponderado": 40,
            "Valor Inicial": 5,
            "Valor Atual": 0,
            "Status": "In Progress"
        }

        keyresult = self.dto._map(data)

        modified_date = datetime.strptime("2024-04-15T18:03:12.141Z", '%Y-%m-%dT%H:%M:%S.%fZ')
        created_date = datetime.strptime("2024-04-15T15:22:42.739Z", '%Y-%m-%dT%H:%M:%S.%fZ')

        self.assertEqual(keyresult.id, "123")
        self.assertEqual(keyresult.created_by, "John Doe")
        self.assertEqual(keyresult.descricao, "Sample description")
        self.assertEqual(keyresult.value, 10)
        self.assertEqual(keyresult.peso, 1)
        self.assertEqual(keyresult.tipo_metrica, "Aumentar até")
        self.assertEqual(keyresult.unit, "%")
        self.assertEqual(keyresult.progresso, 80)
        self.assertEqual(keyresult.progresso_ponderado, 40)
        self.assertEqual(keyresult.valor_inicial, 5)
        self.assertEqual(keyresult.status, "In Progress")

    def test_get_by_id_success(self):
        id = '1'
        dto = KeyResultDTO(self.service)
        expected_kr = KeyResultDTO(service=self.service)._map({'_id': id, 'Descricao': 'Key Result 1', 'Valor': 10, 'Unidade': '%', 'Tipo_metrica': 'Reason 1'})
        kr = self.dto.get_by_id('1')

        self.assertEqual(kr, expected_kr)

    def test_get_by_id_bubble(self):
        dto = KeyResultDTO(BubbleAPIService())
        kr = dto.get_by_id(self.valid_id)

        self.assertIsNotNone(kr)
        self.assertEqual(kr.id, self.valid_id)

    def test_update_risco_bubble(self):
        dto = KeyResultDTO(BubbleAPIService())
        kr = dto.get_by_id(self.valid_id)

        self.assertIsNotNone(kr)

        risco_antes = dto.keyresult.status

        novo_risco = 'Em risco'
        if risco_antes == 'Em risco':
            novo_risco = 'No prazo'

        dto.keyresult.status = novo_risco
        kr = dto.update_risco()
        self.assertIsNotNone(kr)

        dto.get_by_id(self.valid_id)
        self.assertEqual(dto.keyresult.status, novo_risco)


if __name__ == '__main__':
    unittest.main()