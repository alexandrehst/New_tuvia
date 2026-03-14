import json
import unittest
from unittest.mock import MagicMock

from model.KeyResult import KeyResult
from model.Okr import Okr
from model.Plan import Plan
from service.PlanService import PlanService

class TestPlanService(unittest.TestCase):

    def setUp(self) -> None:
        self.plan = Plan(id='1', Titulo='Lançamento Tuvia', business_info='Venda de Aplicação SaaS',
                         improvement_needed='1. Lançar o software que atualmente está em desenvolvimento 2. validar o MVP 3. Conquistar os primeiro 10 clientes 4. realizar faturamento',
                         success_indicator='10 clientes e R$ 1000,00 de MRR', okrs=[
                                Okr(id=None, Titulo='Lançar o software atualmente em desenvolvimento',  numero=None, Descricao=None, progresso=0, responsaveis_ids=None,
                                    key_results=[
                                        KeyResult(id=None, Unidade='%', Tipo_metrica='Aumentar até', Descricao='Concluir os testes de integração e usabilidade do software', peso=None, progresso=None, progresso_ponderado=None, Valor=100.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None),
                                        KeyResult(id=None, Unidade='Evento', Tipo_metrica='Aumentar até', Descricao='Realizar soft launch para um grupo seleto de early adopters', peso=None, progresso=None, progresso_ponderado=None, Valor=1.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None),
                                        KeyResult(id=None, Unidade='pontos', Tipo_metrica='Aumentar até', Descricao='Obter um Net Promoter Score (NPS) positivo dos usuários do soft launch', peso=None, progresso=None, progresso_ponderado=None, Valor=75.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None)],
                                    key_results_ids=None, modified_date=None, created_date=None, created_by=None),
                                Okr(id=None, Titulo='Validar o MVP', numero=None, Descricao=None, progresso=0, responsaveis_ids=None,
                                    key_results=[
                                        KeyResult(id=None, Unidade='Respostas', Tipo_metrica='Aumentar até', Descricao='Coletar feedback de usuarios iniciais', peso=None, progresso=None, progresso_ponderado=None, Valor=10.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None),
                                        KeyResult(id=None, Unidade='Melhorias', Tipo_metrica='Aumentar até', Descricao='Ajustar o produto com base no feedback', peso=None, progresso=None, progresso_ponderado=None, Valor=5.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None),
                                        KeyResult(id=None, Unidade='usuários', Tipo_metrica='Aumentar até', Descricao='Número de usuários ativos semanais', peso=None, progresso=None, progresso_ponderado=None, Valor=100.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None)],
                                    key_results_ids=None, modified_date=None, created_date=None, created_by=None),
                                Okr(id=None, Titulo='Conquistar os primeiros 10 clientes e realizar faturamento', numero=None, Descricao=None, progresso=0, responsaveis_ids=None,
                                    key_results=[
                                        KeyResult(id=None, Unidade='Clientes', Tipo_metrica='Aumentar até', Descricao='Aumentar a base de clientes para 10', peso=None, progresso=None, progresso_ponderado=None, Valor=10.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None),
                                        KeyResult(id=None, Unidade='R$', Tipo_metrica='Aumentar até', Descricao='Alcançar R$1000,00 de MRR', peso=None, progresso=None, progresso_ponderado=None, Valor=1000.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None),
                                        KeyResult(id=None, Unidade='reuniões', Tipo_metrica='Aumentar até', Descricao='Realizar pelo menos 5 reuniões de demonstração de produto por semana', peso=None, progresso=None, progresso_ponderado=None, Valor=5.0, valor_inicial=None, valor_atual=None, status=None, modified_date=None, created_date=None, created_by=None)],
                                    key_results_ids=None, modified_date=None, created_date=None, created_by=None)],
                         cliente=None, data_inicio=None, data_fim=None, departamento=None, plano_pai=None, status=None, tipo='Plano corporativo', modified_date=None, created_date=None, created_by=None, okr_ids=None)
        self.user_id = '1712602220283x155804620698294820'

    def test_create_from_answer(self):
        # Mock the service object
        title = "Loja de sapatos Q2"
        business_info = "Uma loja de sapatos masculinos"
        improvement_needed = "Aumentar a venda de sapatos de alto padrão"
        success_indicator = "50 novas unidades"

        resposta_chat_gpt = '{"Objectives": [{"Titulo": "Aumentar as vendas de sapatos de alto padrão", "Resultados-Chave": [{"Descricao": "Aumentar o volume de vendas de sapatos de alto padrão", "Valor": 50, "Unidade": "unidades", "Tipo_metrica": "Aumentar"}]}]}'

        plan = PlanService.create_from_answer(title, business_info, improvement_needed, success_indicator, json.loads(resposta_chat_gpt))

        self.assertEqual(plan.title, title)
        self.assertEqual(plan.business_info, business_info)
        self.assertEqual(plan.improvement_needed, improvement_needed)
        self.assertEqual(plan.success_indicator, success_indicator)
        self.assertEqual(plan.okrs[0].titulo, "Aumentar as vendas de sapatos de alto padrão")

    def test_insere_plano_ia(self):

        plan_id = PlanService().insere_plano_ia(self.plan)

        self.assertIsNotNone(plan_id)


if __name__ == '__main__':
    unittest.main()