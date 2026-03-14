from dto.KeyResult_dto import KeyResultDTO
from dto.User_dto import UserDTO
from dto.dto import dto
from datetime import datetime

from model.ResultadoChaveLinhaTendencia import ResultadoChaveLinhaTendencia

class ResultadoChaveLinhaTendenciaDTO(dto):

    def __init__(self, service, resultado_chave_linha_tendendia=None):

        super().__init__(service)
        self.type = self.service.RESULTADO_CHAVE_LINHA_TENDENCIA
        self.resultado_chave_linha_tendendia = resultado_chave_linha_tendendia

    def insert(self, value):
        # Colocando ids no lugar dos objetos, que é o que o Bubble reconhece
        value.resultado_chave = value.resultado_chave.id
        
        json_value = value.json(
                                by_alias=True,
                                exclude={'id', 'resultado_chave_id', 'responsaveis_ids', 'created_date', 'created_by', 'modified_date'}
                            )
        return super().insert(json_value)
    
    def insert_bulk(self, values):
        json_values = ''
        campos_excluir = {'id', 'resultado_chave_id', 'created_date', 'created_by', 'modified_date', 'key_results_ids', 'responsaveis_ids'}
        for value in values:
            value.resultado_chave = value.resultado_chave.id
            json_values += value.json(by_alias=True, exclude=campos_excluir) + '\n'
        return super().insert_bulk(json_values)

    def _map(self, data: dict) -> 'ResultadoChaveLinhaTendencia':

        data['resultado_chave_id'] = data.pop('Resultado Chave', None) # Essa linha é necessária porque o data só está trazendo os ids, e Resultados-Chave é uma lista de objetos KeyResult.
        self.krlt = ResultadoChaveLinhaTendencia( **data )

        return self.krlt
    
        
    def get_krlt_by_kr(self, kr_id: str, descending=True, limit=None):
        constraints = [
            { "key": "resultadochave",
             "constraint_type": "equals",
            "value": kr_id
            }
        ]

        result = self.get_by_constraint(constraint=constraints, sort_field="valor", descending=True, limit=limit)

        return result
    