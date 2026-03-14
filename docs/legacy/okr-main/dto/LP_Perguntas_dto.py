import json
from dto.dto import dto
from model.LP_Perguntas_Plano import LP_Perguntas_Plano
from model.Okr import Okr
from datetime import datetime

from model.User import User

class LP_Perguntas_dto(dto):

    def __init__(self, service, pergunta=None):

        super().__init__(service)
        self.type = self.service.PERGUNTAS_PLANO
        self.pergunta = pergunta


    def _map(self, data: dict) -> 'LP_Perguntas_Plano':
        self.pergunta = LP_Perguntas_Plano( **data )

        return self.pergunta

    def insert_bulk(self, values):
        json_values = ''
        campos_excluir = {'id', 'created_date', 'created_by', 'modified_date'}
        for value in values:

            data = json.loads(value.json(by_alias=True, exclude=campos_excluir))
            data['Tipo_Plano'] = data['Tipo_Plano']['_id']

            json_values += json.dumps(data) + '\n'

        result = self.service.insert_bulk(self.type, json_values)

        if result['error']:
            return None

        return result['ids']