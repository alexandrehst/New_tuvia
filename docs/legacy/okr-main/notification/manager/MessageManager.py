from abc import ABC, abstractmethod

class MessageManager(ABC):
    def __init__(self, channel):
        self.channel = channel

    @abstractmethod
    def send(self, message):
        pass

    def receive(self):
        pass

    @abstractmethod
    def process(self, message):
        pass
