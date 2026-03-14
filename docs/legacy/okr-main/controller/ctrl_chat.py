from dto.User_dto import UserDTO
from model.User import User
from service.BubbleAPIService import BubbleAPIService
from service.mensageria.chatPool import ChatPool
from service.mensageria.usersCache import UsersCache

import logging

logger = logging.getLogger(__name__)

class Ctrl_Chat:

    @classmethod
    def check_user_by_token(cls, token, broker_user_id):
        dto = UserDTO(BubbleAPIService())
        user = dto.get_by_constraint('token', token)

        if not user:
            logger.error(f"Token {token} não encontrado")
            return None

        user = user[0]     # retorna uma lista com um único elemento

        resp = BubbleAPIService().set_user_telegram_id(user.id, broker_user_id)

        if resp['error']:
            logger
            return None

        user.telegram_user_id = broker_user_id

        return user


    @classmethod
    def check_user_by_telegram_id(cls, broker_user_id):
        dto = UserDTO(BubbleAPIService())
        user = dto.get_by_constraint('telegram_user_id', broker_user_id)

        if not user:
            logger.error(f"User com id do telegram {broker_user_id} não encontrado")
            return None

        return user[0]     # retorna uma lista com um único elemento

    @classmethod
    def chat(cls, broker_user_id, message):
        # Import the Chat class where it is defined
        USUARIO_NAO_ENCONTRADO = "Desculpe, mas não consegui te identificar. Você recebeu um token na aplicação? Veja no seu perfil, na aba 'Comunicação'."

        cache = UsersCache()
        chatPool = ChatPool()
        chat = None
        resposta = None

        logger.info(' Novo chat --------------')

        user = cache.get_user(broker_user_id) #verifica se o user_id está no cache
        if user is None:
            logger.info( 'Não encontrado no cache' )
            # verifica se já existe usuário com o broker_user_id
            user = cls.check_user_by_telegram_id(broker_user_id)
            if user:
                logger.info( 'Encontrado pelo broker_id' )
                # se sim, adiciona o user no cache e envia mensagem
                cache.add_user(broker_user_id, user)
                chat = chatPool.chat( user )
                resposta = chat.execute( message)

                debug_msg = f"ChatPool: {len(chatPool.chats)} \n"
                debug_msg += f"Chat: {chat.currentIntent} "
                logger.info(debug_msg)

            else:
                if len(message) == 6: # verifica se a mensagem é um token válido
                    user = cls.check_user_by_token(message, broker_user_id)
                    if user is not None:
                        cache.add_user(broker_user_id, user)
                        chat = chatPool.chat( user )
                        resposta = chat.initial_message()
                    else:
                        resposta = USUARIO_NAO_ENCONTRADO
                else:
                    resposta = USUARIO_NAO_ENCONTRADO
        else:
            #dto = UserDTO(BubbleAPIService())
            #user = dto.get_by_id(user_id)
            #if not user:
            #    logger.error(f"User com id {user_id} não encontrado")
            #    resposta = USUARIO_NAO_ENCONTRADO
            #else:

            # Codigo para debug
            chat = chatPool.chat( user )
            debug_msg = f"Fluxo da mensagem: \nUser: {user.id} \n"
            debug_msg += f"ChatPool: {len(chatPool.chats)} \n"
            debug_msg += f"Chat: {chat.currentIntent} "
            logger.info(debug_msg)

            resposta = chat.execute( message)
            chatPool.set_chat( user, chat )

        return resposta


# Ao receber uma mensagem
#    verifica se o user_id está no cache
#       se não
#          verifica se já existe usuário com o user_id
#             se sim, adiciona o user_id no cache e envia mensagem
#             se não, verifica se a mensagem é um token válido
#               se sim, manda para o backend o token e o user_id.
#                       se o backend retornar sucesso, adiciona o user_id no cache, e dar mensagem de sucesso
#                       se o backend retornar insucesso, manda mensagem de insucesso
#               se não, manda mensagem de insucesso
#       se sim, pega o chat_id e envia a mensagem