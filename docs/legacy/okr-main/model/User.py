from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator

class User(BaseModel):
    id:                 str = Field(alias='_id')
    nome:               str = Field(alias='Nome')
    cliente:            str = None
    broker_id:          int = None
    expirado:           bool = None
    telefone:           str = Field(None, alias='Telefone')
    telegram_user_id:   str = None
    token:              str = None
    email:              str = None
    tipo_user:          str = Field(None, alias='Tipo_user')
    status_user:        str = Field(None, alias='Status_user')
    modified_date:      Optional[datetime] = Field(alias='Modified Date')
    created_date:       Optional[datetime] = Field(alias='Created Date')
    created_by:         Optional[str] = None
    atualizacao_email_objetivo:         bool = None
    atualizacao_email_plano:            bool = None
    atualizacao_email_resultado_chave:  bool = None

    class Config:
        populate_by_name = True

    def __init__(self, **data):
        auth_data = data.get('authentication', {}).get('email', {})
        email = auth_data.get('email')
        if email:
            data['email'] = email
        super().__init__(**data)

    def get_nome(self):
        nomes = self.nome.split()
        if len(nomes) > 1:
            return ' '.join(nomes[:-1])
        return self.nome

    def get_sobrenome(self):
        nomes = self.nome.split()
        if len(nomes) > 1:
            return nomes[-1]
        return ''

    def formata_telefone(self):
        if self.telefone is None:
            return ''

        numeros = [c for c in self.telefone if c.isdigit() or (c == '+' and self.telefone.index(c) == 0)]
        return ''.join(numeros)