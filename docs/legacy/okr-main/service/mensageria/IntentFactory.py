from service.GPTService import GPTService
from service.mensageria.Intent import IntentAjuda, IntentPlano, IntentObjetivo, IntentResultadoChave, IntentSaudacao

tools = [
    {
        "type": "function",
        "function":
        {
            "name": "generate_strategy",
            "parameters":
            {
                "type": "object",
                "properties":
                {
                    "Intensao": {
                        "type": "string",
                        "enum": ["Ver planos", "Ver objetivos", "resultado chave", "Outro", "Saudação", "Ajuda"]
                    },
                    "assunto":{
                        "type": "string"
                    },
                    "qualificador assunto": {
                        "type": "string"
                    },
                    "valor": {
                        "type": "number"

                    }
                }
            }
        }
    }
  ]

class IntentFactory:
    def __init__(self):
        self.gpt = GPTService()

    def build(self, message: str,):
        messages = [
            {"role": "system", "content": "Atuando como um chatbot, identifique a intenção da mensagem."},
            {"role": "user", "content": message }
        ]
        answer = self.gpt.generate(messages, tools)

        if answer['error']:
            return None

        data = answer.get('message')

        intent = data.get('Intensao') if data else None
        if intent is None:
            intent = 'Outro'

        if intent == 'Ver planos':
            return IntentPlano()
        elif intent == 'Ver objetivos':
            return IntentObjetivo()
        elif intent == 'resultado chave':
            return IntentResultadoChave( data )
        elif intent == 'Saudação':
            return IntentSaudacao(  )
        elif intent == 'Ajuda':
            return IntentAjuda()
        else:
            return None