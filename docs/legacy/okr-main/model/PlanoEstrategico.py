from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional
from model.Plan import Plan
from model.Departamento import Departamento

class PlanoEstrategico(BaseModel):

    id: str = Field(alias="_id", description="Identificador único")
    modified_date: Optional[datetime] = Field(alias="Modified Date", description="Data de modificação")
    created_date: Optional[datetime] = Field(alias="Created Date", description="Data de criação")
    created_by: Optional[str] = Field(alias="Created By", description="Criado por")
    descricao_do_negocio: str = Field(alias="Descricao do negocio", description="Descrição do negócio")
    missao: str = Field(alias="Missao", description="Missão")
    ramo: str = Field(alias="Ramo", description="Ramo")
    valores: List[str] = Field(alias="Valores", description="Valores")
    visao: str = Field(alias="Visao", description="Visão")
    comecar: List[str] = Field(alias="Comecar", description="Ações a começar")
    parar: List[str] = Field(alias="Parar", description="Ações a parar")
    manter: List[str] = Field(alias="Manter", description="Ações a manter")
    onde_estamos: str = Field(alias="Onde estamos", description="Situação atual")
    oportunidades: List[str] = Field(alias="Oportunidades", description="Oportunidades")
    ameacas: List[str] = Field(alias="Ameacas", description="Ameaças")
    data_inicio:        Optional[datetime] = Field(alias='Data inicio')
    data_fim:           Optional[datetime] = Field(alias='Data fim')
    cliente: str = Field(alias="Cliente", description="Cliente")


    # Campos que são listas de objetos
    plano: Optional[Plan] = Field(default=None, alias="Plano", description="Plano ligado ao plano estratégico")
    plano_id: Optional[str]

    departamentos: Optional[List[Departamento]] = Field(default_factory=list, alias="Departamentos", description="Lista de departamentos")
    departamentos_ids: Optional[List[str]]

    class Config:
        populate_by_name = True