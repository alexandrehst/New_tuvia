from pydantic import BaseModel, Field


class AtualizaKRLTRequest(BaseModel):
    # Gernerate fields userId, Title, Business_info
    id: str = Field(..., description='Id do resultado chave a ser atualizado')
    data_inicial: str = Field(description='Data inicial da linha de tendência')
    data_final: str = Field(description='Data final da linha de tendência')

