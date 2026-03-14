from datetime import datetime
from dto.KeyResult_dto import KeyResultDTO
from dto.Objetivo_dto import ObjetivoDTO
from dto.Plano_dto import PlanoDTO
from model.Okr import Okr
from model.Plan import Plan
from notification.evento import EventoFactory
from service.KRLTService import KRLTService
from service.BubbleAPIService import BubbleAPIService
from service.KrService import KrService
from service.OkrService import OkrService
from service.PlanGenerator import PlanGenerator
from service.PlanService import PlanService
import logging

from service.PlanoUsuarioService import PlanoUsuarioService
from service.UserService import UserService

logger = logging.getLogger()


class Ctrl_Planos:

    # array contento o par id e mensagens do chatgpt para preservação do contexto
    plan_generator = PlanGenerator(model='gpt-4-turbo-preview', temperature=1)
    app_id = 'PLAN'

    @classmethod
    def new_plan_from_json(cls, plan_json):
        return Plan.create_from_dict(plan_json)


    @classmethod
    def make_plan(cls, id, title, business_info, improvement_needed, success_indicator):

        logger.info(f"Make plan. Usuário {id}")

        value_system = "Atuando como CEO, defina três objetivos estratégicos, no formato OKR. "
        value_user = f'Descrição do negocio: {business_info}. O que melhorar: {improvement_needed}. Quanto melhorar: {success_indicator}'

        messages = [
                        {'role': 'system', 'content': value_system},
                        {'role': 'user', 'content': value_user}
                    ]

        plan = cls.make_plan_generate (id, title, business_info, improvement_needed, success_indicator, messages)
        plan.tipo = "Plano corporativo"
        return plan

    @classmethod
    def make_plan_detail(cls, id, title, business_info, improvement_needed, success_indicator, depto):

        logger.info(f"Plan detail. Usuário {id}")

        value_system = f"Atuando como chefe de um departamento, defina um plano estratégico no formato okr "
        value_system += "contendo três objetivos. "

        value_user = "Setor {depto} "
        value_user += f'Descrição do negocio: {business_info}. O que melhorar: {improvement_needed}. Quanto melhorar: {success_indicator}'

        messages = [
            {'role': 'system', 'content': value_system},
            {'role': 'user', 'content': value_user}
        ]

        title = f"{title} - {depto}"

        plan = cls.make_plan_generate (id, title, depto, improvement_needed, success_indicator, messages)
        plan.tipo = "Plano de apoio"
        return plan


    @classmethod
    def make_plan_generate(cls, id, title, business_info, improvement_needed, success_indicator, messages):
        try:
            chatGPT_answer = cls.plan_generator.generate_plan(messages)
            if chatGPT_answer['error']:
                return None

            plan = PlanService.create_from_answer(title, business_info, improvement_needed, success_indicator, chatGPT_answer['message'])

            if plan is None:
                logger.error(f"Erro na criação do plano")
                return None

            while len(plan.okrs) < 3:
                logger.info(f"Criando objetivos adicionais")
                okr = Ctrl_Planos.make_objective_adicional(messages, plan.okrs)
                if okr is None:
                   break
                plan.okrs.append(okr)

            # Checa se todos os objetivos tem 3 resultados chave e adiciona se necessário
            for okr in plan.okrs:
                while len(okr.key_results) < 3:
                    logger.info(f"Criando resultados chave adicionais")
                    kr = Ctrl_Planos.make_key_result(id, okr)
                    if kr is None:
                        break
                    okr.key_results.append(kr)
            return plan
        except Exception as e:
            logger.error(f"Erro na geração do plano: {e}")
            return None

    @classmethod
    def make_objective(cls, id, business_info, improvement_needed, success_indicator, objectives):

        logger.info(f"Make objetctive. Usuário {id}")

        value_system = "Atuando como CEO, defina objetivos estratégicos, no formato OKR. "
        value_user = f'Descrição do negocio: {business_info}. O que melhorar: {improvement_needed}. Quanto melhorar: {success_indicator}'

        messages = [
                        {'role': 'system', 'content': value_system},
                        {'role': 'user', 'content': value_user}
                    ]

        okrs = [ Okr(id=0,Titulo=objective, key_results=[]) for objective in objectives]

        okr = cls.make_objective_adicional(messages, okrs)

        return okr

    # Essa função é para corrigir um comportamento quando usa o GPT-3.5. Nesse caso, só é gerado um objetivo.
    # portanto, essa função permite adicionar mais objetivos ao plano
    @classmethod
    def make_objective_adicional(cls, messages, objectives):

        try:

            value_system = "Seu papel é sugerir um objetivo diferente"

            value_user = "Temos os seguintes objetivos: "
            if len(objectives) > 0:
                for i, objective in enumerate(objectives):
                    value_user += f"{i} - {objective.titulo}. "
            value_user += "Gere um objetivo diferente. "

            messages.append( {'role': 'system', 'content': value_system})
            messages.append( {'role': 'user', 'content': value_user})

            chatGPT_answer = cls.plan_generator.generate_objective( messages)
            if chatGPT_answer['error']:
                return None

            okr = OkrService.create_from_answer( chatGPT_answer['message'])

            if not  okr:
                raise Exception("Erro na criação do objetivo")


        except Exception as e:
            logger.error(f"Erro na geração do objetivo: {e}")
            return None

        return okr

    # Essa função é para corrigir um comportamento quando usa o GPT-3.5. As vezes só é gerado um resultado chave.
    # portanto, essa função permite adicionar mais resultados a um objetivo
    @classmethod
    def make_key_result(cls, id,  okr):
        try:
            value_system = "Seu papel é sugerir um resultado chave diferente"

            value_user = f"Para o objetivo {okr.titulo} "
            value_user += "com os seguintes resultados-chave: "

            for i, kr  in enumerate(okr.key_results):
                value_user += f"{i} - {kr} "

            value_user += "Gere um resultado chave diferente. "

            messages = [{'role': 'system', 'content': value_system},
                        {'role': 'user', 'content': value_user}]

            chatGPT_answer = cls.plan_generator.generate_key_result( messages)
            if chatGPT_answer['error']:
                return None

            kr = KrService.create_from_answer( chatGPT_answer['message'])

        except Exception as e:
            logger.error(f"Erro na geração de key result: {e}")
            return None

        return kr

    @classmethod
    def calcula_riscos(cls, service, data_calculo=None):
        # Busca todos os planos publicados
        # Busca todos os objetivos dos planos
        # Busca todos os resultados chave dos objetivos
        # Calcula os riscos dos resultados chave

        resultados_atualizados = []

        dto = PlanoDTO(service)

        planos = dto.get_planos_publicados()

        if planos is None or len(planos) == 0:
            logger.error(f"Erro na recuperação dos planos")
            return None

        dto_kr = KeyResultDTO(service)

        objetivos_ids = []
        for plano in planos:
            dto.plano = plano
            dto.get_okrs(carrega_key_results=True)  

            for objetivo in plano.okrs:

                for resultado in objetivo.key_results:

                    status = KrService.calculate_risk(data_inicial=plano.data_inicio, data_final=plano.data_fim,
                                                      valor_atual=resultado.valor_atual, valor_inicial=resultado.valor_inicial,
                                                      valor_final=resultado.value, tipo=resultado.tipo_metrica, data_calculo=data_calculo)
                    if not status:
                        logger.error(f"Erro no calculo do risto. Kr {resultado}")
                        continue

                    resultado.status = status

                    dto_kr.keyresult = resultado
                    kr = dto_kr.update_risco()
                    if kr is None:
                        logger.error(f"Erro na atualização do risco. Kr {dto.keyresult}")
                        return None

                    resultados_atualizados.append(kr)

        return resultados_atualizados

    @classmethod
    def insere_plano(cls, plan: Plan, user_id):

        user = UserService().get_user(user_id)
        if not user:
            logger.error(f"Usuário {user_id} não encontrado")
            return False, f"Usuário não encontrado"

        plan.okr_ids = cls.insere_objetivos(plan.okrs, plan.data_inicio, plan.data_fim)
        if not plan.okr_ids:         
            return False, f"Erro Objetivos."

        plan_id = PlanService().insere_plano_ia(plan)
        if not plan_id:
            cls._rollback_objetivos(plan)
            return False, f"Erro Plan."
        plan.id = plan_id

        plano_usuario_id = PlanoUsuarioService().insert(plan = plan, user = user)
        if not plano_usuario_id:
            cls._rollback_plano(plan)
            return False, f"Erro Plano Usuario."

        logger.debug(f"Plan {plan_id} inserido com sucesso")
        
        # TODO: Quando o ciclo de vida do plano for feito, o envio de e-mail deve ocorrer na publicação do plano
        # try:
        #     for objetivo in plan.okrs:
        #         responsaveis = OkrService().get_responsaveis(objetivo)
        #         if not responsaveis: continue

        #         for responsavel in responsaveis:
        #             evento = EventoFactory().create_evento(EventoFactory.RESPONSAVEL_OBJETIVO, responsavel)
        #             evento.execute(user, objetivo.titulo)

        # except Exception as e:
        #     logger.error(f"Erro ao enviar email para responsáveis pelos objetivos: {e}")

                    
        return True, plan_id

    @classmethod
    def insere_objetivos(cls, okrs, data_inicio, data_fim):

        for objetivo in okrs:
            retorno, objetivo.key_results_ids = cls.insere_key_results(objetivo.key_results)
            if not retorno:
                logger.error(f"Erro na inserção dos resultados chave. Objetivo {objetivo.titulo}")
                return None
            
            KRLTService.atualiza_linha_tendencia(objetivo.key_results, data_inicio, data_fim)

        okrs_ids = OkrService.insere_bulk(okrs)
        if not okrs_ids:
            logger.error(f"Erro na inserção dos objetivos")
            cls._rollback_keyresults(okrs)
            return None

        return okrs_ids

    # TODO: Mover esse método para o service
    @classmethod
    def insere_key_results(cls, key_results):
        if not key_results:
            return False, f"Key results vazio."
        
        kr_ids = KrService.insere_bulk(key_results)
        if not kr_ids:
            return False, f"Erro key results."
        
        for kr, kr_id in zip(key_results, kr_ids):
            kr.id = kr_id

        return True, kr_ids
    
    @classmethod
    def publica_plano(cls, plan: Plan, user_id):

        user = UserService().get_user(user_id)
        if not user:
            logger.error(f"Usuário {user_id} não encontrado")
            return False, f"Usuário não encontrado"

        plan.okr_ids = cls.insere_objetivos(plan.okrs, plan.data_inicio, plan.data_fim)
        if not plan.okr_ids:         
            return False, f"Erro Objetivos."

        plan_id = PlanService().insere_plano_ia(plan)
        if not plan_id:
            cls._rollback_objetivos(plan)
            return False, f"Erro Plan."
        plan.id = plan_id

        plano_usuario_id = PlanoUsuarioService().insert(plan = plan, user = user)
        if not plano_usuario_id:
            cls._rollback_plano(plan)
            return False, f"Erro Plano Usuario."

        logger.debug(f"Plan {plan_id} inserido com sucesso")
        
        # TODO: Quando o ciclo de vida do plano for feito, o envio de e-mail deve ocorrer na publicação do plano
        # try:
        #     for objetivo in plan.okrs:
        #         responsaveis = OkrService().get_responsaveis(objetivo)
        #         if not responsaveis: continue

        #         for responsavel in responsaveis:
        #             evento = EventoFactory().create_evento(EventoFactory.RESPONSAVEL_OBJETIVO, responsavel)
        #             evento.execute(user, objetivo.titulo)

        # except Exception as e:
        #     logger.error(f"Erro ao enviar email para responsáveis pelos objetivos: {e}")

                    
        return True, plan_id
    

    @classmethod
    def _rollback_keyresults(cls, objetivos):
        for objetivo in objetivos:
            for kr in objetivo.key_results_ids:
                KrService.delete(kr)

    @classmethod
    def _rollback_objetivos(cls, plan):
        cls._rollback_keyresults(plan.okrs)
        for okr in plan.okr_ids:
            OkrService.delete(okr)

    @classmethod
    def _rollback_plano(cls, plan):
        cls._rollback_objetivos(plan)
        PlanService.delete(plan.id)
        




    # TODO: O Calculço de risco busca por Planos publicados. Ese valor nem tinha no Bubble. Verificar se existe momento da publicação e como é esse ciclo de vida