# DTO para Departamento
from dto.dto import dto
from model.Departamento import Departamento


class DepartamentoDTO(dto):

    def __init__(self, service, departamento=None):
        super().__init__(service)
        self.type = self.service.DEPARTAMENTO
        self.departamento = departamento

    def _map(self, data: dict) -> 'Departamento':
        self.departamento = Departamento(**data)
        return self.departamento