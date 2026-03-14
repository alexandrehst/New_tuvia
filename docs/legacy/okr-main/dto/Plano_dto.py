from dto.Objetivo_dto import ObjetivoDTO
from dto.dto import dto
from model.Plan import Plan
from datetime import datetime

class PlanoDTO(dto):

    def __init__(self, service, plano=None):

        super().__init__(service)
        self.type = self.service.PLANO
        self.plano = plano

    def get_planos_publicados(self):
        """
        Retrieves all published plans.

        Returns:
            A list of Plan objects.
        """
        result = self.get_by_constraint([{ "key": "Status","constraint_type": "equals","value": "Publicado"}])

        return result

    def get_plans_by_client(self, client_id:str):
        constraints = [
            { "key": "cliente",
             "constraint_type": "equals",
            "value": client_id
            }
        ]

        result = self.get_by_constraint(constraint=constraints)

        return result
    
    def get_okrs(self, carrega_key_results=False):
        """
        Retrieves all OKRs. Lazy loading.

        The plan must be set in the DTO before calling this method.

        Returns:
            A list of OKR objects.
        """

        if not self.plano:
            return None


        if not self.plano.okr_ids:
            return None
        
        dto_okr = ObjetivoDTO(self.service)   
        for id in self.plano.okr_ids:
            okr = dto_okr.get_by_id(id)

            if carrega_key_results:
                dto_okr.objetivo = okr
                okr.key_results = dto_okr.get_key_results()

            self.plano.okrs.append(okr)


        return self.plano.okrs

    def insert(self, value):
        value.okrs = value.okr_ids

        json_value = value.json(by_alias=True, exclude={'id', 'okr_ids', 'plano_pai_id', 'created_date', 'created_by', 'modified_date'})

        return super().insert(json_value)

    def _map(self, data: dict) -> 'Plan':
        data['okr_ids'] = data.pop('Objetivos', None)
        data['plano_pai_id'] = data.pop('Plano-pai', None)

        self.plano =  Plan(**data)
        self.plano.okrs = [] # Lazy loading

        return self.plano
    