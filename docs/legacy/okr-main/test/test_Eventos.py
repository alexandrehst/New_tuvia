import unittest
from datetime import datetime

from flask import jsonify

from dto.Plano_dto import PlanoDTO
from dto.User_dto import UserDTO
from notification.canais import CanalEmail, CanalEmailBoasVindas, CanalEmailDetalhePlano
from notification.evento import EventoFactory
from service.BubbleAPIService import BubbleAPIService


class TestEventos(unittest.TestCase):


    def test_envia_convite(self):

        user_id = '1712602220283x155804620698294820'
        empresa =  'Empresa teste'
        
        dto = UserDTO(BubbleAPIService())
        user = dto.get_by_id(user_id)
        if not user:
            return jsonify(f"Usuário não encontrado."), 404
        
        evento = EventoFactory().create_evento(EventoFactory().CONVITE, user)
        evento.execute(user, empresa)
        
        self.assertIsNotNone(evento)
        
    def test_responsavel_objetivo(self):

        user_id = '1712602220283x155804620698294820'
        empresa =  'Empresa teste'
        objetivo = 'Objetivo teste'
        
        dto = UserDTO(BubbleAPIService())
        user = dto.get_by_id(user_id)
        if not user:
            return jsonify(f"Usuário não encontrado."), 404
        
        evento = EventoFactory().create_evento(EventoFactory().RESPONSAVEL_OBJETIVO, user)
        payload = {'descricao_objetivo': objetivo, 
                   'nome_empresa': empresa}
        evento.execute(user, payload)
        
        self.assertIsNotNone(evento)



if __name__ == '__main__':
    unittest.main()