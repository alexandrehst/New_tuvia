import openai
import os
from service.GPTService import GPTService
import json

properties_resultado_chave = {
                                "Descricao": {"type": "string"},
                                "Valor": {"type": "number"},
                                "Unidade": {"type": "string"},
                                "Tipo_metrica": {
                                    "type": "string",
                                    "enum": ["Aumentar até", "Reduzir até", "Sim/Não"]}
                                }

properties_objetivo = {
                        "Titulo": {"type": "string"},
                        "Resultados-Chave": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "description": "Resultado Chave.",
                                "properties": properties_resultado_chave,
                                "required": ["Descricao", "Valor", "Unidade", "Tipo_metrica"]
                            }
                        }
                    }

functions_plan=[
        {
            "type": "function",
            "function": {
                "name": "generate_strategy",
                "description": "Gere um plano estratégico com três objetivos.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "Objectives": {
                            "type": "array",
                            "description": "Three objectives with key results.",
                            "items": {
                                "type": "object",
                                "description": "Objetivo com três resultados chave.",
                                "properties": properties_objetivo,
                                "required": ["titulo", "Key results"]
                            }
                        }
                    },
                    "required": ["Objectives"]
                }
            }
        }
    ]



functions_objective=[
    {
        "type": "function",
        "function":
        {
            "name": "generate_objective",
            "parameters": {
                "type": "object",
                "properties": {
                    "Objetivo": {
                        "type": "object",
                        "properties": properties_objetivo
                    }
                }
            }
        }
    }
]

functions_kr= [
    {
        "type": "function",
        "function":
        {
            "name": "generate_key_result",
            "parameters": {
                "type": "object",
                "properties": {
                            "Key-result": {
                            "type": "object",
                            "properties": properties_resultado_chave
                            }
                }
            }
        }
    }
]

functions_perguntas= [
    {
        "type": "function",
        "function": {
            "name": "generate_questions",
            "description": "Gere cinco perguntas para o plano estratégico",
            "parameters": {
                "type": "object",
                "properties": {
                    "Questions": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "Uma Pergunta"
                        }
                    }
                }
            }
        }
    }
]

class PlanGenerator:

    def __init__(self, model="gpt-3.5-turbo", temperature=1, max_tokens=1500):
        self.model = GPTService(model, temperature, max_tokens)

    def generate_plan(self, message):
        return self.model.generate(message, functions_plan)

    def generate_objective(self, message):
        return self.model.generate(message, functions_objective)

    def generate_key_result(self, message):
        return self.model.generate(message, functions_kr)

    def generate_perguntas(self, message):
        return self.model.generate(message, functions_perguntas)


