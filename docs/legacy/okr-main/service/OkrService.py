import json
import re
from dto.Objetivo_dto import ObjetivoDTO
from model.Okr import Okr
from model.KeyResult import KeyResult
from service.BubbleAPIService import BubbleAPIService
import logging
from copy import deepcopy

logger = logging.getLogger()

class OkrService:

    dto = ObjetivoDTO(BubbleAPIService())

    @classmethod
    def create_from_answer(cls, answer):
        objetivo = answer['Objetivo']

        if 'Sequence' not in objetivo:
            objetivo['Sequence'] = 0

        try:
            objective = Okr(**objetivo)
        except Exception as e:
            logger.error(f'Error creating objective: {e}')
            return None

        logger.info( f'--- Create from answer Objective\n{objective}')
        return objective

    @classmethod
    def create_from_dict(cls, data):
        key_results = []
        for kr in data['key_results']:
            key_results.append(KeyResult.create_from_dict(kr))
        return Okr(id=data['id'], title=data['title'], key_results=key_results)


    @classmethod
    def get_objetivos(cls, ids):

        result = cls.dto.get_by_ids(ids)

        if result is None:
            logger.error(f"Erro ao buscar objetivos")
            return None

        return result

    @classmethod
    def get_objetivos_user_id(cls, user_id):
        result = cls.dto.get_objetivos_by_user(user_id)

        if result is None:
            logger.error(f"Erro ao buscar objetivos por user id")
            return None

        return result

    @classmethod
    def insere_bulk(cls, objetivos):
        objetivos = deepcopy(objetivos)
        # retirar os resultados chave. Os IDs devem estar no objeto e os KR devem ser inseridos separadamente
        for ob in objetivos:
            ob.key_results = ob.key_results_ids

        ids = cls.dto.insert_bulk(objetivos)

        if ids is None:
            logger.error(f"Erro ao inserir objetivos")

        return ids

    @classmethod
    def insere(cls, objetivo):

        ids = cls.dto.insert(objetivo)

        if ids is None:
            logger.error(f"Erro ao inserir objetivo")
            return None

        return ids
    
    @classmethod
    def get_responsaveis(cls, objetivo):
        cls.dto.objetivo = objetivo
        return cls.dto.get_responsaveis()


    @classmethod
    def delete(cls, objetivo_id):
        
        return cls.dto.delete(objetivo_id)




