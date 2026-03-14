
from dto.Plano_dto import PlanoDTO
from dto.dto import dto
from model.PlanoEstrategico import PlanoEstrategico
from datetime import datetime

class PlanoEstrategicoDTO(dto):

    def __init__(self, service, plano_estrategico=None):
        super().__init__(service)
        self.type = self.service.PLANO_ESTRATEGICO
        self.plano_estrategico = plano_estrategico

    def insert(self, value):
        # Colocando ids no lugar dos objetos, que é o que o Bubble reconhece
        value.plano = value.plano_id
        value.departamentos = value.departamentos_ids
        
        json_value = value.json(
                                by_alias=True,
                                exclude={'id', 'plano_id', 'departamentos_ids', 'created_date', 'created_by', 'modified_date'}
                            )
        return super().insert(json_value)        

    def get_plano(self):

        if not self.plano_estrategico:
            return None
        
        dto = PlanoDTO(self.service)   
        self.plano_estrategico.plano = dto.get_by_id(self.plano_estrategico.plano_id)
        return self.plano_estrategico.plano

    def get_departamentos(self):

        if not self.plano_estrategico:
            return None
        
        dto = PlanoDTO(self.service)   
        self.plano_estrategico.departamentos = []
        for id in self.palno_estrategico.departamentos_ids:
            departamento = dto.get_by_id(id)

            self.plano_estrategico.departamentos.append(departamento)


        return self.plano_estrategico.departamentos
    
    def _map(self, data: dict) -> 'PlanoEstrategico':
        # Mapeamento das listas de IDs
        data['plano_id'] = data.pop('Plano', None)
        data['departamentos_ids'] = data.pop('Departamentos', [])
        
        # Criação do objeto PlanoEstrategico
        self.plano_estrategico = PlanoEstrategico(**data)
        return self.plano_estrategico