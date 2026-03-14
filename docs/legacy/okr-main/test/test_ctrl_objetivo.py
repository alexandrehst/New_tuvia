import unittest
from unittest.mock import MagicMock
from datetime import datetime

from controller.ctrl_objetivo import Ctrl_Objetivo


class TestCtrlObjetivo(unittest.TestCase):


    def setUp(self) -> None:
      
        self.plan_id = '1732626050493x831417453887834800'

    def test_novo_objetivo_ia(self):
        # Call the method to be tested
        result = Ctrl_Objetivo().novo_objetivo_ia( self.plan_id )

        # Assert the expected results
        self.assertIsNotNone( result )


if __name__ == '__main__':
    unittest.main()