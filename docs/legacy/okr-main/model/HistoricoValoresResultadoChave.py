from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class HistoricoValoresResultadoChave(BaseModel):
    modified_date: Optional[datetime] = Field(alias="Modified Date", description="Data da última modificação")
    created_date: Optional[datetime] = Field(alias="Created Date", description="Data de criação")
    created_by: Optional[str] = Field(alias="Created By", description="Criado por (ID do usuário)")
    resultado_chave: Optional[str] = Field(alias="Resultado Chave", description="Resultado-chave (ID)")
    valor: Optional[int] = Field(alias="Valor", description="Valor")
    data_do_registro: Optional[datetime] = Field(alias="Data do Registro", description="Data do registro")
    id: str = Field(alias="_id", description="Identificador único")

    class Config:
        allow_population_by_field_name = True
