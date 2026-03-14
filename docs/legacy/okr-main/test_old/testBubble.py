import unittest
from model.Plan import Plan
from model.Okr import Okr
from model.KeyResult import KeyResult
from service.BubbleAPIService import BubbleAPIService





class TestPlanBubble(unittest.TestCase):

    # define setup
    def setUp(self):

        kr = KeyResult(id=1, rc='Resultado chave um')
        kr2 = KeyResult(id=2, rc='Resultado chave dois')
        kr3 = KeyResult(id=3, rc='Resultado chave tres')

        self.okr = Okr(id=1, title='Teste1', key_results=[kr, kr2, kr3])
        self.plan = Plan(title='Padaria API Bubble', business_info='Uma padaria gourmet', improvement_needed='Venda de pao', success_indicator='30 %', okrs=[self.okr])

    def test_bubble_create_keyresult(self):
        # Test the new_plan method with various input scenarios and assert the expected output.

        resp, krs = BubbleAPIService.set_keyresult_bubble( self.okr)
        self.assertTrue( resp )

    def test_bubble_create_okr(self):
        # Test the new_plan method with various input scenarios and assert the expected output.

        _, krs = BubbleAPIService.set_keyresult_bubble( okr=self.okr )
        resp, okrs = BubbleAPIService.set_okr_bubble( self.okr, krs )
        self.assertTrue( resp )

    def test_bubble_create_plan(self):
        # Test the new_plan method with various input scenarios and assert the expected output.
        _, krs = BubbleAPIService.set_keyresult_bubble( okr=self.okr )
        _, okr = BubbleAPIService.set_okr_bubble( okr=self.okr, krs=krs )
        resp = BubbleAPIService.set_plan_bubble( self.plan, [okr] )
        self.assertTrue( resp )


    def test_bubble_insere_plan(self):
        # Test the new_plan method with various input scenarios and assert the expected output.

        kr = KeyResult(id=1, rc='Resultado chave um')
        kr2 = KeyResult(id=2, rc='Resultado chave dois')
        kr3 = KeyResult(id=3, rc='Resultado chave tres')
        okr1 = Okr(id=1, title='TEste API 1', key_results=[kr, kr2, kr3])
        okr2 = Okr(id=2, title='TEste API 2', key_results=[kr, kr2, kr3])
        okr3 = Okr(id=3, title='TEste API 3', key_results=[kr, kr2, kr3])

        self.plan = Plan(title='Padaria API Bubble', business_info='Uma padaria gourmet', improvement_needed='Venda de pao', success_indicator='30 %', okrs=[okr1, okr2, okr3])

        user_id = '1700490622151x153417036754893700'

        resp = BubbleAPIService.insere_plan_bubble(self.plan, user_id=user_id)
        self.assertTrue( resp )
