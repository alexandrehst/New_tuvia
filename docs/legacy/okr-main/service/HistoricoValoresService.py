# Plan class, with the following attributes: okrs - list of Okr objects, active - boolean, version - numeric
#
import copy
from datetime import datetime, timedelta
from dto.HistoricoValoresResultado_DTO import HistoricoValoresResultadoChaveDTO
from dto.Objetivo_dto import ObjetivoDTO
from dto.Plano_dto import PlanoDTO
from model.Plan import Plan
from model.Okr import Okr
from service.BubbleAPIService import BubbleAPIService
from service.OkrService import OkrService

import logging

logger = logging.getLogger()

class HistoricoValoresService:

    service = BubbleAPIService()
    dto = HistoricoValoresResultadoChaveDTO( service )

    @classmethod
    def get_historicos_por_kr(cls, kr):

        historicos = cls.dto.get_historico_by_kr(kr.id)

        if historicos is None:
            logger.error('Erro ao buscar historicos por kr')
            return None
        
        return historicos
    
