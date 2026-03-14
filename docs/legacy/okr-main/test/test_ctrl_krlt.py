import unittest

from controller.ctrl_krlt import Ctrl_KRLT
from datetime import datetime, timezone

class TestCtrlKRLT(unittest.TestCase):

    def setUp(self) -> None:
      
        self.service = Ctrl_KRLT()

    def test_atualiza_linha_tendencia(self):
        
        kr_id = "1733517126051x869602119683341400"
        data_inicial = datetime.strptime("15/apr/24", "%d/%b/%y").astimezone(timezone.utc)
        data_final = datetime.strptime("15/jun/24", "%d/%b/%y").astimezone(timezone.utc)
        
        result =self.service.atualiza_linha_tendencia(kr_id=kr_id, data_inicio=data_inicial, data_fim=data_final)

        # Assert the expected results
        self.assertTrue( result )

if __name__ == '__main__':
    unittest.main()