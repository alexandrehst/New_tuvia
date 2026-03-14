from dto.KeyResult_dto import KeyResultDTO
from dto.Plano_dto import PlanoDTO
from dto.User_dto import UserDTO
from model.KeyResult import KeyResult
from model.Plan import Plan
from model.User import User
from notification.evento import EventoBoasVindas, EventoDetalhesPlano, ResultadoChaveAtualizado
from service.brevo import BrevoService
from service.mensageria.Chat import Chat
from service.mensageria.channels import TerminalChannel
from service.mensageria.chatPool import ChatPool
import time
from service.KrService import KrService
# usuario = User( "1704820737607x279075830218396450", "João", "1711668726798x119749240222908420")
# chat = Chat(usuario)
# channel = TerminalChannel()

# channel.send(chat.initial_message())

# while True:
#     mensagem = channel.receive()
#     channel.send(chat.execute(mensagem))


user_data = {
        "Modified Date": "2024-04-26T18:18:18.294Z",
        "Created Date": "2024-04-08T18:50:20.283Z",
        "user_signed_up": True,
        "authentication": {
            "email": {
                "email": "alexandrehst@gmail.com",
            }
        },
        "Nome": "Alexandre Torres",
        "Foto": "//26adcd58c1eee8463571ca90068a54e1.cdn.bubble.io/f1712953044872x223553218245704500/foto_perfil_circulo.jpg",
        "telegram_user_id": "6839476266",
        "Status_user": "Ativo",
        "Tipo_user": "Administrador",
        "cliente": "1712601227283x577580915930753700",
        "token": "123456",
        "_id": "1712602220283x155804620698294820"
    }

kr_data = {
        "Modified Date": "2024-04-22T18:53:54.297Z",
        "Created Date": "2024-04-22T18:53:54.297Z",
        "Created By": "admin_user_tuvia---pe_test",
        "Descricao": "Desenvolver e lançar campanha de marketing para o novo produto",
        "Valor": 2,
        "Peso": 1,
        "Tipo_metrica": "Aumentar até",
        "Unidade": "campanhas",
        "Progresso": 0,
        "Progresso_ponderado": 0,
        "Valor Inicial": 0,
        "Valor Atual": 0,
        "Status": "Risco alto",
        "_id": "1713812034297x948796054279026300"
    }

plan_data = {
        "Modified Date": "2024-04-08T18:45:05.469Z",
        "Created Date": "2024-04-08T18:45:05.073Z",
        "Created By": "admin_user_tuvia---pe_test",
        "Data inicio": "2024-04-01T03:00:00.000Z",
        "Data fim": "2024-06-30T03:00:00.000Z",
        "title": "Primeiro plano",
        "Status": "Edição",
        "okr_ids": [
            "1712601904729x568559686608038000",
            "1712601904738x785918977530739300",
            "1712601904747x541132283559190500"
        ],
        "Tipo": "Plano corporativo",
        "cliente": "1712601227283x577580915930753700",
        "id": "1712601905073x492639195394163600"
    }

# plan_data = {
#         "Modified Date": "2024-05-03T18:48:47.596Z",
#         "Created Date": "2024-05-03T18:48:47.596Z",
#         "Created By": "admin_user_tuvia---pe_test",
#         "Data inicio": "2024-05-03T00:00:00.000Z",
#         "Data fim": "2024-08-01T00:00:00.000Z",
#         "Status": "Edição",
#         "title": "Plano inicial",
#         "id": "1714762127596x151110374123079700",
#         "okr_ids": [
#             "1712601904729x568559686608038000",
#             "1712601904738x785918977530739300",
#             "1712601904747x541132283559190500"
#         ]
#     }

autor = User( **user_data )
kr = KeyResult( **kr_data )
plan = Plan( **plan_data )
# evento = EventoBoasVindas(autor)
# evento.execute( autor)

evento = EventoDetalhesPlano(autor)
evento.execute( plan )




