import type { ResultadoChave, Objetivo, Plano, User, Cliente } from '@prisma/client'

export function makeCliente(overrides: Partial<Cliente> = {}): Cliente {
  return {
    id: 'cliente-1',
    nome: 'Empresa Demo',
    stripeCustomerId: null,
    subscriptionId: null,
    subscriptionItemId: null,
    quantidadeUsuarios: 1,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    clienteId: 'cliente-1',
    email: 'user@demo.com',
    nome: 'User Demo',
    foto: null,
    tipoUser: 'membro',
    statusUser: 'ativo',
    atualizacaoEmailPlano: true,
    atualizacaoEmailObjetivo: true,
    atualizacaoEmailResultado: true,
    temConvite: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

export function makePlano(overrides: Partial<Plano> = {}): Plano {
  return {
    id: 'plano-1',
    clienteId: 'cliente-1',
    planoPaiId: null,
    planoEstrategicoId: null,
    departamentoId: null,
    titulo: 'Plano Corporativo 2025',
    tipo: 'corporativo',
    status: 'publicado',
    dataInicio: new Date('2025-01-01'),
    dataFim: new Date('2025-12-31'),
    frequenciaAtualizacao: 'mensal',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

export function makeObjetivo(overrides: Partial<Objetivo> = {}): Objetivo {
  return {
    id: 'objetivo-1',
    planoId: 'plano-1',
    objetivoVinculadoId: null,
    titulo: 'Aumentar receita recorrente',
    descricao: null,
    numero: 1,
    progresso: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

export function makeResultadoChave(overrides: Partial<ResultadoChave> = {}): ResultadoChave {
  return {
    id: 'kr-1',
    objetivoId: 'objetivo-1',
    descricao: 'Atingir R$ 1M em MRR',
    tipoMetrica: 'aumentar',
    valorInicial: 0,
    valorAlvo: 1_000_000,
    valorAtual: 0,
    unidade: 'R$',
    peso: 1,
    progresso: 0,
    progressoPonderado: 0,
    status: 'no_prazo',
    faltaAtualizar: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}
