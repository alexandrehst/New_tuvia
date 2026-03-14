from pydantic import BaseModel, Field
from typing import List, Optional
from pydantic import validator
from pydantic import validator

from service.KrService import KrService

class PlanRequest(BaseModel):
    # Gernerate fields userId, Title, Business_info
    user_id: str = Field(..., description='Identificador único do contexto. Pode ser, por exemplo, usuario + plano')
    title: str= Field( ..., description='Título do plano.')
    business_info: str= Field( ..., description='Descrição do negócio.')
    improvement_needed: str = Field(..., description='Quais as áreas a serem melhoradas.')
    success_indicator: str= Field(..., description='Valor da melhoria')

class PlanDetailRequest(BaseModel):
    # Gernerate fields userId, Title, Business_info
    user_id: str = Field( default='001', description='Unique_Id do usuário no Bubble.')
    title: str= Field( default='Plano estratégico 1o Tri', description='Título do plano.')
    business_info: str= Field( default='Uma padaria', description='Descrição do negócio.')
    improvement_needed: str = Field(default='Aumentar a venda de pão francês', description='Quais as áreas a serem melhoradas.')
    success_indicator: str= Field( default='Aumentar em 30%', description='Valor da melhoria')
    depto: str= Field( default='Diretoria financeira', description='Setor ou área para quem o planejamento deve ser refinado')

class PlanId(BaseModel): # Usado em API que recebe apenas o ID do Plano
    id: int = Field( description='Identificador Único do plano')

class PlanResponseKR(BaseModel):
    id: int = Field( description='Identificador Único do KR')
    rc: str= Field( description='Resultado chave')

class PlanResponseOKR(BaseModel):
    id: int = Field( description='Identificador Único do OKR')
    title: str= Field( description='Título do OKR')
    key_results: List[PlanResponseKR]


class PlanResponse(BaseModel):
    title: str= Field( description='Título do plano.')
    business_info: str= Field( description='Descrição do negócio.')
    improvement_needed: str = Field(description='Quais as áreas a serem melhoradas.')
    success_indicator: str= Field( default='001', description='Valor da melhoria')
    okrs: List[ PlanResponseOKR]

class ObjectiveRequest(BaseModel):
    # Gernerate fields userId, Title, Business_info
    user_id: str = Field( ..., description='Unique_Id do usuário no Bubble.')
    business_info: str= Field( ..., description='Descrição do negócio.')
    improvement_needed: str = Field(..., description='Quais as áreas a serem melhoradas.')
    success_indicator: str= Field(...,  description='Valor da melhoria')
    objectives: List[str] = Field(..., description='Lista de objetivos')

    @validator('objectives', pre=True)
    def check_objectives(cls, v):
        if len(v) <= 1:
            raise ValueError('objectives must contain more than one item')
        return v

class ObjectiveResponse(BaseModel):
    # Gernerate fields userId, Title, Business_info
    objective_id: str = Field(description='Id do objetivo incluído')

class ChatMessage(BaseModel):
    user_id: str = Field(description='O id do usuário que está enviando o token no broker de comunicação')
    message: str = Field(description='Mensagem enviada para o serviço de conversa')

class CalculateRisk(BaseModel):
    data_inicial: str = Field(description='Initial date')
    data_final: str = Field(description='Final date')
    valor_atual: str = Field(description='Current value')
    valor_inicial: float = Field(description='Initial value')
    valor_final: float = Field(description='Final value')
    tipo: str = Field(description='Tipo da métrica')
    data_calculo: Optional[str] = Field(default=None, description='Calculation date')

class UserRequest(BaseModel):
    _id:      str
    nome:     str
    telefone: str
    email:    str
    