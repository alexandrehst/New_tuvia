from datetime import datetime
import unittest
from unittest.mock import MagicMock
from dto.PlanoEstrategico_dto import PlanoEstrategicoDTO

class MockService():
    PLANO = 'plano'
    OBJETIVO = 'objetivo'
    RESULTADO_CHAVE = 'resultadochave'
    USER =  'user'
    PLANO_ESTRATEGICO = "planoestrategico"

    @classmethod
    def get_generic_by_constraint(cls, type:str, constraint:dict):
        if type == cls.PLANO:
            return {'error': False,
                    'plano':
                        [
                            {
                                "Modified Date": "2024-04-18T12:40:21.731Z",
                                "Created Date": "2024-04-16T20:29:13.575Z",
                                "Created By": "admin_user_tuvia---pe_test",
                                "Data inicio": "2024-04-16T03:00:00.000Z",
                                "Data fim": "2024-06-16T03:00:00.000Z",
                                "IA-melhorar": "Alcançar uma base de clientes, MMR de 10k",
                                "IA-negocio": "Empresa de desenvolvimento de softwares de gestão para pme's",
                                "IA-valor": "10000",
                                "Titulo": "Plano de lançamento TUVIA AI",
                                "Status": "Publicado",
                                "Objetivos": [
                                    "1713299353130x414521342643671550",
                                    "1713299353135x928627349251988500",
                                    "1713299353147x811861430185860000"
                                ],
                                "Tipo": "Plano corporativo",
                                "cliente": "1713299178331x640660779433463300",
                                "_id": "1713299353575x844115147461756300"
                            },
                            {
                                "Modified Date": "2024-04-18T12:40:10.978Z",
                                "Created Date": "2024-04-17T16:43:15.105Z",
                                "Created By": "admin_user_tuvia---pe_test",
                                "Data inicio": "2024-04-01T03:00:00.000Z",
                                "Data fim": "2024-06-30T03:00:00.000Z",
                                "IA-melhorar": "Adquirir base de clientes recorrentes que gere o MMR de R$ 10.000,00",
                                "IA-negocio": "Empresa de desenvolvimento de software para gestão de negócios",
                                "IA-valor": "10000",
                                "Titulo": "Meu primeiro plano",
                                "Status": "Publicado",
                                "Objetivos": [
                                    "1713372194790x281785834263013730",
                                    "1713372194795x793423992927196400",
                                    "1713372194811x516213171716712450",
                                    "1713372341924x771285652133084900"
                                ],
                                "Tipo": "Plano corporativo",
                                "cliente": "1713371728799x558605515472845300",
                                "_id": "1713372195105x386933276251914000"
                            }
                        ]
            }
        return {'error': True}

class TestPlanoEstrategicoDTO(unittest.TestCase):

    def setUp(self):
        self.service = MockService()
        self.keyresult_mock = MagicMock()
        self.dto = PlanoEstrategicoDTO( self.service )
        self.plano_estrategico_json = {
                                            "_id": "1730934578042x826145294393278500",
                                            "Modified Date": "2024-11-08T18:32:13.829Z",
                                            "Created Date": "2024-11-06T23:09:38.980Z",
                                            "Created By": "1712602220283x155804620698294820",
                                            "Descricao do negocio": "Clinica especializada em diagnósticos por imagem",
                                            "Cliente": "1712601227283x577580915930753700",
                                            "Missao": "Fornecer diagnósticos por imagem precisos para melhorar a saúde dos pacientes.",
                                            "Ramo": "Clinica Médica",
                                            "Valores": [
                                                "Excelência Profissional: Buscamos os mais altos padrões de qualidade em cada diagnóstico que realizamos.",
                                                "Inovação Tecnológica: Estamos comprometidos em utilizar tecnologias de ponta para proporcionar diagnósticos precisos e rápidos.",
                                                "Empatia e Cuidado: Valorizamos o atendimento humano e personalizado para garantir conforto e segurança aos nossos pacientes.",
                                                "Ética e Integridade: Mantemos os mais elevados padrões éticos em todas as nossas interações, assegurando a confiança dos pacientes.",
                                                "Colaboração Multidisciplinar: Incentivamos o trabalho em equipe entre diferentes especialidades para um diagnóstico mais completo e eficaz."
                                            ],
                                            "Visao": "Expandir nossos serviços para incluir as tecnologias de ponta em diagnósticos por imagem.",
                                            "Comecar": [
                                                "Investir em um departamento de Marketing",
                                                "Reformular a cultura, Cultura 2.0",
                                                "Investir em tecnologia (IA)"
                                            ],
                                            "Parar": [
                                                "poarar aqui",
                                                "cutucar o nariz"
                                            ],
                                            "Manter": [
                                                "uma coisa",
                                                "outra coisa"
                                            ],
                                            "Onde estamos": "Está tudo indo mais ou menos bem",
                                            "Oportunidades": [
                                                "oportunidade 1",
                                                "ops 2"
                                            ],
                                            "Ameacas": [
                                                "Godzilla",
                                                "Sauron"
                                            ],
                                            "Plano": "1730927433976x851859907284303900"
                                        }

    def test_init(self):
        self.assertEqual(self.dto.type, self.service.PLANO_ESTRATEGICO)

    def test_map(self):
        data = self.plano_estrategico_json

        planoEstrategico = self.dto._map(data)

        self.assertEqual(planoEstrategico.id, "1730934578042x826145294393278500")
        self.assertEqual(planoEstrategico.ramo, "Clinica Médica")


if __name__ == '__main__':
    unittest.main()