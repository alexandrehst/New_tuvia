from model.KeyResult import KeyResult
import logging

from model.Okr import Okr

logger = logging.getLogger()

class dto:

    def __init__(self, service):
        self.service = service
        self.type = None

    def get_by_id(self, id):
        """
        Retrieves a KeyResultDTO object by its ID.

        Args:
            id: The ID of the key result.

        Returns:
            A KeyResultDTO object if found, None otherwise.

        """
        result = self.service.get_generic_by_id(id, self.type)

        if result['error']:
            logger.error(f"Erro ao buscar {self.type} por id. {result['message']}")
            return None
        return self._map(result[self.type])

    def get_by_ids(self, ids):
        """
        Retrieves a list of KeyResultDTO objects by their IDs.

        Args:
            ids: The IDs of the key results.

        Returns:
            A list of KeyResultDTO objects.

        """
        result = self.service.get_generic_by_id_list(ids, self.type)

        if result['error']:
            return None

        return [self._map(data) for data in result['valores']]

    def get_by_constraint(self, constraint, sort_field=None, descending=None, limit=None):
        """
        Retrieves a KeyResultDTO object by a constraint.

        Args:
            constraint: The constraint to be used in the query.

        Returns:
            A KeyResultDTO object if found, None otherwise.

        """
        result = self.service.get_generic_by_constraint(self.type, constraint, sort_field, descending, limit)

        if result['error']:
            return None
        return [self._map(data) for data in result[self.type]]

    def insert(self, value):
        # value deve ser um Json válido tratado pelo método do DTO específico, como por exemplo em PlanoDTO:
        #json_value = value.json(by_alias=True, exclude={'id', 'created_date', 'created_by', 'modified_date'})
        result = self.service.insert(self.type, value)

        if result['error']:
            logger.error(f"Erro na gravaçao {self.type}. {result['message']}")
            return None

        return result['ids']

    def delete(self, id):
        result = self.service.delete(self.type, id)

        if result['error']:
            logger.error(f"Erro ao deletar {self.type}. {result['message']}")
            return None
        return True
    
    def insert_bulk(self, values):
        # value deve ser um Json válido tratado pelo método do DTO específico, como por exemplo em PlanoDTO:
        result = self.service.insert_bulk(self.type, values)

        if result['error']:
            logger.error(f"Erro na gravaçao bulk {self.type}. {result['message']}")
            return None
        return result['ids']
