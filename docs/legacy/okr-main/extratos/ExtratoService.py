import json
import openai
from openai import OpenAI
import pandas as pd
import logging
from datetime import datetime, timezone

from dto.Plano_dto import PlanoDTO
from dto.User_dto import UserDTO
from model.KeyResult import KeyResult
from model.Okr import Okr
from model.Plan import Plan
from service.BubbleAPIService import BubbleAPIService
from service.Configurations import Configurations
from service.GPTService import GPTService
from datetime import datetime

logger = logging.getLogger()

class ExtratoService():
    def __init__(self):
        self.client = OpenAI( api_key = Configurations().api_key )
        #self.client.api_key= Configurations().api_key

    def processa(self):
        try:
            df = pd.read_csv(self.file)  # Open the file into a dataframe
        except Exception as e:
            logger.error(f"Error reading file: {e}")
            return None

        columns = ['Data', 'Histórico', 'Documento', 'Valor', 'Saldo', 'Categoria']

        if not all(col in df.columns for col in columns):
            logger.error("Arquivo inválido. Colunas não encontradas")
            return None

    def get_valores_por_categoria(self):
        file_path = './extratos/Categoria_mes.csv'
        df = pd.read_csv( file_path )
        json_data = df.to_json(orient='records')
        return json_data

    def get_valores_saldo_mes(self):
        file_path = './extratos/Saldo_mes.csv'
        df = pd.read_csv( file_path )
        json_data = df.to_json(orient='records')
        return json_data

    def get_dre(self):
        file_path = './extratos/Real_Orcado_Grouped.csv'
        df = pd.read_csv( file_path )
        json_data = df.to_json(orient='records')
        return json_data

    def analiza_fluxo_de_caixa(self):
        model = GPTService(model="gpt-4o", max_tokens=4096)

        valores_por_categoria = self.get_valores_por_categoria()
        valores_saldo_mes = self.get_valores_saldo_mes()

        # texto = '''Você receberá os valores de cada categoria e o saldo mensal.
        #     Faça uma análise da variação do fluxo de caixa mensal,
        #     relação entre receita e despesa,
        #     análise das despesas e sugira açoes para o planejamento financeiro.
        #     Não inclua os valores.
        #     Gere a resposta em um objeto json
        #     '''


        texto = '''Você receberá os valores de cada categoria e o saldo mensal.
            Faça uma análise da variação do fluxo de caixa mensal.
            Gere a resposta em um objeto json no formato {"analise de fluxo de caixa": [{"mes": <mes>, "analise": <analise>}]}
            Faça uma análise da relação entre receita e despesa.
            Gere a resposta em um objeto json no formato {"analise receita despesa": {"analise": <texto>}}
            Analise as despesas por categoria
            Gere a resposta em um objeto json no formato {"analise despesa categoria": [{"categoria": <categoria>, "analise": <texto>}]}
            Sugira acoes para o planejamento financeiro
            Gere a resposta em um objeto json no formato {"acoes": [{"titulo": <texto>, "descricao": <texto>}]}
            Faça um resumo da análise
            Gere a resposta em um objeto json no formato {"resumo": <texto>}
            '''
        message = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": texto
                    },
                    {
                        "type": "text",
                        "text": "Valores por categoria: \n" + valores_por_categoria
                    },
                    {
                        "type": "text",
                        "text": "Saldo mensal: \n" + valores_saldo_mes
                    }
                ]
            }
        ]
        response = self.generate(message)
        return response['message']

    def analiza_receita_despesa(self):
        model = GPTService(model="gpt-4o", max_tokens=4096)

        valores_por_categoria = self.get_valores_por_categoria()
        valores_saldo_mes = self.get_valores_saldo_mes()

        # texto = '''Você receberá os valores de cada categoria e o saldo mensal.
        #     Faça uma análise da variação do fluxo de caixa mensal,
        #     relação entre receita e despesa,
        #     análise das despesas e sugira açoes para o planejamento financeiro.
        #     Não inclua os valores.
        #     Gere a resposta em um objeto json
        #     '''


        texto = '''Você receberá os valores de cada categoria e o saldo mensal.
            Faça uma análise da relação entre receita e despesa.
            Gere a resposta em um objeto json no formato {"analise receita despesa": {"analise": <texto>}}
            '''
        message = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": texto
                    },
                    {
                        "type": "text",
                        "text": "Valores por categoria: \n" + valores_por_categoria
                    },
                    {
                        "type": "text",
                        "text": "Saldo mensal: \n" + valores_saldo_mes
                    }
                ]
            }
        ]
        response = self.generate(message)
        return response['message']
    def analiza_dre(self):

        dre = self.get_dre()

        texto = '''Você receberá uma dre.
            Faça a análise do desempenho financeiro da empresa,
            aponte riscos e pontos positivos.
            '''
        message = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": texto
                    },
                    {
                        "type": "text",
                        "text": "DRE: \n" + dre
                    }
                ]
            }
        ]

        response = self.generate(message)
        return response['message']

    def planejamento(self):
        model = GPTService(model="gpt-4o", max_tokens=4096)


        analise = '''
        "analise de fluxo de caixa": [
            {
            "mes": "2022-09-01",
            "analise": "O saldo inicial era de 1.056.895,17. A partir de outubro de 2022, observamos uma queda no saldo mensal até janeiro de 2023, quando alcançou 70.748,61. A partir de fevereiro, o saldo ficou negativo temporariamente, recuperando-se lentamente nos meses seguintes. Apesar de algumas recuperações, há uma tendência geral de saldo declinante até setembro de 2023."
            },
            {
            "mes": "2022-10-01",
            "analise": "O saldo reduziu-se para 573.699,39, refletindo um alto volume de despesas em diversas categorias."
            },
            {
            "mes": "2022-11-01",
            "analise": "Houve um aumento significativo no saldo, chegando a 1.159.080,7, devido a uma receita elevada."
            },
            {
            "mes": "2022-12-01",
            "analise": "O saldo caiu para 838.899,85, destacando um aumento nas despesas com fornecedor e pessoal."
            },
            {
            "mes": "2023-01-01",
            "analise": "Houve uma queda acentuada para 70.748,61, devido a uma despesa com fornecedor extremamente alta."
            },
            {
            "mes": "2023-02-01",
            "analise": "O saldo ficou negativo em -1.728,16, indicando que as despesas superaram a receita."
            },
            {
            "mes": "2023-03-01",
            "analise": "O saldo melhorou para 58.732,84, sugerindo uma ligeira recuperação das receitas em relação às despesas."
            },
            {
            "mes": "2023-04-01",
            "analise": "O saldo voltou a zero, indicando que as receitas e as despesas se equilibraram."
            },
            {
            "mes": "2023-05-01",
            "analise": "O saldo melhorou ligeiramente para 25.755,58."
            },
            {
            "mes": "2023-06-01",
            "analise": "Houve uma melhoria adicional, com o saldo aumentando para 94.522,85."
            },
            {
            "mes": "2023-07-01",
            "analise": "O saldo aumentou para 124.510,9, mas ainda refletindo um volume de despesas significativo."
            },
            {
            "mes": "2023-08-01",
            "analise": "O saldo aumentou para 160.719,92, mostrando uma recuperação contínua."
            },
            {
            "mes": "2023-09-01",
            "analise": "O saldo reduziu novamente para 18.736,02, refletindo uma queda na receita e aumento em certas despesas."
            }
        ],
        "analise receita despesa": {
            "analise": "As receitas têm sido variável mês a mês, com picos em novembro de 2022 e janeiro de 2023. No entanto, as despesas, especialmente com fornecedores e pessoal, muitas vezes superaram a receita, resultando em saldos decrescentes e até negativos em alguns meses. A falta de consistência na receita e altos custos fixos continuam a ser um desafio."
        },
        "analise despesa categoria": [
            {
            "categoria": "Despesa com fornecedor",
            "analise": "Esta é a categoria de despesa mais elevada e variável. Picos significativos foram observados em janeiro de 2023. O esforço para gerenciar ou reduzir essas despesas poderia beneficiar o caixa."
            },
            {
            "categoria": "Despesa com pessoal",
            "analise": "Essas despesas têm sido relativamente estáveis, mas altas. Isto sugere um custo fixo que precisa ser monitorado constantemente para garantir a sustentabilidade."
            },
            {
            "categoria": "Despesa com serviço",
            "analise": "Essas despesas são menores em comparação com outras categorias, mas consistentemente presentes. Reduções poderiam ser exploradas aqui."
            },
            {
            "categoria": "Despesa com tributos",
            "analise": "Os tributos variaram ao longo dos meses, geralmente refletindo a receita. A eficiência tributária poderia ser um ponto de melhoria."
            },
            {
            "categoria": "Despesa financeira",
            "analise": "Essas despesas são relativamente pequenas, mas um esforço na gestão financeira pode ajudar a reduzir custos."
            }
        ],
        "acoes": [
            {
            "titulo": "Revisão de contratos com fornecedores",
            "descricao": "Negociar melhores condições e preços com fornecedores para reduzir a despesa variável mais significativa."
            },
            {
            "titulo": "Controle rígido de pessoal",
            "descricao": "Implementar políticas de controle de custos relacionados ao pessoal, como revisão de benefícios ou otimização de processos internos."
            },
            {
            "titulo": "Otimização de despesas com serviço",
            "descricao": "Revisar e possivelmente cortar serviços não essenciais ou encontrar fornecedores alternativos com custos mais baixos."
            },
            {
            "titulo": "Eficiência tributária",
            "descricao": "Buscar consultoria para eficiência tributária, explorando incentivos fiscais e formas de reduzir a carga tributária."
            },
            {
            "titulo": "Gestão financeira ativa",
            "descricao": "Implementar uma gestão financeira mais ativa para reduzir despesas financeiras e maximizar o retorno sobre o capital."
            }
        ],
        "resumo": "A análise das finanças entre setembro de 2022 e setembro de 2023 revela um cenário desafiador com altos custos variáveis e despesas fixas que muitas vezes superam as receitas. As principais categorias de despesas incluem fornecedores e pessoal. Recomenda-se uma revisão dos contratos de fornecedores, implementação de controles de custo com o pessoal, e busca por eficiência tributária. A gestão financeira ativa será crucial para melhorar a sustentabilidade e mitigar risco de saldos negativos no futuro."
        }
        '''


        texto = '''Você receberá uma análise do fluxo de caixa de uma empresa.
            Você deverá propor um planejamento estratégico para o CFO.
            Gere três objetivos, cada um com pelo menos três resultados chave
            Gere a resposta em um objeto json no formato
            {"plano":
                ["objetivo":
                    {"titulo": <texto>,
                    "descricao": <descricao maior>,
                    "resultados chave": [
                            {'descricao': <descricao>, 'valor': <valor a atingir>, 'unidade': <unidade>, 'tipo metrica': <aumentar ou reduzir>}
                        ]
                    }
                ]
            }
            '''
        message = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": texto
                    },
                    {
                        "type": "text",
                        "text": "Análise de fluxo de caixa: \n" + analise
                    }
                ]
            }
        ]
        response = self.generate(message)
        return response['message']

    def cria_plano_analise(self, user_id, title, inicio, fim, tipo = 'Plano corporativo',id_plano_pai=None, departamento=None):
        user = UserDTO(BubbleAPIService()).get_by_id(user_id)
        if not user:
            return None
        plano_pai = None
        if id_plano_pai:
            plano_pai = PlanoDTO(BubbleAPIService()).get_by_id(id_plano_pai)
            if not plano_pai:
                return None

        inicio = datetime.strptime(inicio, "%Y-%m-%d")
        fim = datetime.strptime(fim, "%Y-%m-%d")

        plano = Plan( id='1', title=title, tipo=tipo, data_inicio=inicio, data_fim=fim, departamento=departamento, plano_pai=plano_pai, cliente=user.cliente )

        plano_gerado = json.loads(self.planejamento())


        objetivos = []
        for obj in plano_gerado['plano']:
            objetivo = obj['objetivo']

            krs=[]
            for kr in objetivo['resultados chave']:
                tipo_metrica = "Aumentar até"
                if kr['tipo metrica'] == 'reduzir':
                    tipo_metrica = "Reduzir até"

                resultado_chave = KeyResult( Descricao=kr['descricao'], Valor=kr['valor'], Unidade=kr['unidade'], Tipo_metrica=tipo_metrica)
                krs.append(resultado_chave)

            objetivo = Okr( Titulo=objetivo['titulo'], Descricao=objetivo['descricao'], key_results=krs)
            objetivos.append(objetivo)

        plano.okrs = objetivos

        sucesso, plan_id = BubbleAPIService().insere_plan_bubble( plano, user_id)

        return sucesso, plan_id



    def generate(self, message, max_tokens=4096):

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=message,
                temperature=1,
                top_p=1,
                frequency_penalty=0,
                presence_penalty=0,
                max_tokens=max_tokens,
                response_format={"type": "json_object"}

            )

            if response.choices[0].finish_reason != 'stop':
                return { 'error': True, 'message': None}
            answer = response.choices[0].message.content
            logger.debug( answer)

            return { 'error': False, 'message': answer}

        except Exception as e:
            return { 'error': True, 'message': str(e)}