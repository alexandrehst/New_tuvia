import unittest
from model.Okr import Okr, KeyResult

class TestOkr(unittest.TestCase):

    def test_create_from_answer1(self):
        # Test the new_plan method with various input scenarios and assert the expected output.
        answer = "OKR1: Teste1\nRC1: Resultado chave um \nRC2: Resultado chave dois \nRC3: Resultado chave tres"
        okrs = Okr.create_from_answer(answer)
        okr = okrs[0]
        self.assertEqual(okr.titulo, "Teste1")
        self.assertEqual(len(okr.key_results), 3)
        if len(okr.key_results) > 0:
            self.assertEqual(okr.key_results[0].descricao, "Resultado chave um")
            self.assertEqual(okr.key_results[1].descricao, "Resultado chave dois")
            self.assertEqual(okr.key_results[2].descricao, "Resultado chave tres")

    def test_create_from_answer2(self):
        answer = "OKR1: Teste1\nRC1.1: Resultado chave um \nRC1.2: Resultado chave dois \nRC1.3: Resultado chave tres"
        okrs = Okr.create_from_answer(answer)
        okr = okrs[0]
        self.assertEqual(len(okr.key_results), 3)
        self.assertEqual(okr.titulo, "Teste1")
        if len(okr.key_results) > 0:
            self.assertEqual(okr.key_results[0].descricao, "Resultado chave um")
            self.assertEqual(okr.key_results[1].descricao, "Resultado chave dois")
            self.assertEqual(okr.key_results[2].descricao, "Resultado chave tres")