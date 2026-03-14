from datetime import datetime
from enum import Enum
import re
from pydantic import BaseModel, Field
from typing import List, Optional

class TipoMetrica(Enum):
    AUMENTAR = "Aumentar até"
    REDUZIR = "Reduzir até"
    SIM_NAO = "Sim/Não"
    
    def __eq__(self, other):
        if isinstance(other, TipoMetrica):
            return self.value == other.value
        if isinstance(other, str):
            return self.value == other
        return NotImplemented
    

class KeyResult(BaseModel):
    id:                   Optional[str] = Field(alias="_id")
    unit:                 str = Field(..., alias="Unidade")
    tipo_metrica:         str = Field(..., alias="Tipo_metrica")
    descricao:            str = Field(alias="Descricao")
    peso:                 Optional[float] = Field(alias="Peso")
    progresso:            Optional[int] = Field(alias="Progresso")
    progresso_ponderado:  Optional[int] = Field(alias="Progresso_ponderado")
    value:                float = Field(..., alias="Valor") # Valor final
    valor_inicial:        Optional[float] = Field(alias="Valor Inicial")
    valor_atual:          Optional[float] = Field(alias="Valor Atual")
    status:               Optional[str] = Field(alias="Status")
    modified_date:        Optional[datetime] = Field(alias="Modified Date")
    created_date:         Optional[datetime] = Field(alias="Created Date")
    created_by:           Optional[str] = Field(alias="Created By")
    falta_atualizar:      Optional[bool] = Field(default=False, alias="Falta atualizar")

    class Config:
        populate_by_name = True

    @classmethod
    def create_from_dict(cls, data):

        return KeyResult(id=data['id'], rc=data['rc'])

    # # attributes
    # def __init__(self,id, rc):
    #     self.id = id
    #     self.rc = rc

    def save(self):
        return self.__dict__()


    def json_bubble(self):
        # os nomes diferem da estrutura do objeto para ficarem compatíveis com o Bubble
        return {
            'Descricao': self.descricao,
            'Unidade': self.unit,
            'Valor': self.value,
            'Tipo_metrica': "Aumentar até" if self.tipo_metrica == 'Aumentar' else "Reduzir até"
        }

    # __str__
    def __str__(self):
        return f"RC{self.id}: {self.descricao}"


    def __eq__(self, other):
        if isinstance(other, KeyResult):
            return self.__dict__ == other.__dict__
        return False
