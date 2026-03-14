import logging
from typing import List
from model.User import User
from service.Configurations import Configurations
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

logger = logging.getLogger()

class BrevoService():

    LISTA_CONTATOS = 2 # esse deve ser o ID da lista no Brevo

    def __init__(self):

        #proxy = 'http://proxy.server:3128'

        self.configuration = sib_api_v3_sdk.Configuration()
        self.configuration.api_key['api-key'] = Configurations().brevo
        #self.configuration.proxy = proxy

        self.sender = {"name":"Tuvia","email":"contato@tuvia.ai"}
        self.reply_to = {"email":"replyto@tuvia.ai","name":"Tuvia"}


        self.to = []
        self.params = None
        self.subject = None
        self.templateId = None

    def envia_email(self, users: List[User], mensagem=None, attachment=None):
        self.to = [{"email":user.email,"name": user.nome} for user in users]

        if not all((self.subject, self.templateId, self.to)):
            logger.error("Missing required fields: subject, templateId, or to")
            return None

        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(self.configuration))


        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(to=self.to,
                                                       reply_to=self.reply_to,
                                                       template_id=self.templateId,
                                                       sender=self.sender,
                                                       subject=self.subject,
                                                       params=self.params,
                                                       attachment=attachment)

        try:
            api_response = api_instance.send_transac_email(send_smtp_email)
            logger.info(f'CanalEmail.notifica: {api_response}')

            return api_response
        except ApiException as e:
            logger.error(f"Exception when calling SMTPApi->send_transac_email: {e}\n")
            return None

    def create_user(self, user: User):

        atributos = {'NOME': user.get_nome(),
                     'SOBRENOME':user.get_sobrenome(),
                     'WHATSAPP': user.formata_telefone(),
                     'SMS': user.formata_telefone()  }

        api_instance = sib_api_v3_sdk.ContactsApi(sib_api_v3_sdk.ApiClient(self.configuration))

        create_contact = sib_api_v3_sdk.CreateContact(email=user.email, update_enabled = True , attributes= atributos,  list_ids=[ self.LISTA_CONTATOS])

        try:
            api_response = api_instance.create_contact(create_contact)
            return api_response
        except ApiException as e:
            logger.error("Exception when calling ContactsApi->create_contact: %s\n" % e)
            return None

    def detalhes_plano(self):
        self.params = {'PLANO': 'Plano 1',
                     'OBJETIVOS':[
                            {'TITULO': 'Objetivo 1'},
                            {'TITULO': 'Objetivo 2'},
                            {'TITULO': 'Objetivo 3'}
                        ]
                      }


        self.to = [{"email": 'alexandrehst@gmail.com',"name": 'Alexandre'}]
        self.templateId = 3
        self.subject = "Detalhe do plano"

        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(self.configuration))


        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(to=self.to,
                                                       reply_to=self.reply_to,
                                                       template_id=self.templateId,
                                                       sender=self.sender,
                                                       subject=self.subject,
                                                       params=self.params)
        try:
            api_response = api_instance.send_transac_email(send_smtp_email)
            logger.info(f'CanalEmail.notifica: {api_response}')

            return api_response
        except ApiException as e:
            logger.error(f"Exception when calling SMTPApi->send_transac_email: {e}\n")
            return None