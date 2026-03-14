import logging
from flask import Blueprint, request, jsonify
from flask_pydantic_spec import Request
from auth.auth_middleware import authenticate_request
from baseModel.model_api_krlt import AtualizaKRLTRequest
from controller.ctrl_krlt import Ctrl_KRLT
from routes.globals import spec
from baseModel.AuthHeader import AuthHeader
from flask_pydantic_spec import Request, Response

from datetime import datetime
import pytz

logger = logging.getLogger()
api_krlt_bp = Blueprint('api_krlt', __name__)

@api_krlt_bp.route('/atualiza_linha_tendencia', methods=['POST']) #TODO: mudar a rota no Bubble
@spec.validate(body=Request(AtualizaKRLTRequest), headers=AuthHeader, resp=Response('HTTP_403', 'HTTP_200'), tags=['Plan'])
@authenticate_request
def atualiza_linha_tendencia():

    data = request.get_json()
    logger.info(f"Request: {data}")
    id = data['id']
    data_inicial = data['data_inicial']
    data_final = data['data_final']

    try:
        data_inicial = datetime.strptime(data_inicial, '%Y-%m-%d')
        data_final = datetime.strptime(data_final, '%Y-%m-%d')
    except ValueError as e:
        logger.error(f"Erro ao converter datas: {str(e)}")
        return jsonify(f"Erro ao converter datas: {str(e)}"), 400

    result = Ctrl_KRLT().atualiza_linha_tendencia(id, data_inicial, data_final)

    if not result:
        return jsonify(f"Erro na atualização da linha de tendência."), 500

    
    return {'resultado': result}, 201
