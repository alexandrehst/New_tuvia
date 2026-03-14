import asyncio
import json
from dto.KeyResult_dto import KeyResultDTO
from model.KeyResult import KeyResult
from service.BubbleAPIService import BubbleAPIService
import logging
from datetime import datetime, timezone

logger = logging.getLogger()

class KrService:

    # tipos de resultados chave
    AUMENTAR = "Aumentar até"
    REDUZIR = "Reduzir até"
    SIM_NAO = "Sim/Não"
    TIPOS_VALIDOS = [ AUMENTAR, REDUZIR, SIM_NAO]

    # Tipos de riscos
    RISCO_ALTO = "Risco alto"
    EM_RISCO = "Em risco"
    EM_ATRASO = "Em atraso"
    NO_PRAZO = "No prazo"

    dto = KeyResultDTO(BubbleAPIService())


    @classmethod
    def create_from_answer(cls, answer):

        # check if 'key-result' is in the answer
        if 'Key-result' in answer:
            kr_answer = answer['Key-result']
        elif 'Key-result?' in answer:
            # as vezes o chatgpt está retornando essa chave
            kr_answer = answer['Key-result?']
        else:
            return None

        if 'Sequence' not in kr_answer:
            kr_answer['Sequence'] = '1' # essa sequencia não é realemente usada, então, setando o valor 1

        if 'Value' not in kr_answer:
            kr_answer['Value'] = '0' # As vezes a IA não gera um valor, então, setando o valor 0 para ao menos gerar o KR

        try:
            kr = KeyResult(**kr_answer)
        except Exception as e:
            logger.error(f"Error creating KeyResult from answer: {e}")
            return None

        logger.info( f'\n\n-------------------Create from answer KR \n{kr}')
        return kr

    @classmethod
    def insere_bulk(cls, krs):
        ids = cls.dto.insert_bulk(krs)

        if ids is None:
            logger.error(f"Erro ao inserir resultados chave")

        for id in ids:
            task = cls.dto.atualiza_valor_inicial(id)


        return ids

    @classmethod
    def get_resultadoschave(cls, ids):
        result = cls.dto.get_by_ids(ids)

        if result is None:
            logger.error(f"Erro ao buscar resultados chave")

        return result

    @classmethod
    def set_resultadoschave_valor(cls, kr, comentario:str):
        """
        Sets the key result and updates the current value.

        Args:
            kr: The key result to be set.
            comentario: The comment to be added as user comment.

        Returns:
            The updated current value.
        """
        cls.dto.keyresult = kr

        return cls.dto.set_valor_atual(comentario)
    
    @classmethod
    def set_falta_atualizar(cls, kr, valor=True):
        if kr.falta_atualizar == valor:
            return kr

        logger.debug(f"Setting 'Falta atualizar' to {valor} for KeyResult {kr.id}")
        cls.dto.keyresult = kr

        return cls.dto.set_falta_atualizar(valor=valor)


    @classmethod
    def delete(cls, kr_id):
        
        return cls.dto.delete(kr_id)

    # receber parametros de cálculo e devolver o risco

    
    @classmethod
    def calculate_risk(cls, data_inicial, data_final, valor_atual, valor_inicial, valor_final, tipo="aumentar", data_calculo=None):
        # esse método não recebe um Kr, mas sim os valores, porque é chamado na API sem necessidade de busca o banco
        # A fórmula calcula o rispo para resultados chave do tipo aumentar ou reduzir. Para outros casos, não se aplica

        if not valor_atual:
            if tipo == cls.AUMENTAR:
                valor_atual = valor_inicial
            elif tipo == cls.REDUZIR:
                valor_atual = valor_final
        try:
            if data_calculo is None:
                data_calculo = datetime.now(timezone.utc)

            if tipo not in cls.TIPOS_VALIDOS:
                return "Não se aplica"
            
            if data_calculo.tzinfo is None: # se não tiver timezone, seta para UTC
                data_calculo = data_calculo.replace(tzinfo=timezone.utc)

            if data_inicial.tzinfo is None: # se não tiver timezone, seta para UTC
                data_inicial = data_inicial.replace(tzinfo=timezone.utc)

            if data_final.tzinfo is None: # se não tiver timezone, seta para UTC
                data_final = data_final.replace(tzinfo=timezone.utc)

            if (data_calculo - data_inicial).days == 0: # se o cálculo for feito no mesmo dia que o início, o risco é alto
                return cls.NO_PRAZO

            # Calculate prazo
            prazo = (data_final - data_inicial).days

            if tipo ==cls.AUMENTAR:
                valor_esperado = (valor_final - valor_inicial) / prazo
                valor_esperado_hoje = (data_calculo - data_inicial).days * valor_esperado
                diff = (valor_atual - valor_esperado_hoje) / valor_esperado_hoje
            else:
                valor_esperado = (valor_inicial - valor_final) / prazo
                valor_esperado_hoje = valor_inicial - (data_calculo - data_inicial).days * valor_esperado
                diff = (valor_atual - valor_esperado_hoje) / valor_esperado_hoje * -1
        except Exception as e:
            logger.error(f"Error calculating risk: {e}. Parameters: data_inicial={data_inicial}, data_final={data_final}, valor_atual={valor_atual}, valor_inicial={valor_inicial}, valor_final={valor_final}, tipo={tipo}, data_calculo={data_calculo}")
            return None

        # Determine the risk level based on the difference
        if diff < -0.5:
            risk = cls.RISCO_ALTO
        elif diff < -0.25:
            risk = cls.EM_RISCO
        elif diff < 0:
            risk = cls.EM_ATRASO
        else:
            risk = cls.NO_PRAZO

        logger.info(f"Risk calculated: {risk} ({diff})")

        return risk


    #Implementação do cálculo do risco dos krs

    # metodo que faz para todos os planos
    #    Na API, declaração do método
    #    em planoservice,
    #        Busca todos os planos ativos, todos os objetivos, todos os krs
    #        Para cada kr, calcula o risco
    #           Em KRservice, desempacota e chama calculate_risk


    @classmethod
    def calculate_progress(cls, tipo_metrica, valor_inicial, valor_alvo, novo_valor ):

        valor = valor_alvo

        # Atualiza, se valor inicial não é 0
        if tipo_metrica == cls.REDUZIR:
            progresso = round( (1 - ( novo_valor - valor_alvo) / (valor_inicial - valor_alvo)) * 100)
        else:
            progresso = round( (novo_valor - valor_inicial) / (valor_alvo - valor_inicial) * 100)

        logger.info( f'Tipo: {tipo_metrica}, Valor inicia: {valor_inicial}, valor alvo: {valor_alvo}, novo valor: {novo_valor}, progresso: {progresso} ')
        return progresso

