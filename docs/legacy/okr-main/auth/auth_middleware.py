from flask import request, jsonify
from functools import wraps
from service.Configurations import Configurations

conf = Configurations()
api_token = conf.api_token

def authenticate_request(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization')
        if token and token.split('Bearer ')[-1] == api_token:
            return func(*args, **kwargs)
        return jsonify({'message': 'Unauthorized'}), 401
    return wrapper
