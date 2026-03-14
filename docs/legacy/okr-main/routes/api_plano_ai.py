from flask import Blueprint, request, jsonify
from auth.auth_middleware import authenticate_request
from baseModel.planAPI import PlanId
from controller.ctrl_objetivo import Ctrl_Objetivo
from controller.ctrl_planos import Ctrl_Planos
from routes.globals import spec
from baseModel.AuthHeader import AuthHeader
from flask_pydantic_spec import Request, Response

from service.BubbleAPIService import BubbleAPIService
from service.PlanGenerator import PlanGenerator
from service.UserService import UserService
from service.brevo import BrevoService

plano_ai_bp = Blueprint('api_plano_ai', __name__)

@plano_ai_bp.route('/novo_objetivo', methods=['POST']) #TODO: mudar a rota no Bubble
@spec.validate(body=Request(PlanId), headers=AuthHeader, resp=Response('HTTP_403', 'HTTP_200'), tags=['Plan'])
def novo_objetivo():

    """
    Esse método deve ser usado para realizar a integração com o sistema do Bubble.
    Além de realizar o que o /plan faz, ele insere os dados nas tabelas via chamada da API do Bubble.
    """

    data = request.get_json()

    id = data['plano_id']

    okr = Ctrl_Objetivo().novo_objetivo_ia(id )

    if okr is None:
        return jsonify(f"Erro na geração do objetivo."), 500

    id = OkrService().insere( okr )
    if not id:
        return jsonify(f"Erro na chamada do serviço."), 500

    resp = {'okr_id': id}
    return resp, 201

