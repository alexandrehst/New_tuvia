import logging

from dto.KeyResult_dto import KeyResultDTO
from model.KeyResult import TipoMetrica
from service.BubbleAPIService import BubbleAPIService
from service.KRLTService import KRLTService


logger = logging.getLogger()

class Ctrl_KRLT:

    def atualiza_linha_tendencia(self, kr_id, data_inicio, data_fim):
        logger.info(f"Atualizando linha de tendência para KR {kr_id} no período de {data_inicio} a {data_fim}")
        dto = KeyResultDTO(BubbleAPIService())
        kr = dto.get_by_id(kr_id)
        if not kr:
            logger.error(f"Key Result {kr_id} não encontrado")
            return False
        
        ultimo_krlt = KRLTService.get_by_kr(kr, so_ultimo=True)

        if not ultimo_krlt: #Criar a linha de tendencia
            result = KRLTService.atualiza_linha_tendencia([kr], data_inicio, data_fim)
            return result
            
        if  kr.value != ultimo_krlt.valor:  # KR mudou e a LT está desatualizada
            KRLTService.delete_krlt_by_kr(kr)
            result = KRLTService.atualiza_linha_tendencia([kr], data_inicio, data_fim)
            return result

        return True