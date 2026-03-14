from dto.KeyResult_dto import KeyResultDTO
from dto.User_dto import UserDTO
from dto.dto import dto
from model.Okr import Okr
from datetime import datetime

class ObjetivoDTO(dto):

    def __init__(self, service, objetivo=None):

        super().__init__(service)
        self.type = self.service.OBJETIVO
        self.objetivo = objetivo

    def get_objetivos_com_responsaveis(self):

        return self.get_by_constraint([{ "key": "Responsaveis","constraint_type": "not empty"}])

    def get_objetivos_by_user(self, user_id:str):
        constraints = [{ "key": "Responsaveis",  "constraint_type": "contains","value": user_id}]

        return self.get_by_constraint(constraints)

    def get_objetivos_by_key_result(self, key_result_id:str):
        constraints = [{ "key": "Resultados-Chave",  "constraint_type": "contains","value": key_result_id}]

        return self.get_by_constraint(constraints)
    
    def get_key_results(self):
        """
        Retrieves all key results. Lazy loading.

        The objective must be set in the DTO before calling this method.

        Returns:
            A list of KeyResult objects.
        """

        if not self.objetivo:
            return None
        
        if not self.objetivo.key_results_ids:
            return None
        
        dto_key_result = KeyResultDTO(self.service)   
        for id in self.objetivo.key_results_ids:
            self.objetivo.key_results.append(dto_key_result.get_by_id(id))

        return self.objetivo.key_results

    def insert(self, value):
        # Colocando ids no lugar dos objetos, que é o que o Bubble reconhece
        value.key_results = value.key_results_ids
        value.responsaveis = value.responsaveis_ids
        
        json_value = value.json(
                                by_alias=True,
                                exclude={'id', 'key_results_ids', 'responsaveis_ids', 'created_date', 'created_by', 'modified_date'}
                            )
        return super().insert(json_value)
    
    def insert_bulk(self, values):
        json_values = ''
        campos_excluir = {'id', 'created_date', 'created_by', 'modified_date', 'key_results_ids', 'responsaveis_ids'}
        for value in values:
            json_values += value.json(by_alias=True, exclude=campos_excluir) + '\n'
        return super().insert_bulk(json_values)

    
    def get_responsaveis(self):
        """
        Lazy load for 'responsaveis' attribute of 'objetivo' based on their IDs.
        Returns:
            list: A list of user objects if 'objetivo' is not None, otherwise None.
        """

        if not self.objetivo:
            return None
        
        dto = UserDTO(self.service)   
        self.objetivo.responsaveis = []
        for id in self.objetivo.responsaveis_ids:
            user = dto.get_by_id(id)

            self.objetivo.responsaveis.append(user)


        return self.objetivo.responsaveis
    
    def get_historico_atualizacao(self, kr_id: str):
        constraints = [
            { "key": "resultado_chave",
             "constraint_type": "equals",
            "value": kr_id
            }
        ]

        result = self.get_by_constraint(constraint=constraints)

        return result

            
    def _map(self, data: dict) -> 'Okr':

        data['key_results_ids'] = data.pop('Resultados-Chave', None) # Essa linha é necessária porque o data só está trazendo os ids, e Resultados-Chave é uma lista de objetos KeyResult.
        data['responsaveis_ids'] = data.pop('Responsaveis', None) # Essa linha é necessária porque o data só está trazendo os ids, e Responsaveis é uma lista de objetos User.
        self.objetivo = Okr( **data )
        self.objetivo.key_results = []

        return self.objetivo
    