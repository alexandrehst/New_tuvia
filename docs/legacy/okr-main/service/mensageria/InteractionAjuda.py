from service.GPTService import GPTService
from service.KrService import KrService
from service.OkrService import OkrService
from service.mensageria.Interaction import Interaction


class InteractionAjuda(Interaction):
    def process(self, data):
        mensagem = "Eu posso te ajudar a ver seus planos, seus objetivos e atualizar os resultados chave. "
        mensagem += "Me diga o que deseja fazer."

        return mensagem

