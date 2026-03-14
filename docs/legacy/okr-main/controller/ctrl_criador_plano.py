from datetime import datetime

from flask import jsonify
from controller.ctrl_planos import Ctrl_Planos
from dto.Departamento_dto import DepartamentoDTO
from dto.PlanoEstrategico_dto import PlanoEstrategicoDTO
from dto.Plano_dto import PlanoDTO
from model.KeyResult import KeyResult
from model.Plan import Plan 
from model.Okr import Okr
from service.BubbleAPIService import BubbleAPIService
from service.GPTService import GPTService

import logging

from service.PlanoUsuarioService import PlanoUsuarioService
from service.UserService import UserService

logger = logging.getLogger()

function_plano = [
        {
            "type": "function",
            "function": {
                "name": "generate_strategy",
                "description": "Gere um plano estratégico com objetivos.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "Objectives": {
                            "type": "array",
                            "description": "Objectives",
                            "items": {
                                "type": "object",
                                "description": "Objetivo",
                                "properties": {
                                        "titulo": {"type": "string"},
                                        "descricao": {"type": "string"}
                                    },
                                "required": ["titulo", "descricao"]
                            }
                        }
                    },
                    "required": ["Objectives"]
                }
            }
        }
    ]	

function_resultado_chave = [
        {
            "type": "function",
            "function": {
                "name": "generate_key_results",
                "description": "Gere os resultados chave para o objetivo.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "resultados_chave": {
                            "type": "array",
                            "description": "Key results",
                            "items": {
                                "type": "object",
                                "description": "Resultado chave.",
                                "properties": {
                                    "Descricao": {"type": "string"},
                                    "Valor": {"type": "number"},
                                    "Unidade": {"type": "string"},
                                    "Tipo_metrica": {
                                        "type": "string",
                                        "enum": ["Aumentar até", "Reduzir até", "Sim/Não"]}
                                },
                                "required": ["Descricao", "Valor", "Unidade", "Tipo_metrica"]
                            }
                        }
                    },
                    "required": ["resultados_chave"]
                }
            }
        }
    ]	

class Ctrl_Criador_Plano:
    
    def cria_plano_estrategico(self, id_plano_estrategico):

        logger.info(f"Criador plano estratégico. Plano {id_plano_estrategico}")
        dto =  PlanoEstrategicoDTO(BubbleAPIService())
        
        plano_estrategico = dto.get_by_id(id_plano_estrategico)
        if not plano_estrategico:
            logger.error(f"Plano estratégico não encontrado. {id_plano_estrategico}")
            return None

        plano = dto.get_plano()
        if not plano:
            logger.error(f"Plano ligado ao planejamento estratégico não encontrado. {plano_estrategico.plano}")
            return None
        
        resultado = self.get_objetivos_gpt(plano_estrategico)
        if resultado.get('error'):
            logger.error(f"Erro ao gerar objetivos. {resultado.get('message')}")    
            return None
        
        okrs = self.cria_okrs( resultado.get('message').get('Objectives'), plano_estrategico.created_by)
        for okr in okrs:
            resultado = self.get_resultados_chave_objetivo(okr)
            
            okr.key_results = self.cria_key_results(resultado.get('message').get('resultados_chave'))

        plano.okrs = okrs

        resp, plano_id = Ctrl_Planos().insere_plano( plano, plano_estrategico.created_by) 
        if not resp:
            logger.error(f"Erro ao criar plano estratégico. {plano_id}")
            return None

        return plano_id
    
    def cria_plano_departamentos(self, id_plano_corporativo, id_departamentos, user_id):
            
            logger.info(f"Criador plano  para departamentos. Plano {id_plano_corporativo}")
            dto =  PlanoDTO(BubbleAPIService())
            
            plano_corporativo = dto.get_by_id(id_plano_corporativo)
            if not plano_corporativo:
                logger.error(f"Plano corporativo não encontrado. {id_plano_corporativo}")
                return None
            
            dto.plano = plano_corporativo
            objetivos = dto.get_okrs()
            if not objetivos:
                logger.error(f"Objetivos não encontrados. {id_plano_corporativo}")
                return None
            
            dto = DepartamentoDTO(BubbleAPIService())
            departamentos = []
            for id in id_departamentos:
                departamento = dto.get_by_id(id)
                if not departamento:
                    logger.error(f"Departamento não encontrado. {id}")
                    return None
                departamentos.append(departamento)
            
            planos = []
            for departamento in departamentos:
                plano = self.cria_plano_cada_departamento( plano_corporativo, departamento, objetivos, user_id)
                if not plano:
                    logger.error(f"Erro ao criar plano para o departamento {departamento}")
                    continue

                resp, plano_id = Ctrl_Planos().insere_plano( plano, user_id) 
                if not resp:
                    return None
                
                # TODO: mandar e-mail informando que os planos foram criados
                
                planos.append(plano.id)

            return planos if len(planos) > 0 else None
    
    def cria_plano_cada_departamento(self, plano_pai, departamento, objetivos_corporativos, user_id):
        
        logger.info(f"Criador plano para o departamento {departamento.nome}")

        resultado = self.get_objetivos_departamento_gpt( departamento, objetivos_corporativos)
        if resultado.get('error'):
            logger.error(f"Erro ao gerar objetivos. {resultado.get('message')}")
            return None
        
        okrs = self.cria_okrs( resultado.get('message').get('Objectives'))

        for okr in okrs:
            resultado = self.get_resultados_chave_objetivo(okr)
            
            okr.key_results = self.cria_key_results(resultado.get('message').get('resultados_chave'))

        # Cria plano corporativo
        plano = self.cria_plano(  plano_pai, okrs, tipo_plano='Plano de apoio', departamento=departamento, plano_pai=plano_pai)
        
        if plano is None:
            return None

        return plano        
    
    def cria_plano_simples(self, plano_id, descricao, user_id):
            logger.info(f"Criador plano simples. Plano {plano_id}")
            dto =  PlanoDTO(BubbleAPIService())
            
            plano = dto.get_by_id(plano_id)
            if not plano:
                logger.error(f"Plano não encontrado. {plano_id}")
                return None
            
            resultado = self.get_objetivos_simples_gpt( descricao)
            if resultado.get('error'):
                logger.error(f"Erro ao gerar objetivos. {resultado.get('message')}")
                return None

            okrs = self.cria_okrs( resultado.get('message').get('Objectives'))

            for okr in okrs:
                resultado = self.get_resultados_chave_objetivo(okr)
                
                okr.key_results = self.cria_key_results(resultado.get('message').get('resultados_chave'))

            plano.okrs = okrs

            okrs_ids = Ctrl_Planos().insere_objetivos( okrs, plano.data_inicio, plano.data_fim) 
            if not okrs_ids:
                logger.error(f"Erro ao criar plano estratégico. {plano_id}")
                return None

            return okrs_ids                

            

    def get_objetivos_gpt(self, plano_estrategico):

        value_system = '''Atue como um especialista em planejamento estratégico.
                        Gere uma lista de objetivos estratégicos para a empresa. Você deve gerar no mínimo 5 e no máximo 10 objetivos. 
            Como insumo para a geração utilize os itens listados em "O que devemos começar a fazer", "Diagnóstico da situação atual", além das oportunidades e ameaças.
            '''
        
        value_user = f'''O que devemos começar a fazer:
            {plano_estrategico.comecar if plano_estrategico.comecar else ''}
            
            Diagnóstico da situação atual:
            {plano_estrategico.onde_estamos if plano_estrategico.onde_estamos else ''} 
            
            Oportunidades:
            {plano_estrategico.oportunidades if plano_estrategico.oportunidades else ''}
            
            Ameaças:
            {plano_estrategico.ameacas if plano_estrategico.ameacas else ''}
            
        '''

        messages = [
                        {'role': 'system', 'content': value_system},
                        {'role': 'user', 'content': value_user}
                    ]


        model = GPTService( GPTService.MODELO_MAIS_PODEROSO )
        
        # Gera os objetivos
        resultado = model.generate( messages, function_plano)
        
        return resultado

    def get_objetivos_departamento_gpt(self, departamento, objetivos_plano_estrategico):

        value_system = f'''Atue como um especialista em planejamento estratégico.
                        Gere uma lista de objetivos estratégicos para o departamento {departamento}. Você deve gerar no mínimo 5 e no máximo 10 objetivos. 
                        Como insumo para a geração utilize os objetivos coorporativos.
            '''

        objetivos_text = "\n".join([f"- {objetivo.titulo}: {objetivo.descricao}" for objetivo in objetivos_plano_estrategico])
        value_user = f"\n\nObjetivos corporativos:\n{objetivos_text}"
        

        messages = [
                        {'role': 'system', 'content': value_system},
                        {'role': 'user', 'content': value_user}
                    ]


        model = GPTService( GPTService.MODELO_MAIS_PODEROSO )
        
        # Gera os objetivos
        resultado = model.generate( messages, function_plano)
        return resultado

    def get_objetivos_simples_gpt(self, descricao):

        value_system = f'''Atue como um especialista em planejamento estratégico.
                        Gere uma lista de objetivos estratégicos. Você deve gerar no mínimo 3 e no máximo 5 objetivos. 
                        Como insumo para a geração utilize a descricao do plano estratégico.
            '''

        value_user = f"Descricao do plano estratégico:{descricao}"
        

        messages = [
                        {'role': 'system', 'content': value_system},
                        {'role': 'user', 'content': value_user}
                    ]


        model = GPTService( GPTService.MODELO_MAIS_PODEROSO )
        
        # Gera os objetivos
        resultado = model.generate( messages, function_plano)
        return resultado
        
    def get_resultados_chave_objetivo(self, objetivo: Okr):

        value_system = f'''Atue como um especialista em planejamento estratégico.
                        Gere uma lista de resultados chave para o objetivos que receber.
                        Você deve gerar no mínimo 3 e no máximo 5 resultados chave. 
            '''

        value_user = f"Esse é o objetivo: {objetivo.titulo}: {objetivo.descricao}"
        

        messages = [
                        {'role': 'system', 'content': value_system},
                        {'role': 'user', 'content': value_user}
                    ]


        model = GPTService( GPTService.MODELO_MAIS_PODEROSO )
        
        # Gera os objetivos
        resultado = model.generate( messages, function_resultado_chave)
        return resultado    
    
    def cria_plano(self, plano_estrategico, okrs, tipo_plano='Plano corporativo', departamento=None, plano_pai=None):  

        if tipo_plano == 'Plano de apoio':
            title = f"Plano estratégico - {departamento.nome}"

            if not plano_pai:
                logger.error(f"Plano pai não informado para o plano do departamento {departamento}")
                return None

        nome_departamento = departamento.nome if departamento else None
        
        try:
            plano = Plan(Titulo=title, Objetivos=okrs, Departamento=nome_departamento, Status='Edição', Tipo=tipo_plano)
            plano.data_inicio = plano_estrategico.data_inicio # essas duas linhas não funcionaram no construtor. Por isso, setei aqui
            plano.data_fim = plano_estrategico.data_fim

            plano.cliente = plano_estrategico.cliente

            if plano_pai:
                plano.plano_pai = plano_pai
                        
            return plano
        except Exception as e:
            logger.error(f"Erro ao criar plano: {e}")
            return None
        
    def cria_okrs(self, objetivos, responsavel_id=None):
        okrs = []
        for i, obj in enumerate(objetivos):
            okr = Okr( Titulo=obj['titulo'], Descricao=obj['descricao'], Numero=i + 1)
            okr.responsaveis_ids=[responsavel_id]
            okrs.append(okr )

            
        return okrs

    def cria_key_results(self, resultados_chave):
        krs = []
        for i, resultado_chave in enumerate(resultados_chave):
            try:
                kr = KeyResult( Descricao= resultado_chave['Descricao'], Valor=resultado_chave['Valor'], Unidade=resultado_chave['Unidade'], Tipo_metrica=resultado_chave['Tipo_metrica'], Peso=1)
                krs.append(kr)
            except KeyError as e:
                logger.error(f"Erro ao criar KeyResult: {e}")
            
        return krs