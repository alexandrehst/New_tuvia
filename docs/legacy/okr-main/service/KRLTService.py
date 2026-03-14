from datetime import datetime
import logging
from dto.ResultadoChaveLinhaTendencia_dto import ResultadoChaveLinhaTendenciaDTO
from model.KeyResult import TipoMetrica
from model.ResultadoChaveLinhaTendencia import ResultadoChaveLinhaTendencia
from service.BubbleAPIService import BubbleAPIService

logger = logging.getLogger()

class KRLTService:
    dto = ResultadoChaveLinhaTendenciaDTO(BubbleAPIService())
    
    @classmethod
    def atualiza_linha_tendencia(cls, krs, data_inicio, data_fim):

        for kr in krs:
            krlts = []
            linha_tendencia = cls.get_linha_tendencia(data_inicio, data_fim, kr.valor_inicial, kr.value)
            
            for data, valor in linha_tendencia.items():
                data = datetime.strptime(data, '%Y-%m-%d').date()
 
                krlt = ResultadoChaveLinhaTendencia(**{"Valor": valor,"Resultado Chave": kr})
                krlt.data = data
                krlts.append(krlt)

            krlts_ids = cls.dto.insert_bulk(krlts)
                
            if krlts_ids is None:
                logger.error(f"Erro ao inserir linha tendência")
                return None
            
            for krlt, id in zip(krlts, krlts_ids):
                krlt.id = id
                
        return True
    
    @classmethod
    def get_linha_tendencia(cls, data_inicio, data_fim, valor_inicial, valor_final, numero_pontos=None):

        if numero_pontos is None:
            interval_months = (data_fim.year - data_inicio.year) * 12 + data_fim.month - data_inicio.month
            if interval_months < 6:
                numero_pontos = interval_months
            else:
                numero_pontos = 6

        if numero_pontos < 2:
            return {data_inicio.strftime('%Y-%m-%d'): valor_inicial, data_fim.strftime('%Y-%m-%d'): valor_final}
        
        if not valor_inicial:
            valor_inicial = 0

        step = (valor_final - valor_inicial) / (numero_pontos - 1)
        valores = [valor_inicial + i * step for i in range(numero_pontos)]

        intervalo_datas = [(data_inicio + (data_fim - data_inicio) * i / (numero_pontos - 1)).strftime('%Y-%m-%d') for i in range(numero_pontos)]
        linha_tendencia = {str(data): valor for data, valor in zip(intervalo_datas, valores)}

        return linha_tendencia    
    
    @classmethod
    def get_by_kr(cls, kr, so_ultimo=True):
        descending = False
        if kr.tipo_metrica == TipoMetrica.AUMENTAR:
            descending = True
        limit = 1 if so_ultimo else None
        krlts =  cls.dto.get_krlt_by_kr(kr.id, descending=descending, limit=limit)
        if len(krlts) == 0:
            return None
        
        if so_ultimo:  
            return krlts[0]
        
        return krlts

    @classmethod
    def delete_krlt_by_kr(cls, kr):
        krlts =  cls.dto.get_krlt_by_kr(kr.id, descending=True, limit=None)
        if len(krlts) == 0:
            return None
        for krlt in krlts:
            cls.dto.delete(krlt.id)
        return krlts

    # get ultimo valor
    # verifica se é igual ao valor final
    # se for, não faz nada
    # se não, apaga e faz novamente
    # se não existir faz