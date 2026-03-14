import json

import requests
from model.Plan import Plan
from model.Okr import Okr
from service.Configurations import Configurations
from datetime import datetime, timedelta
import logging

logger = logging.getLogger()


class BubbleAPIService:

    conf = Configurations()

    header_text = { 'Authorization': f'Bearer {conf.bubble_api}',
                'Content-Type': 'text/plain'
                }

    header_json = { 'Authorization': f'Bearer {conf.bubble_api}',
                'Content-Type': 'application/json'
                }

    PLANO = 'plano'
    OBJETIVO = 'objetivo'
    RESULTADO_CHAVE = 'resultadochave'
    USER =  'user'
    PLANO_USUARIO = 'planousuario'
    TIPO_PLANO = 'lp_tipo_plano'
    PERGUNTAS_PLANO = 'lp_perguntas_plano'
    PLANO_ESTRATEGICO = 'planoestrategico'
    DEPARTAMENTO = 'departamento'
    RESULTADO_CHAVE_LINHA_TENDENCIA = 'resultadochavelinhatendencia'
    HISTORICO_VALORES_RESULTADO_CHAVE= 'historico_valores_resultado_chave'	
    VALID_TYPES = [PLANO, 
                   OBJETIVO, 
                   RESULTADO_CHAVE, 
                   USER, 
                   PLANO_USUARIO, 
                   TIPO_PLANO, 
                   PERGUNTAS_PLANO, 
                   PLANO_ESTRATEGICO, 
                   DEPARTAMENTO, 
                   RESULTADO_CHAVE_LINHA_TENDENCIA,
                   HISTORICO_VALORES_RESULTADO_CHAVE]

    plan_api_bubble = f'{conf.bubble_api_address}/plano'
    objetivo_api_bubble = f'{conf.bubble_api_address}/objetivo'
    resultado_chave_api_bubble = f'{conf.bubble_api_address}/resultadochave'
    plano_usuario_api_bubble = f'{conf.bubble_api_address}/planousuario'
    usuario_api_bubble = f'{conf.bubble_api_address}/user'
    okr_api_bubble = f'{conf.bubble_api_address}/objetivo/bulk'
    kr_api_bubble = f'{conf.bubble_api_address}/resultadochave/bulk'
    historico_valores_resultado_chave_api_bubble = f'{conf.bubble_api_address}/historicovaloresresultadochave'

    wf_atualiza_kr_inicial = f'{conf.bubble_api_wf}/atualiza-kr-api-inicial'


    @classmethod
    def get_generic_by_id(cls, id:str, type:str):
        """
        Retrieves generic data by ID from the Bubble API.

        Args:
            ids (str): The IDs of the data to retrieve.
            type (str): The type of the items. Valid values are 'plano', 'objetivo', 'resultado_chave', or 'user'.

        Returns:
            dict: A dictionary containing the retrieved data or an error message.

        Raises:
            requests.RequestException: If there is a connection error or timeout.
            requests.exceptions.HTTPError: If the HTTP request returns an error status code.
        """

        if type not in cls.VALID_TYPES:
            return { 'error': True, 'message': 'Tipo inválido'}

        api_link = f"{cls.conf.bubble_api_address}/{type}/{id}"

        try:
            resp = requests.get(api_link, headers=cls.header_json)
            resp.raise_for_status() # raise exception if status_code is error

        except requests.RequestException as e:
            # Handle connection errors, timeouts, and other request exceptions
            logger.error(f"Erro na chamada da API Bubble: id {id}, type {type}, Exceção {e}")
            return { 'error': True, 'message': e}
        except requests.exceptions.HTTPError as err:
            return { 'error': True, 'message': err}

        valores = resp.json()['response']

        return { 'error': False, type: valores }

    @classmethod
    def get_generic_by_id_list(cls, ids:list, type:str):
        """
        Retrieve generic items by their IDs.

        Args:
            ids (list): A list of IDs of the items to retrieve.
            type (str): The type of the items. Valid values are 'plano', 'objetivo', 'resultado_chave', or 'user'.

        Returns:
            dict: A dictionary containing the retrieved items if successful, or an error message if unsuccessful.
        """
        if type not in cls.VALID_TYPES:
            return { 'error': True, 'message': 'Tipo inválido'}

        api_link = f"{cls.conf.bubble_api_address}/{type}"

        constraints = [{ "key": "_id","constraint_type": "in","value": ids}]
        try:
            constraints_json = json.dumps(constraints)
            resp = requests.get(api_link, headers=cls.header_json, params= {"constraints": constraints_json})
            resp.raise_for_status() # raise exception if status_code is error

        except requests.RequestException as e:
            # Handle connection errors, timeouts, and other request exceptions
            logger.error(f"Erro na chamada da API Bubble: ids {ids}, type {type}, Exceção {e}")
            return { 'error': True, 'message': e}
        except requests.exceptions.HTTPError as err:
            return { 'error': True, 'message': err}

        valores = resp.json()['response']['results']
        return { 'error': False, 'valores': valores }

    @classmethod
    def get_generic_by_constraint(cls, type, constraint, sort_field=None, descending=None, limit=None):
        """
        Retrieves generic data from the Bubble API based on the given constraints.

        Args:
            cls (class): The class object.
            type (str): The type of the items. Valid values are 'plano', 'objetivo', 'resultado_chave', or 'user'.
            constraint (dict): The constraints to apply to the data retrieval.
            value (str): The value to search for.

        Returns:
            dict: A dictionary containing the retrieved data or an error message.

        Raises:
            requests.RequestException: If there is a connection error or timeout.
            requests.exceptions.HTTPError: If the HTTP request returns an error status code.
        """
        if type not in cls.VALID_TYPES:
            return { 'error': True, 'message': 'Tipo inválido'}

        api_link = f"{cls.conf.bubble_api_address}/{type}"

        try:
            constraints_json = json.dumps(constraint)
            params= {"constraints": constraints_json}
            if sort_field:
                params['sort_field'] = sort_field
            if descending:
                params['descending'] = descending
            if limit:
                params['limit'] = limit
            
            resp = requests.get(api_link, headers=cls.header_json, params=params)
            resp.raise_for_status() # raise exception if status_code is error

        except requests.RequestException as e:
            # Handle connection errors, timeouts, and other request exceptions
            logger.error(f"Erro na chamada da API Bubble: type {type}, constraint {constraint} Exceção {e}")
            return { 'error': True, 'message': e}
        except requests.exceptions.HTTPError as err:
            return { 'error': True, 'message': err}
        valor = resp.json()['response']['results']
        return { 'error': False, type: valor }


    @classmethod
    def update_generic(cls, type, id, key, valor):
        if type not in cls.VALID_TYPES:
            return { 'error': True, 'message': 'Tipo inválido'}

        payload = json.dumps({key: valor})
        try:
            url = f"{cls.conf.bubble_api_address}/{type}/{id}"
            resp = requests.patch(url, headers=cls.header_json, data=payload)
            resp.raise_for_status() # raise exception if status_code is error

            if resp.status_code != 204:
                logger.error(f"Erro na atualização do valor: type {type}, id {id}, status_code {resp.status_code}")
                return { 'error': True, 'message': f"Erro na atualização do valor: type {type}, id {id}, status_code {resp.status_code}"}

        except requests.RequestException as e:
            # Handle connection errors, timeouts, and other request exceptions
            logger.error(f"Erro na atualização do valor: type {type}, id {id} Exceção {e}")
            return { 'error': True, 'message': e}

        return { 'error': False }

    @classmethod
    def delete(cls, type, id):
        if type not in cls.VALID_TYPES:
            return { 'error': True, 'message': 'Tipo inválido'}

        try:
            url = f"{cls.conf.bubble_api_address}/{type}/{id}"
            resp = requests.delete(url, headers=cls.header_json)
            resp.raise_for_status() # raise exception if status_code is error

            if resp.status_code != 204:
                logger.error(f"Erro na exclusao do valor: type {type}, id {id}, status_code {resp.status_code}")
                return { 'error': True, 'message': f"Erro na exclusao do valor: type {type}, id {id}, status_code {resp.status_code}"}

        except requests.RequestException as e:
            # Handle connection errors, timeouts, and other request exceptions
            logger.error(f"Erro na exclusao do valor: type {type}, id {id} Exceção {e}")
            return { 'error': True, 'message': e}

        return { 'error': False }


    @classmethod
    def insert(cls, type, value):

        if type not in cls.VALID_TYPES:
            return { 'error': True, 'message': 'Tipo inválido'}

        #payload = json.dumps(value)
        payload = value
        try:
            url = f"{cls.conf.bubble_api_address}/{type}"
            resp = requests.post(url, data= payload, headers=cls.header_json )
            resp.raise_for_status() # raise exception if status_code is error

        except requests.RequestException as e:
            # Handle connection errors, timeouts, and other request exceptions
            return { 'error': True, 'message': resp.json()}
        except requests.exceptions.HTTPError as err:
            return { 'error': True, 'message': err}

        id = resp.json()['id']

        return {'error':False, 'ids':id}

    @classmethod
    def insert_bulk(cls, type, values:str):

        if type not in cls.VALID_TYPES:
            return { 'error': True, 'message': 'Tipo inválido'}

        try:
            url = f"{cls.conf.bubble_api_address}/{type}/bulk"
            resp = requests.post(url, data= values, headers=cls.header_text )
            resp.raise_for_status() # raise exception if status_code is error

        except requests.RequestException as e:
            # Handle connection errors, timeouts, and other request exceptions
            logger.error(f"Erro na chamada da API Bubble: type {type}, {resp.content}")
            return { 'error': True, 'message': 'Erro na gravação'}
        except requests.exceptions.HTTPError as err:
            return { 'error': True, 'message': err}

        lines = resp.content.decode().split('\n')
        ids = [json.loads(line)['id'] for line in lines if line.strip()]

        return {'error':False, 'ids':ids}

    @classmethod
    def atualiza_resultado_chave_inicial(cls, id):

            data = {
                "resultado-chave": id
            }
            resp = requests.post(cls.wf_atualiza_kr_inicial, json=data, headers=cls.header_json )

            return {'error': resp.status_code != 200 }


    #### ^^ acima - código já refatorado  -----------------------------------------------------------
    #TODO: Ver se esse método é chamado de algum lugar e tirar. O historico é chamado no método de atualização
    @classmethod
    def set_historico_valores_resultado_chave_bubble(cls, kr_id:str, value:float):
        data = {
            "Resultado-chave": kr_id,
            "Valor": value
        }

        try:
            resp = requests.post(cls.historico_valores_resultado_chave_api_bubble, json= data, headers=cls.header_json )
            resp.raise_for_status() # raise exception if status_code is error

        except requests.RequestException as e:
            # Handle connection errors, timeouts, and other request exceptions
            return { 'error': True, 'message': e}
        except requests.exceptions.HTTPError as err:
            return { 'error': True, 'message': err}

        return { 'error': False, 'id': resp.json()['id'] }


    @classmethod
    def set_user_telegram_id(cls, id, valor):
        payload = json.dumps({"telegram_user_id": valor})
        try:
            url = cls.usuario_api_bubble + f'/{id}'
            resp = requests.patch(url, headers=cls.header_json, data=payload)
            resp.raise_for_status() # raise exception if status_code is error

        except requests.RequestException as e:
            # Handle connection errors, timeouts, and other request exceptions
            return { 'error': True, 'message': e}
        except requests.exceptions.HTTPError as err:
            return { 'error': True, 'message': err}

        return { 'error': False }
