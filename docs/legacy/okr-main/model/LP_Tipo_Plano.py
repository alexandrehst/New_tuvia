from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator

class LP_Tipo_Plano(BaseModel):
    id:                 Optional[str] = Field(alias='_id')
    descricao:          str = Field(alias='Descricao')
    modified_date:      Optional[datetime] = Field(alias='Modified Date')
    created_date:       Optional[datetime] = Field(alias='Created Date')
    created_by:         Optional[str] = None

    class Config:
        populate_by_name = True

