import openai
import os
from service.Configurations import Configurations
import json
import logging

logger = logging.getLogger()

class GPTService:

    MODELO_MAIS_PODEROSO = "gpt-4o"	
    MODELO_MAIS_BARATO = "gpt-4o-mini"
    
    def __init__(self, model=MODELO_MAIS_BARATO, temperature=1, max_tokens=1500):
        self.model = model
        self.temperature = temperature
        self.top_p = 1
        self.max_tokens = max_tokens

        openai.api_key= Configurations().api_key


    def generate(self, message, function=None, response_format="text"):

        try:
            response = openai.chat.completions.create(
                model=self.model,
                messages=message,
                response_format={"type": response_format},
                temperature=self.temperature,
                top_p=self.top_p,
                frequency_penalty=0,
                presence_penalty=0,
                tools=function,
                max_tokens=self.max_tokens
            )

            if function is None:

                if response.choices[0].finish_reason != 'stop':
                    logger.error( f'erro ChatGPT: {response.choices[0].finish_reason}')
                    return { 'error': True, 'message': None}
                answer = response.choices[0].message.content
                logger.debug( answer)

                return { 'error': False, 'message': answer}


            if response.choices[0].finish_reason != 'tool_calls':
                return { 'error': True, 'message': None}

            answer = response.choices[0].message.tool_calls[0].function.arguments
            logger.debug( answer)

            return { 'error': False, 'message': json.loads(answer)}
        except Exception as e:
            return { 'error': True, 'message': str(e)}


    @staticmethod
    def print_response_choices(response):
        txt = '\nGenerated Plan\n--------------------\n'
        for r in response['choices']:
            txt += r + '\n'
        txt += '------------------'
        return txt

