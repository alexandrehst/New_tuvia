import unittest
from datetime import datetime

from dto.Plano_dto import PlanoDTO
from dto.User_dto import UserDTO
from model.Plan import Plan
from notification.canais import CanalEmail, CanalEmailBoasVindas, CanalEmailDetalhePlano
from service.BubbleAPIService import BubbleAPIService
from service.Configurations import Configurations

class MockEmailService():
    def envia_email(self, users, mensagem, attachment=None):
        text = f'Email enviado para {users}. Mensagem {mensagem}. Tem attachemnte? {attachment is None}\n'
        return text

class TestCanais(unittest.TestCase):

    def setUp(self):
        dto = PlanoDTO(BubbleAPIService())
        self.plano = dto.get_by_id('1717513962005x927209382497193900')

    def test_create_canal(self):
        canal = CanalEmail.create_canal(CanalEmail.BOAS_VINDAS)
        self.assertIsInstance(canal, CanalEmailBoasVindas)

        canal = CanalEmail.create_canal(CanalEmail.DETALHE_PLANO)
        self.assertIsInstance(canal, CanalEmailDetalhePlano)
        
        canal = CanalEmail.create_canal(CanalEmail.CONVITE)
        self.assertIsInstance(canal, CanalEmailDetalhePlano)



    def test_canal_email_notifica(self):
        users = ['user1', 'user2', 'user3']

        canal = CanalEmail.create_canal(CanalEmail.BOAS_VINDAS, MockEmailService())
        resposta = canal.notifica(users, "Seja bem vindo")
        self.assertEqual(canal.email_service.subject, "Seja bem vindo")

        canal = CanalEmail.create_canal(CanalEmail.DETALHE_PLANO, MockEmailService())
        resposta = canal.notifica(users, 'mensagem')
        self.assertIsNone(resposta)

        canal = CanalEmail.create_canal(CanalEmail.CONVITE, MockEmailService())
        resposta = canal.notifica(users, 'mensagem')
        self.assertIsNone(resposta)
        
        resposta = canal.notifica(users, self.plano)
        self.assertEqual(canal.email_service.subject, "Aqui está o acompanhamento do seu plano estratégico")
        
    def test_envia_email_convite(self):
        dto = UserDTO(BubbleAPIService())
        usuario = dto.get_by_id('1712602220283x155804620698294820')
        self.assertIsNotNone(usuario)
        
        canal = CanalEmail.create_canal(CanalEmail.CONVITE) # Cria Brevo como default
        resposta = canal.notifica([usuario], "Clínica São Camilo")
        self.assertIsNotNone(resposta.message_id)

if __name__ == '__main__':
    unittest.main()