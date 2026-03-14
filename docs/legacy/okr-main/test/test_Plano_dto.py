from datetime import datetime
import unittest
from unittest.mock import MagicMock
from dto.Plano_dto import PlanoDTO
from service.BubbleAPIService import BubbleAPIService

class MockService():
    PLANO = 'plano'
    OBJETIVO = 'objetivo'
    RESULTADO_CHAVE = 'resultadochave'
    USER =  'user'

    @classmethod
    def get_generic_by_constraint(cls, type:str, constraint:dict):
        if type == cls.PLANO:
            return {'error': False,
                    'plano':
                        [
                            {
                                "Modified Date": "2024-04-18T12:40:21.731Z",
                                "Created Date": "2024-04-16T20:29:13.575Z",
                                "Created By": "admin_user_tuvia---pe_test",
                                "Data inicio": "2024-04-16T03:00:00.000Z",
                                "Data fim": "2024-06-16T03:00:00.000Z",
                                "IA-melhorar": "Alcançar uma base de clientes, MMR de 10k",
                                "IA-negocio": "Empresa de desenvolvimento de softwares de gestão para pme's",
                                "IA-valor": "10000",
                                "Titulo": "Plano de lançamento TUVIA AI",
                                "Status": "Publicado",
                                "Objetivos": [
                                    "1713299353130x414521342643671550",
                                    "1713299353135x928627349251988500",
                                    "1713299353147x811861430185860000"
                                ],
                                "Tipo": "Plano corporativo",
                                "cliente": "1713299178331x640660779433463300",
                                "_id": "1713299353575x844115147461756300"
                            },
                            {
                                "Modified Date": "2024-04-18T12:40:10.978Z",
                                "Created Date": "2024-04-17T16:43:15.105Z",
                                "Created By": "admin_user_tuvia---pe_test",
                                "Data inicio": "2024-04-01T03:00:00.000Z",
                                "Data fim": "2024-06-30T03:00:00.000Z",
                                "IA-melhorar": "Adquirir base de clientes recorrentes que gere o MMR de R$ 10.000,00",
                                "IA-negocio": "Empresa de desenvolvimento de software para gestão de negócios",
                                "IA-valor": "10000",
                                "Titulo": "Meu primeiro plano",
                                "Status": "Publicado",
                                "Objetivos": [
                                    "1713372194790x281785834263013730",
                                    "1713372194795x793423992927196400",
                                    "1713372194811x516213171716712450",
                                    "1713372341924x771285652133084900"
                                ],
                                "Tipo": "Plano corporativo",
                                "cliente": "1713371728799x558605515472845300",
                                "_id": "1713372195105x386933276251914000"
                            }
                        ]
            }
        return {'error': True}

class TestPlanoDTO(unittest.TestCase):

    def setUp(self):
        self.service = MockService()
        self.keyresult_mock = MagicMock()
        self.dto = PlanoDTO(self.service )

    def test_init(self):
        self.assertEqual(self.dto.type, self.service.PLANO)

    def test_map(self):
        data = {
            "_id": "123",
            "Modified Date":  "2024-04-15T18:03:12.141Z",
            "Created Date": "2024-04-15T15:22:42.739Z",
            "Created By": "John Doe",
            "Titulo": "Sample description",
            "IA-negocio": 'Negocio',
            "IA-melhorar": 'Melhorar',
            "IA-valor": '10',
            "cliente": '123',
            "Data inicio": "2024-04-15",
            "Data fim": "2024-04-15",
            "Status": "Edição",
            "Tipo": "Coorporativo",
            "Objetivos": [
                "1713372194790x281785834263013730",
                "1713372194795x793423992927196400",
                "1713372194811x516213171716712450",
                "1713372341924x771285652133084900"
            ],
        }

        data["Data inicio"] = datetime.strptime(data["Data inicio"], "%Y-%m-%d")
        data["Data fim"] = datetime.strptime(data["Data fim"], "%Y-%m-%d")

        plano = self.dto._map(data)

        self.assertEqual(plano.id, "123")
        self.assertEqual(plano.created_by, "John Doe")
        self.assertEqual(plano.title, "Sample description")
        self.assertEqual(plano.status, "Edição")
        self.assertEqual(plano.tipo, "Coorporativo")
        

    def test_get_publicados_success(self):
        id = 1
        dto = PlanoDTO(service=self.service)
        expected = [
                        dto._map(
                            { "Data inicio": "2024-04-16T03:00:00.000Z",
                            "Data fim": "2024-06-16T03:00:00.000Z",
                            "Titulo": "Plano de lançamento TUVIA AI",
                            "Status": "Publicado",
                            "_id": "1713299353575x844115147461756300",
                            "IA-negocio": 'Negocio',
                           "IA-melhorar": 'Melhorar',
                            "IA-valor": '10'
                            }
                        )
        ]

        expected.append ( dto._map(
                                {
                                    "Data inicio": "2024-04-01T03:00:00.000Z",
                                    "Data fim": "2024-06-30T03:00:00.000Z",
                                    "Titulo": "Meu primeiro plano",
                                    "Status": "Publicado",
                                    "_id": "1713372195105x386933276251914000",
                                    "IA-negocio": 'Negocio',
                                    "IA-melhorar": 'Melhorar',
                                     "IA-valor": '10'
                                }
                            ))

        planos = dto.get_planos_publicados()

        assert planos is not None

    def test_get_okrs(self):
        
        dto = PlanoDTO( BubbleAPIService() )
        dto.plano = dto.get_by_id("1713299353575x844115147461756300")

        okrs = dto.get_okrs()

        assert any(okr.id == "1713299353130x414521342643671550" for okr in okrs)
    
    def test_get_okr_com_krs(self):
        
        dto = PlanoDTO( BubbleAPIService() )
        dto.plano = dto.get_by_id("1713299353575x844115147461756300")

        okrs = dto.get_okrs(carrega_key_results=True)

        assert any(okr.id == "1713299353130x414521342643671550" for okr in okrs)

if __name__ == '__main__':
    unittest.main()