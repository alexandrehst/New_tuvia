from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional
from model.KeyResult import KeyResult
from model.User import User

class Okr(BaseModel):
    id:                 Optional[str] = Field(default=None, alias='_id')
    titulo:             str = Field(alias='Titulo')
    numero:             Optional[int] = Field(alias='Numero')
    descricao:          Optional[str] = Field(alias='Descricao')
    progresso:          Optional[int] = Field(default=0, alias='Progresso')
    responsaveis:       Optional[List[User]] = Field(default=None, alias='Responsaveis') 
    responsaveis_ids:   Optional[List[str]] = None # for lazy loading
    key_results:        Optional[List[KeyResult]] = Field(default=None, alias='Resultados-Chave')
    key_results_ids:    Optional[List[str]] = None # for lazy loading
    modified_date:      Optional[datetime] = Field(default=None, alias='Modified Date')
    created_date:       Optional[datetime] = Field(default=None, alias='Created Date')
    created_by:         Optional[str] = Field(default=None, alias='Created By') 

    class Config:
        populate_by_name = True

    def to_dict(self):
        return {
                    'title': self.title,
                    'key_results-Chave': [kr.to_dict() for kr in self.key_results],
                }

    def json_bubble(self):
        # os nomes diferem da estrutura do objeto para ficarem compatíveis com o Bubble
        return {
                    'Titulo': self.titulo,
                }


