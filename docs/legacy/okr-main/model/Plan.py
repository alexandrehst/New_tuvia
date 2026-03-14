# Plan class, with the following attributes: okrs - list of Okr objects, active - boolean, version - numeric
#
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Optional
from model.Okr import Okr

class FrequenciaAtualizacao(Enum):
    UMA_SEMANA = "1_sem"
    DUAS_SEMANAS = "2_sem"
    UM_MES = "1_mes"
    TRES_MESES = "3_mes"
    
    def __eq__(self, other):
        if isinstance(other, FrequenciaAtualizacao):
            return self.value == other.value
        if isinstance(other, str):
            return self.value == other
        return NotImplemented
    
class Permissoes(Enum):
    QUALQUER = "Qualquer"
    AUTORIZADAS = "Autorizadas"
    
    def __eq__(self, other):
        if isinstance(other, Permissoes):
            return self.value == other.value
        if isinstance(other, str):
            return self.value == other
        return NotImplemented
    

class Plan(BaseModel):
    id:                     Optional[str] = Field(default=None, alias='_id')
    title:                  str = Field(alias='Titulo')
    business_info:          Optional[str] = Field(default=None, alias='IA-negocio')
    improvement_needed:     Optional[str] = Field(default=None, alias='IA-melhorar')
    success_indicator:      Optional[str] = Field(default=None, alias='IA-valor')
    okrs:                   Optional[List[Okr]] = Field(alias='Objetivos')
    okr_ids:                Optional[List[str]] = None # for lazy loading
    cliente:                Optional[str] = None
    data_inicio:            Optional[datetime] = Field(alias='Data inicio')
    data_fim:               Optional[datetime] = Field(alias='Data fim')
    departamento:           Optional[str] = Field(default=None, alias='Departamento')
    plano_pai:              Optional['Plan'] = Field(default=None, alias='Plano-pai')
    plano_pai_id:           Optional[str]
    status:                 Optional[str] = Field(alias='Status')
    
    frequencia_atualizacao: Optional[str] = Field(default=None, alias='Frequencia atualizacao')
    permissoes:             Optional[str] = Field(default=None, alias='Permissoes')
    
    tipo:                   Optional[str] = Field(alias='Tipo')
    modified_date:          Optional[datetime] = Field(default=None, alias='Modified Date')
    created_date:           Optional[datetime] = Field(default=None, alias='Created Date')
    created_by:             Optional[str] = Field(default=None, alias='Created By')

    class Config:
        populate_by_name = True

    def __eq__(self, other: 'Plan') -> bool:
        if not isinstance(other, Plan):
            return NotImplemented
        return self.__dict__ == other.__dict__

