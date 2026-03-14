from datetime import datetime
import unittest

from service.PlanoUsuarioService import PlanoUsuarioService



class MockService():
    PLANO = 'plan'
    OBJETIVO = 'objetivo'
    RESULTADO_CHAVE = 'resultadochave'
    USER =  'user'
    PLANO_USUARIO = 'planousuario'

    @classmethod
    def get_generic_by_id(cls, id:str, type:str):


        return {'error': True}

class TestPlanoUsuarioService(unittest.TestCase):

    def test_insert(self):
        id = PlanoUsuarioService().insert("1718653907696x291091058439160640", "1712602220283x155804620698294820")

        self.assertIsNotNone(id)

if __name__ == '__main__':
    unittest.main()