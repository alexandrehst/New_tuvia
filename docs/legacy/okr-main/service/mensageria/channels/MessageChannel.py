from abc import ABC, abstractmethod

class MessageChannel(ABC):
    @abstractmethod
    def send(self, message):
        pass

    @abstractmethod
    def receive(self):
        pass

    @abstractmethod
    def run(self):
        pass