from datetime import datetime
from controller.ctrl_planos import Ctrl_Planos
from dto.KeyResult_dto import KeyResultDTO
from dto.Objetivo_dto import ObjetivoDTO
from dto.Plano_dto import PlanoDTO
from model.Okr import Okr
from model.Plan import Plan
from notification.evento import EventoFactory
from service import KRLTService
from service.BubbleAPIService import BubbleAPIService
from service.GPTService import GPTService
from service.KrService import KrService
from service.OkrService import OkrService
from service.PlanGenerator import PlanGenerator
from service.PlanService import PlanService
import logging

from service.PlanoUsuarioService import PlanoUsuarioService
from service.UserService import UserService

logger = logging.getLogger()


class Ctrl_Objetivo:

    # array contento o par id e mensagens do chatgpt para preservação do contexto
    plan_generator = PlanGenerator(model=GPTService().MODELO_MAIS_PODEROSO, temperature=1)

    @classmethod
    def novo_objetivo_ia(cls, id ):

        logger.info(f"Criar objetivo IA. Plano {id}")
        dto =  PlanoDTO(BubbleAPIService())
        
        plano = dto.get_by_id(id)
        if not plano:
            logger.error(f"Plano não encontrado. {id}")
            return None
        
        dto.plano = plano
        objetivos = dto.get_okrs()
        if not objetivos:
            logger.error(f"Objetivos não encontrados. {id}")
            return None


        value_system = '''Atue como um especialista em planejamento estratégico.
                        Gere um objetivo estratégicos no formato OKR. O objetivo deve ter de 3 a 5 resultados chave 
                        Como insumo para a geração utilize os objetivos atuais.
            '''

        value_user = f'Objetivos atuais: {", ".join([objetivo.titulo for objetivo in objetivos])}'


        messages = [
                        {'role': 'system', 'content': value_system},
                        {'role': 'user', 'content': value_user}
                    ]

        chatGPT_answer = PlanGenerator().generate_objective( messages)
        okr = OkrService.create_from_answer( chatGPT_answer['message'])

        if not okr:
            logger.error(f"Objetivo não gerado. {id}")
            return None
        
        if not okr.key_results:
            logger.error(f"Resultados chave não gerados. {id}")
            return None
        
        okr_ids = Ctrl_Planos().insere_objetivos( [okr], plano.data_inicio, plano.data_fim)
        
        ## TODO: Tem  que dar update no plano para incluir os objetivos

        return okr_ids