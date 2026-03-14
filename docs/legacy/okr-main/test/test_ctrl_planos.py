import unittest
from unittest.mock import MagicMock
from controller.ctrl_planos import Ctrl_Planos, PlanoDTO, ObjetivoDTO, KeyResultDTO
from datetime import datetime

from model.KeyResult import KeyResult
from model.Okr import Okr
from model.Plan import Plan
from service.BubbleAPIService import BubbleAPIService
from service.KrService import KrService

class MockService():
    PLANO = 'plan'
    OBJETIVO = 'objetivo'
    RESULTADO_CHAVE = 'resultadochave'
    USER =  'user'

    @classmethod
    def get_generic_by_constraint(cls, type:str, constraint):
        if type == cls.PLANO:
            return {'error': False,
                    'plan': [ {
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
                            }]
                    }
        return {'error': True}

    @classmethod
    def get_generic_by_id_list(cls, ids:list, type:str):
        if type == cls.OBJETIVO:
            return {'error': False,
                    'valores':
                           [
                               {
                                   '_id': '1',
                                   'Titulo': 'Obj 1',
                                   'Resultados-Chave' : ['1', '2'],
                                   'Numero': 1,
                                    "Modified Date": "2024-04-17T16:48:04.240Z",
                                    "Created Date": "2024-04-17T16:45:41.924Z",
                                    "Created By": "admin_user_tuvia---pe_test"
                                },
                                {
                                   '_id': '2',
                                   'Titulo': 'Obj 2',
                                   'Resultados-Chave' : ['3', '4'],
                                   'Numero': 2,
                                    "Modified Date": "2024-04-17T16:48:04.240Z",
                                    "Created Date": "2024-04-17T16:45:41.924Z",
                                    "Created By": "admin_user_tuvia---pe_test"
                                }
                            ]

                    }

        if type == cls.RESULTADO_CHAVE:
            return {'error': False,
                    'valores':
                           [
                               {
                                   '_id': '1',
                                   'Descricao': 'Key Result 1',
                                   'Valor Atual': 10,
                                   'Valor Inicial': 0,
                                   'Valor': 100,
                                   'Unidade': 'Percentage',
                                   'Tipo_metrica': 'Aumentar até'
                                },
                                {
                                   '_id': '2',
                                    'Descricao': 'Key Result 2',
                                   'Valor Atual': 40,
                                   'Valor Inicial': 0,
                                   'Valor': 100,
                                   'Unidade': 'Percentage',
                                   'Tipo_metrica': 'Aumentar até'
                                }
                            ]

                    }
        return {'error': True}
    def update_generic(cls, type, id, key, valor):
        return {'error': False}
    
    @classmethod
    def get_plan(cls):
            plan = Plan(id='1', Titulo='Lançamento Tuvia', business_info='Venda de Aplicação SaaS',
                    improvement_needed='1. Lançar o software que atualmente está em desenvolvimento 2. validar o MVP 3. Conquistar os primeiro 10 clientes 4. realizar faturamento',
                    success_indicator='10 clientes e R$ 1000,00 de MRR')
                            

            okrs = []
            okr = Okr(id=None, Titulo='Lançar o software atualmente em desenvolvimento',  numero=None, descricao=None, progresso=0, responsaveis_ids=None)
            key_results=[
                        KeyResult(id=None, Unidade='%', Tipo_metrica='Aumentar até', Descricao='Concluir os testes de integração e usabilidade do software', peso=None, progresso=None, progresso_ponderado=None, Valor=100.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None),
                        KeyResult(id=None, Unidade='Evento', Tipo_metrica='Aumentar até', Descricao='Realizar soft launch para um grupo seleto de early adopters', peso=None, progresso=None, progresso_ponderado=None, Valor=1.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None),
                        KeyResult(id=None, Unidade='pontos', Tipo_metrica='Aumentar até', Descricao='Obter um Net Promoter Score (NPS) positivo dos usuários do soft launch', peso=None, progresso=None, progresso_ponderado=None, Valor=75.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None)]
            okr.key_results = key_results
            okrs.append(okr)

            okr =  Okr(id=None, Titulo='Validar o MVP', numero=None, descricao=None, progresso=0, responsaveis_ids=None)
            key_results=[
                KeyResult(id=None, Unidade='Respostas', Tipo_metrica='Aumentar até', Descricao='Coletar feedback de usuarios iniciais', peso=None, progresso=None, progresso_ponderado=None, Valor=10.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None),
                KeyResult(id=None, Unidade='Melhorias', Tipo_metrica='Aumentar até', Descricao='Ajustar o produto com base no feedback', peso=None, progresso=None, progresso_ponderado=None, Valor=5.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None),
                KeyResult(id=None, Unidade='usuários', Tipo_metrica='Aumentar até', Descricao='Número de usuários ativos semanais', peso=None, progresso=None, progresso_ponderado=None, Valor=100.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None)]
            okr.key_results = key_results
            okrs.append(okr)

            okr = Okr(id=None, Titulo='Conquistar os primeiros 10 clientes e realizar faturamento', numero=None, descricao=None, progresso=0, responsaveis_ids=None)
            key_results=[
                KeyResult(id=None, Unidade='Clientes', Tipo_metrica='Aumentar até', Descricao='Aumentar a base de clientes para 10', peso=None, progresso=None, progresso_ponderado=None, Valor=10.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None),
                KeyResult(id=None, Unidade='R$', Tipo_metrica='Aumentar até', Descricao='Alcançar R$1000,00 de MRR', peso=None, progresso=None, progresso_ponderado=None, Valor=1000.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None),
                KeyResult(id=None, Unidade='reuniões', Tipo_metrica='Aumentar até', Descricao='Realizar pelo menos 5 reuniões de demonstração de produto por semana', peso=None, progresso=None, progresso_ponderado=None, Valor=5.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None)]
            okr.key_results = key_results
            okrs.append(okr)

            plan.okrs = okrs      
            return plan
          
class TestCtrlPlanos(unittest.TestCase):

    data_calculo = datetime.strptime("2024-04-17", "%Y-%m-%d")

    def setUp(self) -> None:
      
        self.plan = MockService().get_plan()
        self.user_id = '1712602220283x155804620698294820'

    def test_calcula_riscos(self):
        # Mock the service object
        service = BubbleAPIService()

        # Call the method to be tested
        result = Ctrl_Planos().calcula_riscos(service,  self.data_calculo)

        # Assert the expected results
        self.assertIsNotNone( result )

        status_list = [res.status for res in result]
        self.assertEqual(status_list, [KrService().RISCO_ALTO, KrService().EM_RISCO, KrService().RISCO_ALTO, KrService().EM_RISCO])

    def test_insere_plano(self):

        # seta o responsavel para todos os objetivos
        for okr in self.plan.okrs:
            okr.responsaveis = [self.user_id]
            okr.responsaveis_ids = [self.user_id]

        result, plan_id = Ctrl_Planos().insere_plano( self.plan, self.user_id)
        self.assertTrue(result)


if __name__ == '__main__':
    unittest.main()