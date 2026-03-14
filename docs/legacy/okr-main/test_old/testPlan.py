import unittest
from model.Plan import Plan

class TestPlan(unittest.TestCase):

    def test_create_from_answer(self):
        # Test the new_plan method with various input scenarios and assert the expected output.
        answer = "OKR1: Teste1\nRC1: Resultado chave um \nRC2: Resultado chave dois \nRC3: Resultado chave tres"
        plan = Plan.create_from_answer('Padaria', 'Uma padaria gourmet', 'Venda de pão', '30 %', answer)
        self.assertEqual(plan.title, "Padaria")
        self.assertEqual(plan.business_info, "Uma padaria gourmet")
        self.assertEqual(plan.improvement_needed, "Venda de pão")
        self.assertEqual(plan.success_indicator, "30 %")
        self.assertEqual(len(plan.okrs), 1)
        self.assertEqual(len(plan.okrs[0].key_results), 3)
