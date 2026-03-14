from datetime import datetime
import re
from pydantic import BaseModel, Field
from typing import List, Optional

from model.KeyResult import KeyResult

class ResultadoChaveLinhaTendencia(BaseModel):
    id:                   Optional[str] = Field(alias="_id")
    data:                 Optional[datetime] = Field(alias="Data")
    valor:                float = Field(..., alias="Valor")
    resultado_chave_id:   Optional[str] = Field(alias="Resultado_chave_id")
    resultado_chave:      Optional[KeyResult] = Field(alias="Resultado Chave")
    modified_date:        Optional[datetime] = Field(alias="Modified Date")
    created_date:         Optional[datetime] = Field(alias="Created Date")
    created_by:           Optional[str] = Field(alias="Created By")

    class Config:
        populate_by_name = True
