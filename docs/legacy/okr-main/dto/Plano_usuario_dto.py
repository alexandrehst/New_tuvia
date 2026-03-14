from dto.dto import dto
from datetime import datetime

from model.PlanoUsuario import PlanoUsuario
from model.User import User

class PlanoUsuarioDTO(dto):

    def __init__(self, service, plano=None):

        super().__init__(service)
        self.type = self.service.PLANO_USUARIO
        self.plano = plano

    def insert(self, value):
        json_value = value.json(by_alias=True, exclude={'id', 'plano_id', 'usuario_id', 'created_date', 'created_by', 'modified_date'})

        return super().insert(json_value)

    def get_usuarios_por_plano(self, plano_id: str):

        result = self.get_by_constraint([{ "key": "Plano","constraint_type": "equals", "value": plano_id}])

        return result

    def _map(self, data: dict) -> PlanoUsuario:

        data['plano_id'] = data.pop('Plano') # Essa linha é necessária porque o data só está trazendo os ids
        data['usuario_id'] = data.pop('Usuario') # Essa linha é necessária porque o data só está trazendo os ids
        self.objetivo = PlanoUsuario( **data )

        return self.objetivo