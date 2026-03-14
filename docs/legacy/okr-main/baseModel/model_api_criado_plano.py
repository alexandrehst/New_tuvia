from pydantic import BaseModel, Field
from typing import List, Optional
from pydantic import validator
from pydantic import validator

from service.KrService import KrService

class PlanoDepartamentoRequest(BaseModel):
    # Gernerate fields userId, Title, Business_info
    user_id: str = Field(..., description='Usuário criador do plano')
    plano_corporativo:str  = Field(..., description='Id do plano corporativo')
    departamentos: List[str] = Field(..., description='Lista de IDs dos departamentos')

class PlanoEstrategicoRequest(BaseModel):
    # Gernerate fields userId, Title, Business_info
    id: str = Field(..., description='Id do plano estratético')

class PlanoSimplesRequest(BaseModel):
    # Gernerate fields userId, Title, Business_info
    id: str = Field(..., description='Id do plano')
    descricao:str  = Field(..., description='Descrição do plano')
    user_id: str = Field(..., description='Usuário criador do plano')

