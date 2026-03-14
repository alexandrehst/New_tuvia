from flask import Blueprint, request, jsonify
from flask_pydantic_spec import Request
from auth.auth_middleware import authenticate_request
from baseModel.planAPI import UserRequest
from dto.User_dto import UserDTO
from model.User import User
from notification.evento import EventoFactory
from routes.globals import spec
from baseModel.AuthHeader import AuthHeader
from flask_pydantic_spec import Request, Response

from service.BubbleAPIService import BubbleAPIService
from service.UserService import UserService
from service.brevo import BrevoService

api_batch_bp = Blueprint('api_batch', __name__)

@api_batch_bp.route('/atualiza_status_kr', methods=['POST']) #TODO: mudar a rota no Bubble
# @spec.validate(body=Request(UserRequest), headers=AuthHeader, resp=Response('HTTP_403', 'HTTP_200'), tags=['Plan'])
def atualiza_status_kr():

    # Busca planos publicados
    # Busca todos os KeyResults
    # busca historicos de KeyResults
    # Atualiza status dos KeyResults baseado na data de atualizaçao do historico