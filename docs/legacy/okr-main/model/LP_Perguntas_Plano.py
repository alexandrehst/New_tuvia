from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator

from model.LP_Tipo_Plano import LP_Tipo_Plano

class LP_Perguntas_Plano(BaseModel):
    id:                 Optional[str] = Field(alias='_id')
    tipo_plano:         Optional[LP_Tipo_Plano] = Field(alias='Tipo_Plano')
    pergunta:           str = Field(alias='Pergunta')
    modified_date:      Optional[datetime] = Field(alias='Modified Date')
    created_date:       Optional[datetime] = Field(alias='Created Date')
    created_by:         Optional[str] = None

    class Config:
        populate_by_name = True

