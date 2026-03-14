from datetime import datetime, timedelta, timezone

from flask import jsonify
from model.Plan import FrequenciaAtualizacao
from service.BubbleAPIService import BubbleAPIService

import logging

from service.HistoricoValoresService import HistoricoValoresService
from service.KrService import KrService
from service.PlanService import PlanService

logger = logging.getLogger()

class Ctrl_Batch:
    
   def atualiza_status_kr(self):

        planos = PlanService.get_plan_publicados()
        if not planos:
            logger.error("Nenhum plano encontrado")
            return jsonify("Nenhum plano encontrado"), 404
   

        for plano in planos:
            
            if plano.frequencia_atualizacao == FrequenciaAtualizacao.UMA_SEMANA:
                delta = timedelta(weeks=1)
            elif plano.frequencia_atualizacao == FrequenciaAtualizacao.DUAS_SEMANAS:
                delta = timedelta(weeks=2)
            elif plano.frequencia_atualizacao == FrequenciaAtualizacao.UM_MES:
                delta = timedelta(days=30)
            elif plano.frequencia_atualizacao == FrequenciaAtualizacao.TRES_MESES:
                delta = timedelta(days=90)
            else:
                logger.error(f"Frequência de atualização desconhecida: {plano.id, plano.frequencia_atualizacao}")
                continue

            limite_atualizacao = datetime.now(tz=timezone.utc) - delta
            
            objetivos = PlanService.get_okr(plano, carrega_key_results=True)   
            if not objetivos:
                logger.error(f"Plano {plano.id} não possui objetivos")
                continue
            
            for objetivo in objetivos:
                if not objetivo.key_results:
                    logger.error(f"Objetivo {objetivo.id} não possui KeyResults")
                    continue
                
                for kr in objetivo.key_results:
                    historicos = HistoricoValoresService().get_historicos_por_kr(kr)
                    if not historicos:
                        falta_atualizar = True
                    else:
                        historico = historicos[0]
                        falta_atualizar = historico.data_do_registro < limite_atualizacao
                        
                    KrService().set_falta_atualizar(kr, falta_atualizar)
                    
        return True
         
# Plano 1732589391381x973099337120140800


# obj 1732589390880x793561560199462300, 1732589390886x315371962145059040
''' 

1732589371728x126459768323901710
1732589371735x583337595348907900
1732589371756x966154998129585400
1732589371757x537526821957673400
1732589371758x184528875676850400

1732589375506x729497618402033000
1732589375507x746023515239206800
1732589375509x685283482519423000
1732589375510x500738291257285300
1732589375511x788714541351389600
'''