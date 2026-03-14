class UsersCache:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(UsersCache, cls).__new__(cls)
            cls._instance.__initialized = False
        return cls._instance

    def __init__(self):
        if self.__initialized: return
        self.cache = {}
        self.__initialized = True

    def add_user(self, broker_user_id, user_id):
        self.cache[broker_user_id] = user_id

    def get_user(self, broker_user_id):
        return self.cache.get(broker_user_id)

    def remove_user(self, user_id):
        if user_id in self.cache:
            del self.cache[user_id]