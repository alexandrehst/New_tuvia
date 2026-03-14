import unittest

from controller.ctrl_batch import Ctrl_Batch
          
class TestCtrlBatch(unittest.TestCase):

    def setUp(self) -> None:
      
        self.service = Ctrl_Batch()

    def test_atualiza_status_kr(self):
        
        result =self.service.atualiza_status_kr()

        # Assert the expected results
        self.assertTrue( result )

if __name__ == '__main__':
    unittest.main()