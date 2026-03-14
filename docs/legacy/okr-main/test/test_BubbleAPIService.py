import unittest
from unittest.mock import MagicMock
from service.BubbleAPIService import BubbleAPIService, Plan, Okr

class TestBubbleAPIService(unittest.TestCase):

    def setUp(self):
        self.bubble_service = BubbleAPIService()
        self.resultado_chave_valid_id = "1713299352852x173929879898444320"
        self.resultado_chave_valid_ids = [ "1713299352852x173929879898444320", "1713299352851x501292480546857700"]

    def test_get_generic_by_id(self):
        type = BubbleAPIService.RESULTADO_CHAVE
        expected_result = {'error': False, 'resultadochave': [{'id': '123', 'name': 'Test Plan'}]}

        result = self.bubble_service.get_generic_by_id(self.resultado_chave_valid_id, type)
        resultado_chave = result['resultadochave']

        self.assertEqual(resultado_chave['_id'], self.resultado_chave_valid_id)

    # def test_get_generic_by_id_list(self):
    #     ids = ["123", "456"]
    #     type = "objetivo"
    #     expected_result = {'error': False, 'valores': [{'id': '123', 'name': 'Objective 1'}, {'id': '456', 'name': 'Objective 2'}]}
    #     self.bubble_service.conf.bubble_api_address = "http://example.com/api"
    #     self.bubble_service.conf.bubble_api = "token123"
    #     self.bubble_service.header_json = {'Authorization': 'Bearer token123', 'Content-Type': 'application/json'}
    #     self.bubble_service.header_text = {'Authorization': 'Bearer token123', 'Content-Type': 'text/plain'}
    #     self.bubble_service.get_generic_by_id_list = MagicMock(return_value=expected_result)

    #     result = self.bubble_service.get_generic_by_id_list(ids, type)

    #     self.assertEqual(result, expected_result)
    #     self.bubble_service.get_generic_by_id_list.assert_called_once_with(ids, type)

    # def test_get_generic_by_constraint(self):
    #     type = "resultadochave"
    #     constraint = {"key": "status", "constraint_type": "equals", "value": "completed"}
    #     expected_result = {'error': False, 'valor': [{'id': '123', 'name': 'Key Result 1'}, {'id': '456', 'name': 'Key Result 2'}]}
    #     self.bubble_service.conf.bubble_api_address = "http://example.com/api"
    #     self.bubble_service.conf.bubble_api = "token123"
    #     self.bubble_service.header_json = {'Authorization': 'Bearer token123', 'Content-Type': 'application/json'}
    #     self.bubble_service.header_text = {'Authorization': 'Bearer token123', 'Content-Type': 'text/plain'}
    #     self.bubble_service.get_generic_by_constraint = MagicMock(return_value=expected_result)

    #     result = self.bubble_service.get_generic_by_constraint(type, constraint)

    #     self.assertEqual(result, expected_result)
    #     self.bubble_service.get_generic_by_constraint.assert_called_once_with(type, constraint)

    # def test_insere_plan_bubble(self):
    #     plan = Plan()
    #     user_id = "123"
    #     expected_result = (True, "plan123")
    #     self.bubble_service.get_keyresult = MagicMock(return_value="key_results")
    #     self.bubble_service.set_keyresult_bubble = MagicMock(return_value={'error': False, 'ids': ['kr123', 'kr456']})
    #     self.bubble_service.get_okrs = MagicMock(return_value="okrs")
    #     self.bubble_service.set_okr_bubble = MagicMock(return_value={'error': False, 'ids': ['okr123']})
    #     self.bubble_service.set_plan_bubble = MagicMock(return_value={'error': False, 'id': 'plan123'})
    #     self.bubble_service.set_plano_usuario_bubble = MagicMock(return_value={'error': False})

    #     result = self.bubble_service.insere_plan_bubble(plan, user_id)

    #     self.assertEqual(result, expected_result)
    #     self.bubble_service.get_keyresult.assert_called_once_with(plan.okrs)
    #     self.bubble_service.set_keyresult_bubble.assert_called_once_with("key_results")
    #     self.bubble_service.get_okrs.assert_called_once_with(plan.okrs, ['kr123', 'kr456'])
    #     self.bubble_service.set_okr_bubble.assert_called_once_with("okrs")
    #     self.bubble_service.set_plan_bubble.assert_called_once_with(plan, ['okr123'])
    #     self.bubble_service.set_plano_usuario_bubble.assert_called_once_with('plan123', user_id)

    # def test_insere_okr_bubble(self):
    #     okr = Okr()
    #     expected_result = (True, "okr123")
    #     self.bubble_service.get_keyresult = MagicMock(return_value="key_results")
    #     self.bubble_service.set_keyresult_bubble = MagicMock(return_value={'error': False, 'ids': ['kr123', 'kr456']})
    #     self.bubble_service.get_okrs = MagicMock(return_value="okrs")
    #     self.bubble_service.set_okr_bubble = MagicMock(return_value={'error': False, 'ids': ['okr123']})

    #     result = self.bubble_service.insere_okr_bubble(okr)

    #     self.assertEqual(result, expected_result)
    #     self.bubble_service.get_keyresult.assert_called_once_with([okr])
    #     self.bubble_service.set_keyresult_bubble.assert_called_once_with("key_results")
    #     self.bubble_service.get_okrs.assert_called_once_with([okr], ['kr123', 'kr456'])
    #     self.bubble_service.set_okr_bubble.assert_called_once_with("okrs")

    # def test_get_keyresult(self):
    #     okrs = [Okr()]
    #     expected_result = '{"key": "value"}'
    #     okr = okrs[0]
    #     okr.json_bubble = MagicMock(return_value={"key": "value"})

    #     result = self.bubble_service.get_keyresult(okrs)

    #     self.assertEqual(result, expected_result)
    #     okr.json_bubble.assert_called_once()

    # def test_get_okrs(self):
    #     okrs = [Okr()]
    #     kr_ids = ['kr123', 'kr456']
    #     expected_result = '{"key": "value"}'
    #     okr = okrs[0]
    #     okr.json_bubble = MagicMock(return_value={"key": "value"})
    #     self.bubble_service.get_keyresult = MagicMock(return_value="key_results")

    #     result = self.bubble_service.get_okrs(okrs, kr_ids)

    #     self.assertEqual(result, expected_result)
    #     okr.json_bubble.assert_called_once()
    #     self.bubble_service.get_keyresult.assert_called_once_with(okrs)

    # def test_set_plan_bubble(self):
    #     plan = Plan()
    #     okrs = ['okr123', 'okr456']
    #     expected_result = {'error': False, 'id': 'plan123'}
    #     plan.json_bubble = MagicMock(return_value={"Plan": {"key": "value"}})
    #     self.bubble_service.plan_api_bubble = "http://example.com/api/plan"
    #     self.bubble_service.header_json = {'Authorization': 'Bearer token123', 'Content-Type': 'application/json'}
    #     self.bubble_service.header_text = {'Authorization': 'Bearer token123', 'Content-Type': 'text/plain'}
    #     self.bubble_service.requests.post = MagicMock(return_value=MagicMock(json=MagicMock(return_value={'id': 'plan123'})))

    #     result = self.bubble_service.set_plan_bubble(plan, okrs)

    #     self.assertEqual(result, expected_result)
    #     plan.json_bubble.assert_called_once()
    #     self.bubble_service.requests.post.assert_called_once_with("http://example.com/api/plan", json={"Plan": {"key": "value"}}, headers={'Authorization': 'Bearer token123', 'Content-Type': 'application/json'})

    # def test_set_plano_usuario_bubble(self):
    #     plan_id = "plan123"
    #     user_id = "user123"
    #     expected_result = {'error': False}
    #     self.bubble_service.plano_usuario_api_bubble = "http://example.com/api/plano_usuario"
    #     self.bubble_service.header_json = {'Authorization': 'Bearer token123', 'Content-Type': 'application/json'}
    #     self.bubble_service.header_text = {'Authorization': 'Bearer token123', 'Content-Type': 'text/plain'}
    #     self.bubble_service.requests.post = MagicMock(return_value=MagicMock(json=MagicMock(return_value={})))

    #     result = self.bubble_service.set_plano_usuario_bubble(plan_id, user_id)

    #     self.assertEqual(result, expected_result)
    #     self.bubble_service.requests.post.assert_called_once_with("http://example.com/api/plano_usuario", json={"Plano": "plan123", "Usuario": "user123", "Papel": "Proprietário"}, headers={'Authorization': 'Bearer token123', 'Content-Type': 'application/json'})

if __name__ == '__main__':
    unittest.main()