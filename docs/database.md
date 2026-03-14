Cliente:
	•	Administradores: List of Users
	•	customer_id_stripe: text
	•	id_plano: text
	•	lista de dominios: List of Dominios
	•	quantidade_de_usuario: number
	•	responsavel_financeiro: User
	•	status: text
	•	subscription_item: text
	•	subscription_principal: text

Plano Estrategico:
	•	Ameacas: List of texts
	•	Cliente: Cliente
	•	Comecar: List of texts
	•	Data fim: date
	•	Data inicio: date
	•	Departamentos: List of Departamentos
	•	Descricao do negocio: text
	•	Empresa: text
	•	Manter: List of texts
	•	Missao: text
	•	Onde estamos: text
	•	Oportunidades: List of texts
	•	Parar: List of texts
	•	Plano: Plano
	•	Ramo: text
	•	Status: Status Plano
	•	Valores: List of texts
	•	Visao: text

Plano:
	•	cliente: Cliente
	•	Data fim: date
	•	Data inicio: date
	•	Departamento: text
	•	Frequencia atualizacao: Plano frequencia atualizacao
	•	IA-melhorar: text
	•	IA-negocio: text
	•	IA-valor: text
	•	Objetivos: List of Objetivos
	•	Permissoes: Permissão Plano
	•	Plano-pai: Plano
	•	Status: Status Plano
	•	Tipo: Tipo Plano
	•	Titulo: text

Objetivo:
	•	Descricao: text
	•	Numero: number
	•	Objetivo - Vinculado: Objetivo
	•	Progresso: number
	•	Responsaveis: List of Users
	•	Resultados-Chave: List of Resultado Chaves
	•	Titulo: text

Objetivo_Responsavel:
	•	Objetivo: Objetivo
	•	Usuario: User

Departamento
Cliente: Cliente
Descricao: text
Nome: text
Responsavel: User

Resultado Chave
Descricao: text
Falta atualizar: yes / no
Peso: number
Progresso: number
Progresso_ponderado: number
Status: Status Resultado Chave
Temporario: yes / no
Tipo_metrica: Tipo_resultado_chave
Unidade: text
Valor: number
Valor Atual: number
Valor Inicial: number

Resultado Chave Linha
Data: date
Resultado Chave: Resultado Chave
Valor: number

Historico_Valores_Resultado
Data do Registro: date
Resultado Chave: Resultado Chave
Valor: number

Comentarios_Resultado
Comentario: text
Histórico Valores: Historico_Valores_Resultado_Chave
Resultado Chave: Resultado Chave

Dominio
dominio: text
id_cliente_vinculado: Cliente
status_dominio: Status Dominio
tipo autorizaçao: Tipo Autorização

Plano Usuario
Papel: Papeis Plano
Plano: Plano
Usuario: User

Tipo Resultado Chave
Descrição: text

User
atualizacao_email_objet: yes / no
atualizacao_email_plano: yes / no
atualizacao_email_resul: yes / no
cliente: Cliente
cliente_stripe: yes / no
Expirado: yes / no
falta_autorizar_usuario: yes / no
Foto: image
Nome: text
Status_user: Status Usuario
telefone: text
telegram_user_id: text
tem_convite: yes / no
Tipo_user: Tipo Usuario
token: text