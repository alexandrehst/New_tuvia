from datetime import datetime
import unittest
from dto.Departamento_dto import DepartamentoDTO
from service.BubbleAPIService import BubbleAPIService


class TestDepartamentoDTO(unittest.TestCase):

    def setUp(self):
        self.service = BubbleAPIService()
        self.dto = DepartamentoDTO(self.service )
        self.departamento = {
            "Modified Date": "2024-11-10T01:29:56.483Z",
            "Created Date": "2024-11-09T14:13:01.724Z",
            "Created By": "admin_user_tuvia---pe_test",
            "Descricao": "Departamento responsável pela controladoria, contas a pagar, contas a receber, tesouraria e caixa",
            "Responsavel": "1712602220283x155804620698294820",
            "Cliente": "1712601227283x577580915930753700",
            "Nome": "Financeiro",
            "_id": "1731161581724x316379623663434200"
        }

    def test_init(self):
        self.assertEqual(self.dto.type, self.service.DEPARTAMENTO)

    def test_get_by_id(self):
        dpto = self.dto.get_by_id("1731161581724x316379623663434200")
        self.assertEqual(dpto.id, self.departamento["_id"])
        self.assertEqual(dpto.nome, self.departamento["Nome"])
        self.assertEqual(dpto.descricao, self.departamento["Descricao"])
        self.assertEqual(dpto.responsavel, self.departamento["Responsavel"])

    def test_map(self):
        
        departamento = self.dto._map( self.departamento )
        self.assertEqual(departamento.id, self.departamento["_id"])
        self.assertEqual(departamento.nome, self.departamento["Nome"])


if __name__ == '__main__':
    unittest.main()