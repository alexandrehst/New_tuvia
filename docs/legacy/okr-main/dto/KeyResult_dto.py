from dto.dto import dto
from model.KeyResult import KeyResult
from datetime import datetime
import logging

logger = logging.getLogger()

class KeyResultDTO(dto):
    """
    Represents a Key Result Data Transfer Object (DTO).
    """

    def __init__(self, service, keyresult=None):
        """
        Initializes a new instance of the KeyResultDTO class.

        Args:
            service: The service object used for retrieving data.
            keyresult: The key result object.

        """
        super().__init__(service)
        self.type = self.service.RESULTADO_CHAVE
        self.keyresult = keyresult

    def update_risco(self):
        """
        Updates the risk of a key result.
        Requires set the self.keyresult attribute.

        Returns:
            A boolean indicating whether the operation was successful.

        """
        result = self.service.update_generic(self.type, self.keyresult.id, 'Status', self.keyresult.status )

        if result['error']:
            return None

        return self.keyresult

    def set_valor_atual(self, valor, comentario:str):
        """
        Updates the valor of a key result.
        Requires set the self.keyresult attribute.
        Comentario will be setted in Comentarios_Resultado, loggin the change.

        Returns:
            Updated key result object.

        """
        #result = self.service.update_generic(self.type, self.keyresult.id, 'Valor', self.keyresult.valor_atual )


        self.service.update_generic( self.service.RESULTADO_CHAVE, id=self.keyresult.id, key='valor_atual', valor=self.keyresult.valor_atual)


        return self.keyresult
    
    def set_falta_atualizar(self, valor: bool):
        if not self.keyresult:
            return None

        self.service.update_generic( self.service.RESULTADO_CHAVE, id=self.keyresult.id, key='Falta atualizar', valor=valor)

        return self.keyresult

    def atualiza_valor_inicial(self, id):
        """
        Updates the initial value of a key result.
        Requires set the self.keyresult attribute.

        Returns:
            Updated key result object.

        """
        result = self.service.atualiza_resultado_chave_inicial(id)

        if result['error']:
            logger.error(f"Erro ao atualizar valor inicial do resultado chave {id}")

        return result['error']
    
    def insert_bulk(self, values):
        json_values = ''
        campos_excluir = {'id', 'created_date', 'created_by', 'modified_date'}
        for value in values:
            json_values += value.json(by_alias=True, exclude=campos_excluir) + '\n'
        return super().insert_bulk(json_values)



    def _map(self, data):
        """
        Maps a dictionary to a KeyResult object.

        Args:
            data: The dictionary to be mapped.

        Returns:
            A KeyResult object.

        """
        self.keyresult = KeyResult( **data )

        return self.keyresult
