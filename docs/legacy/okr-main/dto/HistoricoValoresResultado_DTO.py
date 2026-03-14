from dto.dto import dto  # Supondo que há uma base dto importável
from typing import Optional
from datetime import datetime
from model.HistoricoValoresResultadoChave import HistoricoValoresResultadoChave


class HistoricoValoresResultadoChaveDTO(dto):

    def __init__(self, service, historico_valores_resultado_chave=None):
        super().__init__(service)
        self.type = self.service.HISTORICO_VALORES_RESULTADO_CHAVE
        self.historico_valores_resultado_chave = historico_valores_resultado_chave

    def _map(self, data: dict) -> 'HistoricoValoresResultadoChave':
        self.historico_valores_resultado_chave = HistoricoValoresResultadoChave(**data)
        return self.historico_valores_resultado_chave
    
    def get_historico_by_kr(self, kr_id: str):
        constraints = [
            { "key": "resultadochave",
             "constraint_type": "equals",
            "value": kr_id
            }
        ]

        result = self.get_by_constraint(constraint=constraints, sort_field="datadoregistro", descending=True, limit=1)

        return result
