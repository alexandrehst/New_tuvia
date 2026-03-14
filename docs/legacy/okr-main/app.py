from datetime import datetime
from functools import wraps
import os
from flask import Flask, render_template, request, jsonify, send_file, url_for
from controller.ctrl_chat import Ctrl_Chat
from controller.ctrl_lp_planos import Ctrl_Lp_Planos
from controller.ctrl_planos import Ctrl_Planos
from flask_pydantic_spec import FlaskPydanticSpec, Request, Response
from baseModel.planAPI import CalculateRisk, ObjectiveResponse, PlanRequest, PlanResponse,  PlanDetailRequest, ObjectiveRequest, UserRequest
from baseModel.planAPI import ChatMessage
from baseModel.AuthHeader import AuthHeader
from extratos.ExtratoService import ExtratoService
from model.Plan import Plan
from model.User import User
from notification.evento import EventoFactory, ResultadoChaveAtualizado
from service.Configurations import Configurations
from service.BubbleAPIService import BubbleAPIService
from service.KrService import KrService
from service.OkrService import OkrService
from service.PlanService import PlanService
from service.UserService import UserService
from service.brevo import BrevoService
from service.mensageria.chatPool import ChatPool
from service.mensageria.usersCache import UsersCache
from auth.auth_middleware import authenticate_request
from routes.api_eventos import api_eventos_bp
from routes.api_criador_plano import criador_plano_bp
from routes.api_plano_ai import plano_ai_bp
from routes.api_krlt import api_krlt_bp
from routes.globals import spec

from logging.handlers import RotatingFileHandler
import logging
from datetime import datetime
import requests

# GLOBALS
app = Flask(__name__)
#spec = FlaskPydanticSpec('flask', title='Tuvia API', version='1.0.0')
spec.register(app)

#singletons
cache = UsersCache()
chatPool = ChatPool()

conf = Configurations()

api_token = conf.api_token

# Set up the logger
logger = logging.getLogger()
formatter = logging.Formatter('%(asctime)s %(levelname)s [%(module)s.%(funcName)s]: %(message)s')
fileHandler = RotatingFileHandler('app.log', maxBytes=1000000, backupCount=3)
stream_handler = logging.StreamHandler()

fileHandler.setFormatter(formatter)
stream_handler.setFormatter(formatter)

logger.addHandler(fileHandler)
logger.addHandler(stream_handler)

if conf.environment == conf.DEVELOPMENT:
    logger.setLevel(logging.DEBUG)
else:
    logger.setLevel(logging.INFO)


logger.debug( f"Ambiente {conf.environment}")


@app.get('/health_check')
# @spec.validate( headers=AuthHeader, resp=Response('HTTP_403', HTTP_200=PlanResponse), tags=['Plan'])
@authenticate_request
def api_health_check():

    resp = {'status': 'ok'}
    return resp, 200

@app.post('/plan')
@spec.validate(body=Request(PlanRequest), headers=AuthHeader, resp=Response('HTTP_403', HTTP_200=PlanResponse), tags=['Plan'])
@authenticate_request
def api_make_plan_bubble():
    """
    Gera um plano e insere os dados nas tabelas via chamada da API do Bubble.
    """

    data = request.get_json()

    id = data['user_id']
    title = data['title']
    business_info = data['business_info']
    improvement_needed = data['improvement_needed']
    success_indicator =  data['success_indicator']

    plan = Ctrl_Planos().make_plan(id,title, business_info, improvement_needed, success_indicator)

    if plan is None:
        return jsonify(f"Erro na geração do plano."), 500

    resp, msg = Ctrl_Planos().insere_plano( plan, data['user_id'] )
    if not resp:
        return jsonify(f"Erro na chamada do serviço. {msg}"), 500

    resp = {'plan_id': msg}
    return resp, 201

@app.post('/detail')
@spec.validate(body=Request(PlanDetailRequest), headers=AuthHeader, resp=Response('HTTP_403', HTTP_200=PlanResponse), tags=['Plan'])
@authenticate_request
def api_detail():
    """
    API para detalhamento do planejamento estratégico.
    Essa API deve ser chamada após a `/plan`.
    Com exceção de `detail` os demais campos devem ser da chamada original para preservação do contexto.
    """

    data = request.get_json()

    id = data['user_id']
    title = data['title']
    business_info = data['business_info']
    improvement_needed = data['improvement_needed']
    success_indicator =  data['success_indicator']
    depto = data['depto']

    plan = Ctrl_Planos.make_plan_detail( id, title, business_info, improvement_needed, success_indicator, depto)

    if plan is None:
        return jsonify(f"Erro na geração do plano."), 500

    resp, msg = Ctrl_Planos().insere_plano( plan, data['user_id'] )
    if not resp:
        return jsonify(f"Erro na chamada do serviço. {msg}"), 500

    resp = {'plan_id': msg}
    return resp, 201

def check_parameters( parameters, value, values_size=2):
    error = None

    for param in parameters:
        if param not in value:
            error = {
                "error": {
                    "code": "invalid_parameters",
                    "message": "The provided parameters are invalid or missing.",
                    "details": {
                        "missing_fields": [param]
                    }
                }
            }

        if param == 'values' and len(value[param]) != values_size:
            error = {
                "error": {
                    "code": "invalid_parameters",
                    "message": "The size of values is invalid.",
                    "details": {
                        "missing_fields": [param]
                    }
                }
            }


    return error

@app.get('/message')
@spec.validate(query=ChatMessage, tags=['Chat'])
@authenticate_request
def api_chat_message():
    """
    Recebe as mensagens enviadas por qualquer serviço de conversação, e respondem com a mensagem de acordo com o contexto.
    """

    user_id = request.args.get('user_id')
    message = request.args.get('message')

    if user_id is None or message is None:
        error = {
            "error": {
                "code": "invalid_parameters",
            }
        }
        return jsonify(error), 400

    resp = Ctrl_Chat().chat(user_id, message)

    return {'message': resp}, 200

@app.get('/risco')
@spec.validate(query=CalculateRisk, tags=['Chat'])
@authenticate_request
def calculate_risk():
    """
    Calcula o risco de um resultado chave. Este método não atualiza o banco de dados, apenas devolve o valor.
    """
    data_inicial = request.args.get('data_inicial')
    data_final = request.args.get('data_final')
    valor_atual = converte_valores_com_virgula(request.args.get('valor_atual'))
    valor_inicial = converte_valores_com_virgula( request.args.get('valor_inicial'))
    valor_final = converte_valores_com_virgula( request.args.get('valor_final'))
    tipo = request.args.get('tipo')
    data_calculo = request.args.get('data_calculo')

    logger.info(f"Received parameters: data_inicial={data_inicial}, data_final={data_final}, valor_atual={valor_atual}, valor_inicial={valor_inicial}, valor_final={valor_final}, tipo={tipo}, data_calculo={data_calculo}")

    if any(x is None for x in [data_inicial, data_final, valor_atual, valor_inicial, valor_final, tipo]):
        error = {
            "error": {
                "code": "invalid_parameters",
            }
        }
        return jsonify(error), 400

    if tipo not in KrService.TIPOS_VALIDOS:
        error = {
            "error": {
                "code": "invalid_parameters",
                "message": "Invalid tipo"
            }
        }
        return jsonify(error), 400

    if tipo == KrService.AUMENTAR and valor_atual > valor_final:
        error = {
            "error": {
                "code": "invalid_parameters",
                "message": "valor_atual can't be greater than valor_final"
            }
        }
        return jsonify(error), 400

    if tipo == KrService.REDUZIR and valor_atual < valor_final:
        error = {
            "error": {
                "code": "invalid_parameters",
                "message": "valor_atual can't be less than valor_final"
            }
        }
        return jsonify(error), 400

    # Convert string dates to datetime objects
    if data_inicial:
        data_inicial = datetime.strptime(data_inicial, '%Y-%m-%d')
    if data_final:
        data_final = datetime.strptime(data_final, '%Y-%m-%d')
    if data_calculo:
        data_calculo = datetime.strptime(data_calculo, '%Y-%m-%d')

    if data_final <= data_inicial or data_calculo < data_inicial:
        error = {
            "error": {
                "code": "invalid_date_range",
                "message": "data_final can't be equal or less than data_inicial"
            }
        }
        return jsonify(error), 400

    valor_atual = float(valor_atual)
    valor_inicial = float(valor_inicial)
    valor_final = float(valor_final)

    risco = KrService().calculate_risk(data_inicial, data_final, valor_atual, valor_inicial, valor_final, tipo, data_calculo)
    progresso = KrService().calculate_progress(tipo, valor_inicial, valor_final, valor_atual)

    return {'risco': risco, 'progresso': progresso}, 200

@app.post('/atualiza_riscos')
@spec.validate(headers=AuthHeader, resp=Response('HTTP_403', 'HTTP_200'), tags=['Plan'])
@authenticate_request
def atualiza_riscos():
    logger.info("Atualização de risco de resultados chave iniciada")
    resp = Ctrl_Planos().calcula_riscos( BubbleAPIService())

    if resp is None:
        logger.info("Erro na atualização de risco de resultados chave iniciada")
        return jsonify("Erro na atualização dos riscos"), 500
    logger.info("Atualização de risco de resultados chave concluída")

    return jsonify(f" {len(resp)} resultados chave atualizados com sucesso"), 200


###
# Rota provisória para a configuração do inbound parse no Brevo
@app.post('/email_recebido')
def email_recebido():
    data = request.get_json()
    logger.info(f"Email recebido: {data}")
    return jsonify("Email recebido"), 200

def converte_valores_com_virgula(v):
    if isinstance(v, str) and ',' in v:
        return float(v.replace(',', '.'))
    return v


######
# Abaixo estão as APIs para a LP de geraçao de plano


@app.get('/perguntas')
def get_perguntas():
    ctrl = Ctrl_Lp_Planos()
    tipo_plano_id = request.args.get('tipo_plano_id')
    tipo_plano_descricao = request.args.get('tipo_plano_descricao')

    resp = ctrl.get_perguntas(tipo_plano_id, tipo_plano_descricao)

    if not resp:
        return jsonify(f"Erro na chamada na geração das perguntas"), 500

    return resp, 201

@app.post('/plan_lp')
@authenticate_request
def api_make_plan_lp_bubble():
    """
    Gera um plano e insere os dados nas tabelas via chamada da API do Bubble.
    """

    data = request.get_json()

    tema_plano = data['tema_plano']

    email = data['email']
    nome = data['nome']
    empresa = data['empresa']
    telefone = data['telefone']

    perguntas = []
    respostas = []

    perguntas.append(data['pergunta1'])
    perguntas.append(data['pergunta2'])
    perguntas.append(data['pergunta3'])
    perguntas.append(data['pergunta4'])
    perguntas.append(data['pergunta5'])

    respostas.append(data['resposta1'])
    respostas.append(data['resposta2'])
    respostas.append(data['resposta3'])
    respostas.append(data['resposta4'])
    respostas.append(data['resposta5'])

    user = User(_id= 1, email=email, nome=nome, telefone=telefone)

    ctrl = Ctrl_Lp_Planos()
    filename = ctrl.gerar(user, empresa, tema_plano, perguntas, respostas)

    if not filename:
        return jsonify(f"Erro na geração do plano."), 500

    # resp, msg = Ctrl_Planos().insere_plano( plan, data['user_id'] )
    # if not resp:
    #     return jsonify(f"Erro na chamada do serviço. {msg}"), 500

    # response = send_file(filename, as_attachment=True)

    # # Remove o arquivo após o envio
    # response.call_on_close(lambda: os.remove(filename))

    download_url = url_for('download_file', filename=filename, _external=True)
    return jsonify({'download_url': download_url})

    return response

@app.route('/download-file/<filename>', methods=['GET'])
def download_file(filename):
    # Construct the file path
    file_path = os.path.join(os.getcwd(), filename)

    # Check if the file exists
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    # Send the file for download
    return send_file(file_path, as_attachment=True)


######
# Abaixo estão as APIs apenas para o PoC do extrato
@app.route('/upload_extrato', methods=['POST'])
def upload_csv():
    logger.info(request.get_json())
    if 'csvFile' not in request.files:
        return jsonify("No file part"), 422

    csv_file = request.files['csvFile']

    # Assuming you want to save the file
    csv_file.save('uploaded_file.csv')

    # Or if you just want to read the CSV data
    csv_data = csv_file.read()

    # Process the CSV data here...
    # For example, you can parse it using libraries like pandas

    return jsonify("CSV uploaded successfully"), 500

@app.get('/valores_por_categoria')
def valores_por_categoria():
    extrato =  ExtratoService()
    return extrato.get_valores_por_categoria(), 200

@app.get('/saldo_mes')
def saldo_mes():
    extrato =  ExtratoService()
    return extrato.get_valores_saldo_mes(), 200

@app.get('/analise_fluxo_de_caixa')
def analise_fluxo_de_caixa():
    extrato =  ExtratoService()
    return extrato.analiza_fluxo_de_caixa(), 200

@app.get('/analise_dre')
def analise_dre():
    extrato =  ExtratoService()
    return extrato.analiza_dre(), 200

@app.post('/plan_analise')
def plan_analise():
    extrato =  ExtratoService()

    data = request.get_json()

    id = data.get('user_id')
    title = data.get('title')
    id_plano_pai = data.get('id_plano_pai')
    tipo = data.get('tipo')
    inicio = data.get('inicio')
    fim = data.get('fim')
    departamento = data.get('depto')

    sucesso, plan_id = extrato.cria_plano_analise( user_id=id, title=title, id_plano_pai=id_plano_pai,
                                               tipo=tipo, inicio=inicio, fim=fim, departamento=departamento)

    if not sucesso:
        logger.error(f"Erro na geração do plano de análise")
        return jsonify(f"Erro na geração do plano."), 500

    resp = {'plan_id': plan_id}
    return resp, 201

app.register_blueprint(plano_ai_bp, url_prefix='/api')
app.register_blueprint(criador_plano_bp, url_prefix='/api')
app.register_blueprint(api_eventos_bp, url_prefix='/evento')
app.register_blueprint(api_krlt_bp, url_prefix='/api')

if __name__ == '__main__':
    app.run(debug=True)




