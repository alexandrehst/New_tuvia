import logging
from flask import Blueprint, request, jsonify
from controller.ctrl_criador_plano import Ctrl_Criador_Plano
from service.GPTService import GPTService
from service.GPTService import GPTService
from flask_pydantic_spec import Request
from auth.auth_middleware import authenticate_request
from routes.globals import spec
from baseModel.AuthHeader import AuthHeader
from baseModel.model_api_criado_plano import PlanoDepartamentoRequest, PlanoEstrategicoRequest, PlanoSimplesRequest
from flask_pydantic_spec import Request, Response

criador_plano_bp = Blueprint('api_criador_plano', __name__)
logger = logging.getLogger()


functions_missoes= [
    {
        "type": "function",
        "function": {
            "name": "generate_missions",
            "description":"Sugira cinco missões para o plano estratégico",
            "parameters": {
                "type": "object",
                "properties": {
                    "Missoes": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "Uma missao"
                        }
                    }
                }
            }
        }
    }
]

functions_visoes= [
    {
        "type": "function",
        "function": {
            "name": "generate_vision",
            "description":"Sugira cinco declaracoes de visão para o plano estratégico",
            "parameters": {
                "type": "object",
                "properties": {
                    "Visoes": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "Uma visão"
                        }
                    }
                }
            }
        }
    }
]

functions_valores = [
    {
        "type": "function",
        "function": {
            "name": "generate_values",
            "description":"Cinco valores para o plano estratégico",
            "parameters": {
                "type": "object",
                "properties": {
                    "Valores": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "Um valor no formato <titulo> <breve descricao>"
                        }
                    }
                }
            }
        }
    }
]

functions_oportunidades = [
    {
        "type": "function",
        "function": {
            "name": "generate_oportunidades",
            "description":"Descreva as oportunidades de mercado para o negócio abaixo. Cada oportunidade deve ter um título e um parágrafo com a descrição.",
            "parameters": {
                "type": "object",
                "properties": {
                    "Oportunidades": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "Um parágrafo com a descrição de uma oportunidade"
                        }
                    }
                }
            }
        }
    }
]

functions_ameacas = [
    {
        "type": "function",
        "function": {
            "name": "generate_ameacas",
            "description":"Ameacas ao negócio",
            "parameters": {
                "type": "object",
                "properties": {
                    "Ameacas": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "Um parágrafo descrevendo a ameaca"
                        }
                    }
                }
            }
        }
    }
]

model = GPTService(model="gpt-4o")

@criador_plano_bp.route('/missao', methods=['GET'])
def get_missao():

    gpt = GPTService()

    ramo_de_atuacao = request.args.get('ramo_de_atuacao')
    descricao_negocio = request.args.get('descricao_negocio')

    message = [
        {
            "role": "system",
            "content": "Você é um especialista em planejamento estratégico. Sua função é sugerir 5 textos para a missão da empresas que o usuário irá te passar. Cada missão deve ser uma frase inspiradora que expresse o propósito da empresa. A resposta deve ser um array JSON"
        },
        {
            "role": "user",
            "content": f"Qual a missão da empresa do ramo de atuação {ramo_de_atuacao} que {descricao_negocio}?"
        }
    ]



    resp = gpt.generate(message, response_format="json_object")
    message = [
        {
            "role": "system",
            "content": "Sugira cinco missões para o plano estratégico. Cada missão deve ser uma frase curta e objetiva que aponte para um alvo inspirador e que defina o porque do negócio existir.",
        },
        {
            "role": "user",
            "content": f"O ramo de atuação da empresa é {ramo_de_atuacao} e a descrição do negócio é {descricao_negocio}."	
        }
    ]

    resp = model.generate(message, functions_missoes)

    if not resp:
        return jsonify(f"Erro na chamada na geração das perguntas"), 500

    return resp, 201

@criador_plano_bp.route('/visao', methods=['GET'])
def get_visao():

    ramo_de_atuacao = request.args.get('ramo_de_atuacao')
    descricao_negocio = request.args.get('descricao_negocio')

    message = [
        {
            "role": "system",
            "content": "Sugira cinco visões para o plano estratégico. Cada visão deve ser uma frase curta e responder a pergunta: onde queremos estar no futuro?",
        },
        {
            "role": "user",
            "content": f"O ramo de atuação da empresa é {ramo_de_atuacao} e a descrição do negócio é {descricao_negocio}."	
        }
    ]
    
    resp = model.generate(message, functions_visoes)

    if not resp:
        return jsonify(f"Erro na chamada na geração das perguntas"), 500

    return resp, 201


@criador_plano_bp.route('/valores', methods=['GET'])
def get_valores():

    ramo_de_atuacao = request.args.get('ramo_de_atuacao')
    descricao_negocio = request.args.get('descricao_negocio')
    mensagem = '''
      Sugira cinco valores para o plano estratégico. 
      Cada valor deve ser uma palavra, seguida de uma frase curta explicando o valor,
      no formato: <valor>: <explicacao>.
      Os valores representam os princípios e crenças fundamentais da empresa."
    '''
    message = [
        {
            "role": "system",
            "content": mensagem ,
        },
        {
            "role": "user",
            "content": f"O ramo de atuação da empresa é {ramo_de_atuacao} e a descrição do negócio é {descricao_negocio}."    
        }
    ]
    
    #model = GPTService()
    resp = model.generate(message, functions_valores)

    if not resp:
        return jsonify(f"Erro na chamada na geração dos valores"), 500

    return resp, 201

@criador_plano_bp.route('/oportunidades', methods=['GET'])
def get_oportunidades():

    ramo_de_atuacao = request.args.get('ramo_de_atuacao')
    descricao_negocio = request.args.get('descricao_negocio')
    visao = request.args.get('visao')
    missao = request.args.get('missao')

    mensagem = f'''
        Liste oportunidade de mercado para o negócio abaixo. Cada oportunidade deve ter um título e um parágrafo com a descrição.
        O ramo de atuação da empresa é {ramo_de_atuacao} e a descrição do negócio é {descricao_negocio}. A missão é {missao} e a visão é {visao}
    '''
    message = [
        {
            "role": "user",
            "content": mensagem 
        }
    ]
    
    #model = GPTService()
    resp = model.generate(message, functions_oportunidades)

    if not resp:
        return jsonify(f"Erro na chamada na geração dos valores"), 500

    return resp, 201


@criador_plano_bp.route('/ameacas', methods=['GET'])
def get_ameacas():

    ramo_de_atuacao = request.args.get('ramo_de_atuacao')
    descricao_negocio = request.args.get('descricao_negocio')
    visao = request.args.get('visao')
    missao = request.args.get('missao')

    mensagem = '''
        Você é um especialista em análise de mercado. Seu cliente está elaborando uma matriz SWOT. Descreva as ameacas ao negocio para o negócio abaixo.
    '''
    message = [
        {
            "role": "system",
            "content": mensagem ,
        },
        {
            "role": "user",
            "content": f"O ramo de atuação da empresa é {ramo_de_atuacao} e a descrição do negócio é {descricao_negocio}. A missão é {missao} e a visão é {visao}"    
        }
    ]


    mensagem = f'''
        Liste ameacas ao negocio para o negócio abaixo. Cada ameaca deve ter um título e um parágrafo com a descrição.
        O ramo de atuação da empresa é {ramo_de_atuacao} e a descrição do negócio é {descricao_negocio}. A missão é {missao} e a visão é {visao}
    '''
    message = [
        {
            "role": "user",
            "content": mensagem 
        }
    ]
    
    #model = GPTService()
    resp = model.generate(message, functions_ameacas)

    if not resp:
        return jsonify(f"Erro na chamada na geração dos valores"), 500

    return resp, 201


@criador_plano_bp.route('/cria_plano_estrategico', methods=['POST'])
@spec.validate(body=Request(PlanoEstrategicoRequest), headers=AuthHeader, resp=Response('HTTP_403', 'HTTP_200'), tags=['Plan'])
@authenticate_request
def cria_plano_estrategico():
    """
    Gera um plano e insere os dados nas tabelas via chamada da API do Bubble.
    """

    data = request.get_json()

    planoestrategico_id = data['id']
    
    ctrl = Ctrl_Criador_Plano()

    plano_id = ctrl.cria_plano_estrategico(planoestrategico_id)
 
    if not plano_id:
        return jsonify(f"Erro na geração do plano."), 500

    resp = {'plan_id': plano_id}
    return resp, 201

@criador_plano_bp.route('/cria_plano_departamentos', methods=['POST'])
#@spec.validate(body=Request(PlanoDepartamentoRequest), headers=AuthHeader, resp=Response('HTTP_403', 'HTTP_200'), tags=['Plan'])
@authenticate_request
def cria_plano_departamentos():
    """
    Gera um plano e insere os dados nas tabelas via chamada da API do Bubble.
    """

    data = request.get_json()

    plano_corporativo_id = data['plano_corporativo']
    ids_departamentos = data['departamentos']
    user_id = data['user_id']

    logger.info(f"plano_corporativo_id: {plano_corporativo_id}, departamentos: {ids_departamentos}, user_id: {user_id}")   
    ctrl = Ctrl_Criador_Plano()

    planos_id = ctrl.cria_plano_departamentos(plano_corporativo_id, ids_departamentos, user_id)

    if not planos_id:
        return jsonify(f"Erro na geração do plano."), 500

    resp = {'planos_id': planos_id}
    return resp, 201

@criador_plano_bp.route('/cria_plano_simples', methods=['POST'])
@spec.validate(body=Request(PlanoSimplesRequest), headers=AuthHeader, resp=Response('HTTP_403', 'HTTP_200'), tags=['Plan'])
@authenticate_request
def cria_plano_simples():
    """
    Gera um plano e insere os dados nas tabelas via chamada da API do Bubble.
    """

    data = request.get_json()

    plano_id = data['id']
    descricao = data['descricao']
    user_id = data['user_id']
    
    ctrl = Ctrl_Criador_Plano()

    okrs_ids = ctrl.cria_plano_simples(plano_id, descricao, user_id)

    if not okrs_ids:
        return jsonify(f"Erro na geração do plano simples."), 500

    resp = {'okrs_ids': okrs_ids}
    return resp, 201