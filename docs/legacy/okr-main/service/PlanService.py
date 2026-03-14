# Plan class, with the following attributes: okrs - list of Okr objects, active - boolean, version - numeric
#
import copy
from datetime import datetime, timedelta
from dto.Objetivo_dto import ObjetivoDTO
from dto.Plano_dto import PlanoDTO
from model.Plan import Plan
from model.Okr import Okr
from service.BubbleAPIService import BubbleAPIService
from service.OkrService import OkrService

import logging

logger = logging.getLogger()

class PlanService:

    service = BubbleAPIService()
    dto = PlanoDTO( service )

    @classmethod
    def create_from_answer(cls, title, business_info, improvement_needed, success_indicator, resposta):

        objectives = []
        i = 0
        for obj_data in resposta['Objectives']:
            try:
                objective = Okr(**obj_data)
            except Exception as e:
                logger.error(f'Error creating objective: {e}')
                continue  # or return None, depending on your desired behavior
            objectives.append(objective)

        try:
            plan = Plan(id = '1', title=title, business_info=business_info, improvement_needed=improvement_needed, success_indicator=success_indicator, okrs=objectives)
        except Exception as e:
            logger.error(f'Error creating plan: {e}')
            return None

        logger.info( f'\n\n-----Create from answer Plan\n{plan}')

        return plan

    @classmethod
    def create_from_dict(cls, plan_dict):
        okrs = []
        for okr in plan_dict['okrs']:
            okrs.append(Okr.create_from_dict(okr))

        plan = Plan(plan_dict['title'], plan_dict['business_info'], plan_dict['improvement_needed'], plan_dict['success_indicator'], okrs)

        return plan

    @classmethod
    def get_plans(cls, cliente):

        plans = cls.dto.get_plans_by_client(cliente)

        if plans is None:
            logger.error('Erro ao buscar planos')
            return None

        return plans

    @classmethod
    def get_plan_publicados(cls):

        plans = cls.dto.get_planos_publicados()

        if plans is None:
            logger.error('Erro ao buscar planos publicados')
            return None

        return plans


        # pega todos os planos publicados
        # pega os responsaveis pelos planos. coloca no dict
    @classmethod        
    def get_okr(cls, plano, carrega_key_results=False):
        """
        Retrieves all OKRs. Lazy loading.

        The plan must be set in the DTO before calling this method.

        Returns:
            A list of OKR objects.
        """

        if not plano:
            return None
        
        cls.dto.plano = plano
        return cls.dto.get_okrs(carrega_key_results)


    @classmethod
    def insere_plano_ia(cls, plan: Plan):
        plan = copy.deepcopy(plan)

        plan.okrs = plan.okr_ids
        if plan.plano_pai and isinstance(plan.plano_pai, Plan):
            plan.plano_pai = plan.plano_pai.id
            
        # TODO: Retirei as linhas abaixo pois o model não aceita a criação do Plan sem os campos obrigatórios. Verificar se está funcionando na criação de plano.
        # se estiver, retirar definitivamente essas linhas
        # plan.status = 'Edição'
        # today = datetime.today()
        # today3months = today + timedelta(days=3 * 30)
        # plan.data_inicio = today.strftime("%Y-%m-%d")
        # plan.data_fim = today3months.strftime("%Y-%m-%d")

        return cls.dto.insert(plan)


    @classmethod
    def delete(cls, plano_id):
        
        return cls.dto.delete(plano_id)
