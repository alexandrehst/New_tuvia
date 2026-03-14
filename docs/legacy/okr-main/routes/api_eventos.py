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

api_eventos_bp = Blueprint('api_eventos', __name__)

@api_eventos_bp.route('/novo_usuario', methods=['POST']) #TODO: mudar a rota no Bubble
@spec.validate(body=Request(UserRequest), headers=AuthHeader, resp=Response('HTTP_403', 'HTTP_200'), tags=['Plan'])
def novo_usuario():

    data = request.get_json()
    user = User(**data)
    if not user.email:
        return jsonify("Email não informado"), 422

    brevo = BrevoService()

    resposta = brevo.create_user(user)

    if resposta is None:
        return jsonify("Erro ao criar usuário"), 500

    user = UserService().set_user_token(user)
    if user is None:
        return jsonify("Erro ao criar token do usuário. Usuário não encontrado."), 500

    evento = EventoFactory().create_evento(EventoFactory().BOASVINDAS, user)
    evento.execute(user)

    return jsonify("Usuário criado com sucesso"), 201

@api_eventos_bp.route('/convite', methods=['POST'])
def envia_convite():

    data = request.get_json()

    user_id = data['user_id']
    empresa = data['empresa']
    
    dto = UserDTO(BubbleAPIService())
    user = dto.get_by_id(user_id)
    if not user:
        return jsonify(f"Usuário não encontrado."), 404
    
    evento = EventoFactory().create_evento(EventoFactory().CONVITE, user)
    evento.execute(user, empresa)
    return jsonify("Email enviado"), 201
