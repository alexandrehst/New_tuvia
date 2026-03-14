import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateKeyResultValor, createKeyResult } from '../actions'

const validCuid = 'clh1234567890abcdefghijklm'
const validCuid2 = 'clh9876543210zyxwvutsrqpon'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    resultadoChave: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    historicoValores: {
      create: vi.fn(),
    },
    objetivo: {
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    objetivoResponsavel: {
      findMany: vi.fn(),
    },
    linhaTendencia: {
      createMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/brevo', () => ({
  sendEmail: vi.fn(),
  TEMPLATES: { ACOMPANHAMENTO_PLANO: 3 },
}))

import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/brevo'

const mockPrisma = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>

beforeEach(() => vi.clearAllMocks())

const makeKr = (overrides = {}) => ({
  id: validCuid,
  descricao: 'Aumentar receita',
  tipoMetrica: 'aumentar',
  valorInicial: 0,
  valorAlvo: 100,
  valorAtual: 0,
  peso: 1,
  objetivoId: validCuid2,
  objetivo: {
    id: validCuid2,
    plano: {
      dataInicio: new Date('2025-01-01'),
      dataFim: new Date('2025-12-31'),
    },
    resultadosChave: [{ id: validCuid, progresso: 0, peso: 1 }],
  },
  ...overrides,
})

describe('updateKeyResultValor', () => {
  it('atualiza valor, calcula progresso e retorna resultado', async () => {
    mockPrisma.resultadoChave.findUniqueOrThrow.mockResolvedValue(makeKr())
    mockPrisma.resultadoChave.update.mockResolvedValue({})
    mockPrisma.historicoValores.create.mockResolvedValue({})
    mockPrisma.objetivo.update.mockResolvedValue({})
    mockPrisma.objetivoResponsavel.findMany.mockResolvedValue([])

    const result = await updateKeyResultValor({ krId: validCuid, valor: 50 })

    expect(result.ok).toBe(true)
    expect(result.progresso).toBe(50)
    expect(mockPrisma.resultadoChave.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: validCuid },
        data: expect.objectContaining({ valorAtual: 50, progresso: 50 }),
      })
    )
  })

  it('registra histórico de valores', async () => {
    mockPrisma.resultadoChave.findUniqueOrThrow.mockResolvedValue(makeKr())
    mockPrisma.resultadoChave.update.mockResolvedValue({})
    mockPrisma.historicoValores.create.mockResolvedValue({})
    mockPrisma.objetivo.update.mockResolvedValue({})
    mockPrisma.objetivoResponsavel.findMany.mockResolvedValue([])

    await updateKeyResultValor({ krId: validCuid, valor: 75, comentario: 'Bom mês' })

    expect(mockPrisma.historicoValores.create).toHaveBeenCalledWith({
      data: { resultadoChaveId: validCuid, valor: 75, comentario: 'Bom mês' },
    })
  })

  it('recalcula progresso do objetivo', async () => {
    mockPrisma.resultadoChave.findUniqueOrThrow.mockResolvedValue(makeKr())
    mockPrisma.resultadoChave.update.mockResolvedValue({})
    mockPrisma.historicoValores.create.mockResolvedValue({})
    mockPrisma.objetivo.update.mockResolvedValue({})
    mockPrisma.objetivoResponsavel.findMany.mockResolvedValue([])

    await updateKeyResultValor({ krId: validCuid, valor: 50 })

    expect(mockPrisma.objetivo.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: validCuid2 } })
    )
  })

  it('envia email para responsáveis com notificação habilitada', async () => {
    mockPrisma.resultadoChave.findUniqueOrThrow.mockResolvedValue(makeKr())
    mockPrisma.resultadoChave.update.mockResolvedValue({})
    mockPrisma.historicoValores.create.mockResolvedValue({})
    mockPrisma.objetivo.update.mockResolvedValue({})
    mockPrisma.objetivoResponsavel.findMany.mockResolvedValue([
      { user: { email: 'joao@test.com', nome: 'João', atualizacaoEmailResultado: true } },
    ])

    await updateKeyResultValor({ krId: validCuid, valor: 50 })

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: [{ email: 'joao@test.com', name: 'João' }],
        templateId: 3,
      })
    )
  })

  it('não envia email para responsáveis com notificação desabilitada', async () => {
    mockPrisma.resultadoChave.findUniqueOrThrow.mockResolvedValue(makeKr())
    mockPrisma.resultadoChave.update.mockResolvedValue({})
    mockPrisma.historicoValores.create.mockResolvedValue({})
    mockPrisma.objetivo.update.mockResolvedValue({})
    mockPrisma.objetivoResponsavel.findMany.mockResolvedValue([
      { user: { email: 'joao@test.com', nome: 'João', atualizacaoEmailResultado: false } },
    ])

    await updateKeyResultValor({ krId: validCuid, valor: 50 })

    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('continua mesmo se envio de email falhar', async () => {
    mockPrisma.resultadoChave.findUniqueOrThrow.mockResolvedValue(makeKr())
    mockPrisma.resultadoChave.update.mockResolvedValue({})
    mockPrisma.historicoValores.create.mockResolvedValue({})
    mockPrisma.objetivo.update.mockResolvedValue({})
    mockPrisma.objetivoResponsavel.findMany.mockRejectedValue(new Error('Email falhou'))

    const result = await updateKeyResultValor({ krId: validCuid, valor: 50 })

    expect(result.ok).toBe(true)
  })
})

describe('createKeyResult', () => {
  const validInput = {
    objetivoId: validCuid,
    descricao: 'Aumentar receita mensal',
    tipoMetrica: 'aumentar' as const,
    valorInicial: 0,
    valorAlvo: 100,
    peso: 1,
  }

  const fakeObjetivo = {
    id: validCuid,
    plano: {
      dataInicio: new Date('2025-01-01'),
      dataFim: new Date('2025-12-31'),
    },
  }

  it('cria resultado chave com valorAtual igual ao valorInicial', async () => {
    const fakeKr = { id: validCuid2, ...validInput }
    mockPrisma.objetivo.findUniqueOrThrow.mockResolvedValue(fakeObjetivo)
    mockPrisma.resultadoChave.create.mockResolvedValue(fakeKr)
    mockPrisma.linhaTendencia.createMany.mockResolvedValue({})

    await createKeyResult(validInput)

    expect(mockPrisma.resultadoChave.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ valorAtual: 0 }),
      })
    )
  })

  it('gera linha de tendência quando plano tem datas', async () => {
    mockPrisma.objetivo.findUniqueOrThrow.mockResolvedValue(fakeObjetivo)
    mockPrisma.resultadoChave.create.mockResolvedValue({ id: validCuid2 })
    mockPrisma.linhaTendencia.createMany.mockResolvedValue({})

    await createKeyResult(validInput)

    expect(mockPrisma.linhaTendencia.createMany).toHaveBeenCalled()
    const call = mockPrisma.linhaTendencia.createMany.mock.calls[0][0]
    expect(call.data.length).toBeGreaterThan(0)
  })

  it('não gera linha de tendência quando plano não tem datas', async () => {
    mockPrisma.objetivo.findUniqueOrThrow.mockResolvedValue({
      id: validCuid,
      plano: { dataInicio: null, dataFim: null },
    })
    mockPrisma.resultadoChave.create.mockResolvedValue({ id: validCuid2 })

    await createKeyResult(validInput)

    expect(mockPrisma.linhaTendencia.createMany).not.toHaveBeenCalled()
  })

  it('retorna o resultado chave criado', async () => {
    const fakeKr = { id: validCuid2, descricao: 'Aumentar receita mensal' }
    mockPrisma.objetivo.findUniqueOrThrow.mockResolvedValue(fakeObjetivo)
    mockPrisma.resultadoChave.create.mockResolvedValue(fakeKr)
    mockPrisma.linhaTendencia.createMany.mockResolvedValue({})

    const result = await createKeyResult(validInput)

    expect(result).toEqual(fakeKr)
  })
})
