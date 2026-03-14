from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Departamento(BaseModel):
    id: Optional[str] = Field(alias="_id")
    descricao: str = Field(alias="Descricao")
    nome: str = Field(alias="Nome")
    responsavel: Optional[str] = Field(alias="Responsavel")
    created_by: Optional[str] = Field(alias="Created By")
    created_date: Optional[datetime] = Field(alias="Created Date")
    modified_date: Optional[datetime] = Field(alias="Modified Date")
    cliente:            Optional[str] = Field(alias="Cliente")

    class Config:
        populate_by_name = True

    def __str__(self):
        return f"Departamento {self.id}: {self.descricao}"

    def __eq__(self, other):
        if isinstance(other, Departamento):
            return self.__dict__ == other.__dict__
        return False

