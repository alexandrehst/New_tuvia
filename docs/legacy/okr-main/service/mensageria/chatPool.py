from service.mensageria.Chat import Chat
from datetime import datetime
from datetime import timedelta
import asyncio


class ChatPool:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(ChatPool, cls).__new__(cls, *args, **kwargs)
            cls._instance.__initialized = False
        return cls._instance

    def __init__(self):
        if not self.__initialized:
            self.chats = {}
            self.__initialized = True

    def chat(self, user):
        if user.id in self.chats:
            user_chat = self.chats[user.id]['chat']
        else:
            user_chat =  self._add_chat(user)

        # Sempre que um chat é criado, checamos para ver se algum pode ser destruido. Isso ao invés de um chrome job
        asyncio.run(self.__class__.clean_pool())

        return user_chat

    def _add_chat(self, user):
        self.chats[user.id] = {"chat": Chat(user), "creation_date": datetime.now()}
        return self.chats[user.id]['chat']


    def _get_chat(self, chat_id):
        return self.chats.get(chat_id)

    def set_chat(self, user, chat):
        self.chats[user.id] = chat

    @classmethod
    async def clean_pool(cls):
        chats = cls._instance.chats

        current_time = datetime.now()
        for chat_id in list(chats.keys()):  # We use list to avoid runtime error due to change in size of dict during iteration
            if current_time - chats[chat_id]["creation_date"] > timedelta(days=1):
                del chats[chat_id]
