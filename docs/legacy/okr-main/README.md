OKR

# Arquitetura básica

## API e controle

app ----> CTRL

app.py é a exposição da API. Ela só deve conter tratamento de parametros e devolução de respostas

Todo processamento deve ser feito a partir da chamada dos métodos da classe de controle.

## Persistência e recuperação

DTO é a classe que faz o meio de campo entre o serviço de persistência e o resto do sistema. DTO sempre retorna um objeto ou coleção de objetos. None se não tem sucesso na consulta.

Service: classe abstrata de serviços. BubbleAPIService é a classe de busca e persistência via API Bubble. Retorna JSON e descrição do erro. Uma _rule of thumb_ é que nas classes de service e controle não deve haver acesso a estruturas internas em sintaxe JSON (i.e: plano['titulo'] é errado)

classes de serviço ou controle  ---> DTO ---> Service

### Como construir um model e um DTO
1. Faça uma chamada no postman, para recuperar um elemento do objeto
1. Use o seguinte prompt, mudando apenas o json e o nome da classe no final:
```
A partir do json abaixo, crie um model em python. Essa classe deve ser uma herança de pydantic basemodel. 

Campos que são lista de objeto são aqueles que retornam uma lista de ids, como por exemplo: 
 "Planos": [
            "1730927433976x851859907284303900"
        ],
Caso algum campo seja uma lista de objetos, no model deveram existir dois campos:
- um que represente a lista de objetos, por exemplo:
    planos:        Optional[List[Planos]] = Field(alias='Planos')
- outro que represente alista de ids. como por exemplo:
    planos_ids:    Optional[List[str]]

Como exemplo completo da classe:
from pydantic import BaseModel, Field
from typing import List, Optional
from model.Plano import Plano

class PlanoEstrategico(BaseModel):

    descricao_do_negocio: str = Field(alias="Descricao do negocio", description="Descrição do negócio")
    data_inicio:        Optional[datetime] = Field(alias='Data inicio')
    data_fim:           Optional[datetime] = Field(alias='Data fim')
    empresa: str = Field(alias="Empresa", description="Empresa")
    missao: str = Field(alias="Missao", description="Missão")
    ramo: str = Field(alias="Ramo", description="Ramo")
    valores: List[str] = Field(alias="Valores", description="Valores")
    visao: str = Field(alias="Visao", description="Visão")
    comecar: List[str] = Field(alias="Comecar", description="Começar")
    parar: List[str] = Field(alias="Parar", description="Coisas que devemos parar de fazer")
    manter: List[str] = Field(alias="Manter", description="Manter")
    onde_estamos: str = Field(alias="Onde estamos", description="Descrição do negócio")
    oportunidades: List[str] = Field(alias="Oportunidades", description="Oportunidades")
    ameacas: List[str] = Field(alias="Ameacas", description="Ameaças")
    planos:        Optional[List[Plan]] = Field(alias='Planos')
    planos_ids:    Optional[List[str]]
    id: str = Field(alias="_id", description="Identificador único")

    class Config:
        allow_population_by_field_name = True


Crie também um DTO, que herde de dto
Caso existam campos que sejam lista de objetos, o método _map deverá implementar o seguinte o
    def _map(self, data: dict) -> 'nome_da_classe':

        data['classe_da_lista_ids'] = data.pop('classe_da_lista') 
        self.classe = Classe( **data )

        return self.classe:

Esse é o exemplo completo da classe do DTO

class ClasseDTO(dto):

    def __init__(self, service, classe=None):

        super().__init__(service)
        self.type = self.service.CLASSE
        self.classe = classe
    def _map(self, data: dict) -> 'PlanoEstrategico':

        data['classe_da_lista_ids'] = data.pop('classe_da_lista') # 
        self.classe = Classe( **data )

        return self.classe:


Segue o Json:
{
        "_id": "1730934578042x826145294393278500",
        "Modified Date": "2024-11-09T14:34:25.302Z",
        "Created Date": "2024-11-06T23:09:38.980Z",
        "Created By": "1712602220283x155804620698294820",
        "Descricao do negocio": "Clinica especializada em diagnósticos por imagem",
        "Empresa": "Clinica São Camilo",
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
            "Aniquilar o atraso de resultado de exame",
            "- Parar de misturar questões administrativas e atividades médicas",
            "- Desperdício de energia e suprimentos"
        ],
        "Manter": [
            "Qualidade nos diagnósticos",
            "- Manter/melhorar o nível de credibilidade com os médicos solicitantes e com os clientes",
            "- Manter a estrutura física, prédios e espaços. Reformar, ter sempre uma boa aparência",
            "- Manter o planejamento de revitalização das máquinas"
        ],
        "Onde estamos": "Está tudo indo mais ou menos bem",
        "Oportunidades": [
            "'- IA para atendimento a cliente"
        ],
        "Ameacas": [
            "Planos de saúde derrubando o ticket médio",
            "Concorrência avançando e com fundos"
        ],
        "Planos": [
            "1730927433976x851859907284303900"
        ],
        "Departamentos": [
            "1731161581724x316379623663434200"
        ]
    }
O nome da classe é PlanoEstrategico
```

Dessa forma as classes básicas são criadas. 

## Sobre o lazy load em Bubble

Para toda relação 1-N, tem o Bubble traz a lista de ids, e não a lista de objetos. Por isso, precisa ter o campo objeto-ids e fazer a substituição.
Na leitura isso é feiton no map do DTO. 
Na gravação é feito no insere do service (ou do DTO)
Como exemplo veja a implementação da classe Okr que tem key_results.

## Carregando Lazy load
O DTO deve implementar a carga dos ids. Para um exemplo, ver PlanoDTO.get_okrs()