from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator

from model.Plan import Plan
from model.User import User

class PlanoUsuario(BaseModel):
    id:                 Optional[str] = Field(default=None, alias='_id')
    papel:              str = Field(alias='Papel')
    plano_id:           Optional[str]  = Field(default=None)
    plano:              Optional[Plan] = Field(alias='Plano')
    usuario_id:         Optional[str] = Field(default=None)
    usuario:            Optional[User] = Field(alias='Usuario')
    modified_date:      Optional[datetime] = Field(default=None, alias='Modified Date')
    created_date:       Optional[datetime] = Field(default=None, alias='Created Date')
    created_by:         Optional[str] = None

    class Config:
        populate_by_name = True

