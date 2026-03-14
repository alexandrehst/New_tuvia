import unittest
from unittest.mock import MagicMock
from controller.ctrl_criador_plano import Ctrl_Criador_Plano
from datetime import datetime

from dto.Departamento_dto import DepartamentoDTO
from dto.PlanoEstrategico_dto import PlanoEstrategicoDTO
from dto.Plano_dto import PlanoDTO
from model.Okr import Okr
from service.BubbleAPIService import BubbleAPIService

class TestCtrlPlanos(unittest.TestCase):

    def setUp(self):
        self.dto = PlanoEstrategicoDTO(BubbleAPIService())
        self.ctrl_planoestrategico = Ctrl_Criador_Plano()
        self.id_plano_estrategico = '1730934578042x826145294393278500'
        self.id_plano_corporativo = '1713299353575x844115147461756300'
        self.objetivos = [
            {'titulo': 'Estabelecer um Departamento de Marketing eficiente', 'descricao': 'Criar e estruturar um departamento de marketing para melhorar a presença da marca e engajamento com o público-alvo.'},
            {'titulo': 'Implementar a Cultura 2.0', 'descricao': 'Desenvolver e implementar um programa de Cultura 2.0 que promova a inovação, colaboração e retenção de talentos.'},
            {'titulo': 'Investir em Tecnologia e Inteligência Artificial', 'descricao': 'Desenvolver um plano para integrar inteligência artificial nas operações de atendimen...ntar a eficiência e satisfação do cliente.'},
            {'titulo': 'Diversificação de Produtos e Serviços', 'descricao': 'Explorar novas linhas de produtos ou serviços para mitigar os riscos associados a red...o e aumentar a competitividade no mercado.'},
            {'titulo': 'Análise Competitiva Regular', 'descricao': 'Monitorar e avaliar regularmente a concorrência para ajustar estratégias de mercado e identificar oportunidades de crescimento.'},
            {'titulo': 'Parcerias Estratégicas no Mercado de Saúde', 'descricao': 'Buscar parcerias estratégicas com provedores de saúde para oferecer pacotes competitivos e manter o ticket médio.'}
        ]

        departamento_json = {
            "Modified Date": "2024-11-10T01:29:56.483Z",
            "Created Date": "2024-11-09T14:13:01.724Z",
            "Created By": "admin_user_tuvia---pe_test",
            "Descricao": "Departamento responsável pela controladoria, contas a pagar, contas a receber, tesouraria e caixa",
            "Responsavel": "1712602220283x155804620698294820",
            "Cliente": "1712601227283x577580915930753700",
            "Nome": "Financeiro",
            "_id": "1731161581724x316379623663434200"
        }
        dto_dpto = DepartamentoDTO(BubbleAPIService())
        self.departamento = dto_dpto._map(departamento_json)

    def test_get_objetivos_plano(self):
        plano_estrategico = self.dto.get_by_id(self.id_plano_estrategico)
        ctrl_planoestrategico = Ctrl_Criador_Plano()

        result = ctrl_planoestrategico.get_objetivos_gpt( plano_estrategico )    
        self.assertFalse(result.get('error'))
        objetivos = result.get('message').get('Objectives')
        self.assertIsInstance(objetivos, list)
        self.assertGreaterEqual(len(objetivos), 5)

    def test_cria_okrs(self):
        objetivos = self.objetivos
        okrs = self.ctrl_planoestrategico.cria_okrs(objetivos)
        self.assertIsNotNone(okrs)
        self.assertEqual(len(okrs), len(objetivos))
        self.assertIsInstance(okrs[0], Okr)

    def test_cria_plano_departamento(self):
        planoDTO = PlanoDTO(BubbleAPIService())
        plano_estrategico = planoDTO.get_by_id(self.id_plano_corporativo)
        planoDTO.plano = plano_estrategico
        objetivos = planoDTO.get_okrs()

        plano = self.ctrl_planoestrategico.cria_plano(plano_estrategico, objetivos, tipo_plano='Plano de apoio', departamento=self.departamento, plano_pai=plano_estrategico)
        self.assertIsNotNone(plano)
        self.assertEqual(plano.cliente, plano_estrategico.cliente)
        self.assertEqual(plano.data_inicio, plano_estrategico.data_inicio)
        self.assertEqual(plano.data_fim, plano_estrategico.data_fim)
        self.assertEqual(plano.tipo, 'Plano de apoio')
        self.assertIsNotNone(plano.departamento)

    def test_cria_plano_cada_departamento(self):
        planoDTO = PlanoDTO(BubbleAPIService())
        Plano_corporativo = planoDTO.get_by_id(self.id_plano_corporativo)
        self.assertIsNotNone(Plano_corporativo )
        planoDTO.plano = Plano_corporativo
        objetivos = planoDTO.get_okrs()
        self.assertIsNotNone(objetivos)

        plano = self.ctrl_planoestrategico.cria_plano_cada_departamento(Plano_corporativo, self.departamento, objetivos, user_id='1712602220283x155804620698294820')
        self.assertIsNotNone(plano)
        self.assertEqual(plano.cliente, Plano_corporativo.cliente)
        self.assertEqual(plano.data_inicio, Plano_corporativo.data_inicio)
        self.assertEqual(plano.data_fim, Plano_corporativo.data_fim)
        self.assertEqual(plano.tipo, 'Plano de apoio')
        self.assertEqual(plano.plano_pai, Plano_corporativo)

        self.assertIsNotNone(plano.okrs)
        for objetivo in plano.okrs:
            self.assertIsNotNone(objetivo.key_results)

    def test_cria_plano_simples(self):
        descricao = "Construção de um departamento de marketing, com foco em estratégias de marketing digital e inbound marketing."

        okrs_ids = self.ctrl_planoestrategico.cria_plano_simples( plano_id="1732563342521x842503758590771200", descricao=descricao, user_id='1712602220283x155804620698294820')
        self.assertIsNotNone(okrs_ids)

    def test_cria_planos_departamentos(self):
        departamentos = [ "1732588634201x901938713657606100", "1732588580285x274735113169797100", "1731161581724x316379623663434200"]
        planos = self.ctrl_planoestrategico.cria_plano_departamentos( self.id_plano_corporativo, id_departamentos=departamentos, user_id='1712602220283x155804620698294820')

        self.assertIsNotNone(planos)

if __name__ == '__main__':
    unittest.main()