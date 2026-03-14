import base64
import os
from typing import List
from flask import app
from model.Plan import Plan
from model.User import User
from service.Configurations import Configurations

from service.KrService import KrService
from service.OkrService import OkrService
from service.PlanService import PlanService
from service.UserService import UserService
from service.brevo import BrevoService
import logging

logger = logging.getLogger()

class Canal:

    # O número deve corresponder ao modelo do Brevo
    BOAS_VINDAS = 2
    DETALHE_PLANO = 3
    LP_PLANEJAMENTO = 4
    CONVITE = 5
    RESPONSAVEL_OBJETIVO = 7


    def __init__(self, modelo):
        self.modelo = modelo

    def notifica(self, users: List[User], mensagem=None):
        ...

    def __str__(self):
        return self.nome

class CanalNotificacao(Canal):

    def notifica(self, users, mensagem=None):
        for user in users:
            print(f'Notificando {user.nome}: {mensagem}')


        super().notifica(users, mensagem)

class CanalEmail(Canal):

    @classmethod
    def create_canal(cls, type, service = BrevoService()):
        if type == cls.BOAS_VINDAS:
            return CanalEmailBoasVindas(type, service)
        elif type == cls.DETALHE_PLANO:
            return CanalEmailDetalhePlano(type, service)
        elif type == cls.LP_PLANEJAMENTO:
            return CanalEmailLPPlanejamento(type, service)
        elif type == cls.CONVITE:
            return CanalEmailConviteUsuario(type, service)
        elif type == cls.RESPONSAVEL_OBJETIVO:
            return CanalResponsavelObjetivo(type, service)

        return None

    def __init__(self, modelo, service = BrevoService()):
        # Configurações comuns a todos os e-mails a serem enviados
        super().__init__(modelo)  # o modelo deve ser exatamente o template no Brevo

        self.email_service = service
        self.email_service.templateId = modelo   #### Aqui é o template do Brevo
        self.modelo = modelo


    def notifica(self, users, mensagem=None, attachment=None):

        users = self.checa_autorizacao(users)

        resposta = self.email_service.envia_email(users, mensagem, attachment)

        return resposta


class CanalEmailBoasVindas(CanalEmail):

    def notifica(self, users, mensagem=None):
        self.email_service.subject = "Seja bem vindo"

        return super().notifica(users, mensagem)

    def checa_autorizacao(self, users):
        return users

class CanalEmailDetalhePlano(CanalEmail):

    def checa_autorizacao(self, users):
        authorized_users = []
        for user in users:
            if user.atualizacao_email_plano:
                authorized_users.append(user)
        return authorized_users

    def notifica(self, users, plan):
        if not isinstance(plan, Plan):
            logger.error( "Email detalhe plano: mensagem recebida não é um plano")
            return None

        self.email_service.subject = "Aqui está o acompanhamento do seu plano estratégico"

        self.email_service.params = {"plano": plan.title,
                                    "termino": plan.data_fim,
                                    "link": f'{Configurations().base_api_address}objetivo/{plan.id}'}

        objetivos = OkrService().get_objetivos(plan.okr_ids)

        self.email_service.params['objetivos'] = []

        for objetivo in objetivos:
            obj_dict = {"titulo": objetivo.titulo,
                      "progresso": objetivo.progresso}

            if  objetivo.responsaveis_ids:
                responsaveis = UserService().get_users( objetivo.responsaveis_ids)
                names_string = ", ".join([user.nome for user in responsaveis])
            else:
                names_string = "Não existem responsáveis"


            obj_dict["responsaveis"] = names_string

            krs = KrService().get_resultadoschave(objetivo.key_results_ids)
            resultadoschave_list = []

            for kr in krs:
                kr_dict = {
                    "descricao": kr.descricao,
                    "progresso": kr.progresso
                }
                resultadoschave_list.append(kr_dict)

            obj_dict["resultadoschave"] = resultadoschave_list

            self.email_service.params['objetivos'].append( obj_dict )

        return super().notifica(users, plan)


class CanalEmailLPPlanejamento(CanalEmail):

    def notifica(self, users, file_path):
        self.email_service.subject = "Aqui está seu planejamento estratégico"

        # Ler o conteúdo do arquivo
        with open(file_path, 'rb') as f:
            file_content = f.read()

        # Codificar o conteúdo do arquivo em base64
        file_content_base64 = base64.b64encode(file_content).decode('utf-8')

        # Configurar o payload para a API do Brevo
        attachment = [{
                        "content": file_content_base64,
                        "name": os.path.basename(file_path)
                    }]


        return super().notifica(users, mensagem=None, attachment=attachment)

    def checa_autorizacao(self, users):
        return users

    def __init__(self, modelo, service = BrevoService()):
        super().__init__(modelo, service)

class CanalEmailConviteUsuario(CanalEmail):

    def notifica(self, users, mensagem): # mensagem é o nome da empresa
        self.email_service.subject = f"Convite - Plano estratégico {mensagem}"

        self.email_service.params = {"empresa": mensagem}

        return super().notifica(users, mensagem=None)

    def checa_autorizacao(self, users):
        return users

    def __init__(self, modelo, service = BrevoService()):
        super().__init__(modelo, service)
        
class CanalResponsavelObjetivo(CanalEmail):

    def notifica(self, users, mensagem): 
        # mensagem é a descricao do objetivo
        self.email_service.subject = f'Agora você é responsável por um objetivo'

        self.email_service.params = {"objetivo": mensagem}

        return super().notifica(users, mensagem=None)

    def checa_autorizacao(self, users):
        return users

    def __init__(self, modelo, service = BrevoService()):
        super().__init__(modelo, service)
