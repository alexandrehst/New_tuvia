import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateKeyResultValor, createKeyResult, updateKeyResult, deleteKeyResult, getKRHistorico } from '../actions'

const validCuid = 'clh1234567890abcdefghijklm'
const validCuid2 = 'clh9876543210zyxwvutsrqpon'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    resultadoChave: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    historicoValores: {
      create: vi.fn(),
      findMany: vi.fn(),
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
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/brevo', () => ({
  sendEmail: vi.fn(),
  TEMPLATES: { ACOMPANHAMENTO_PLANO: 3 },
}))

vi.mock('@/features/auth/guards', () => ({
  requireUser: vi.fn(async () => ({ id: 'u', clienteId: 'cliente-1' })),
  assertMesmoTenant: (recurso: string | null | undefined, usuario: string) => {
    if (recurso !== usuario) throw new Error('Recurso não encontrado')
  },
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
      clienteId: 'cliente-1',
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

  it('usa new Date() quando plano não tem datas definidas', async () => {
    const kr = makeKr({
      objetivo: {
        id: validCuid2,
        plano: { clienteId: 'cliente-1', dataInicio: null, dataFim: null },
        resultadosChave: [{ id: validCuid, progresso: 0, peso: 1 }],
      },
    })
    mockPrisma.resultadoChave.findUniqueOrThrow.mockResolvedValue(kr)
    mockPrisma.resultadoChave.update.mockResolvedValue({})
    mockPrisma.historicoValores.create.mockResolvedValue({})
    mockPrisma.objetivo.update.mockResolvedValue({})
    mockPrisma.objetivoResponsavel.findMany.mockResolvedValue([])

    const result = await updateKeyResultValor({ krId: validCuid, valor: 50 })

    expect(result.ok).toBe(true)
  })

  it('recalcula progresso considerando outros KRs do objetivo', async () => {
    const otherKrId = 'clh0000000000000000000000a'
    const kr = makeKr({
      objetivo: {
        id: validCuid2,
        plano: { clienteId: 'cliente-1', dataInicio: new Date('2025-01-01'), dataFim: new Date('2025-12-31') },
        resultadosChave: [
          { id: validCuid, progresso: 0, peso: 1 },
          { id: otherKrId, progresso: 80, peso: 1 },
        ],
      },
    })
    mockPrisma.resultadoChave.findUniqueOrThrow.mockResolvedValue(kr)
    mockPrisma.resultadoChave.update.mockResolvedValue({})
    mockPrisma.historicoValores.create.mockResolvedValue({})
    mockPrisma.objetivo.update.mockResolvedValue({})
    mockPrisma.objetivoResponsavel.findMany.mockResolvedValue([])

    const result = await updateKeyResultValor({ krId: validCuid, valor: 50 })

    // (50 + 80) / 2 = 65
    expect(mockPrisma.objetivo.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { progresso: 65 } })
    )
    expect(result.ok).toBe(true)
  })

  it('lança erro de validação para krId inválido', async () => {
    await expect(
      updateKeyResultValor({ krId: 'invalido', valor: 50 })
    ).rejects.toThrow()
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
      clienteId: 'cliente-1',
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
      plano: { clienteId: 'cliente-1', dataInicio: null, dataFim: null },
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

  it('lança erro de validação para dados inválidos', async () => {
    await expect(
      createKeyResult({ ...validInput, descricao: 'AB' })
    ).rejects.toThrow()
  })
})

describe('updateKeyResult', () => {
  it('atualiza metadados, recalcula progresso/status e regenera tendência', async () => {
    mockPrisma.resultadoChave.findUniqueOrThrow.mockResolvedValue(
      makeKr({ valorAtual: 50 }) // base 0→100, valor 50 → progresso 50%
    )
    mockPrisma.resultadoChave.update.mockResolvedValue({ id: validCuid })
    mockPrisma.objetivo.update.mockResolvedValue({})
    mockPrisma.linhaTendencia.deleteMany.mockResolvedValue({ count: 6 })
    mockPrisma.linhaTendencia.createMany.mockResolvedValue({})

    await updateKeyResult(validCuid, { descricao: 'Nova descrição', valorAlvo: 200 })

    // valorAlvo 200, valorAtual 50 → progresso 25%
    expect(mockPrisma.resultadoChave.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: validCuid },
        data: expect.objectContaining({ descricao: 'Nova descrição', valorAlvo: 200, progresso: 25 }),
      })
    )
    // tendência regenerada
    expect(mockPrisma.linhaTendencia.deleteMany).toHaveBeenCalledWith({ where: { resultadoChaveId: validCuid } })
    expect(mockPrisma.linhaTendencia.createMany).toHaveBeenCalled()
    // progresso ponderado do objetivo recalculado
    expect(mockPrisma.objetivo.update).toHaveBeenCalled()
  })

  it('não regenera tendência quando o plano não tem datas', async () => {
    mockPrisma.resultadoChave.findUniqueOrThrow.mockResolvedValue(
      makeKr({
        objetivo: {
          id: validCuid2,
          plano: { clienteId: 'cliente-1', dataInicio: null, dataFim: null },
          resultadosChave: [{ id: validCuid, progresso: 0, peso: 1 }],
        },
      })
    )
    mockPrisma.resultadoChave.update.mockResolvedValue({ id: validCuid })
    mockPrisma.objetivo.update.mockResolvedValue({})

    await updateKeyResult(validCuid, { peso: 2 })

    expect(mockPrisma.linhaTendencia.deleteMany).not.toHaveBeenCalled()
    expect(mockPrisma.linhaTendencia.createMany).not.toHaveBeenCalled()
  })

  it('lança erro de validação para descrição muito curta', async () => {
    await expect(updateKeyResult(validCuid, { descricao: 'AB' })).rejects.toThrow()
  })
})

describe('deleteKeyResult', () => {
  it('deleta o resultado-chave pelo id (mesmo tenant)', async () => {
    mockPrisma.resultadoChave.findUniqueOrThrow.mockResolvedValue({ objetivo: { plano: { clienteId: 'cliente-1' } } })
    mockPrisma.resultadoChave.delete.mockResolvedValue({})

    await deleteKeyResult(validCuid)

    expect(mockPrisma.resultadoChave.delete).toHaveBeenCalledWith({ where: { id: validCuid } })
  })

  it('bloqueia exclusão de outro tenant', async () => {
    mockPrisma.resultadoChave.findUniqueOrThrow.mockResolvedValue({ objetivo: { plano: { clienteId: 'cliente-2' } } })
    await expect(deleteKeyResult(validCuid)).rejects.toThrow()
    expect(mockPrisma.resultadoChave.delete).not.toHaveBeenCalled()
  })
})

describe('getKRHistorico', () => {
  it('retorna histórico (dataRegistro→data) e tendência ordenados, normalizados', async () => {
    const d1 = new Date('2025-02-01')
    const d2 = new Date('2025-03-01')
    mockPrisma.resultadoChave.findUniqueOrThrow.mockResolvedValue({ objetivo: { plano: { clienteId: 'cliente-1' } } })
    mockPrisma.historicoValores.findMany.mockResolvedValue([{ dataRegistro: d1, valor: 30 }])
    mockPrisma.linhaTendencia.findMany.mockResolvedValue([{ data: d2, valor: 50 }])

    const result = await getKRHistorico(validCuid)

    expect(mockPrisma.historicoValores.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { resultadoChaveId: validCuid }, orderBy: { dataRegistro: 'asc' } })
    )
    expect(mockPrisma.linhaTendencia.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { resultadoChaveId: validCuid }, orderBy: { data: 'asc' } })
    )
    expect(result.historico).toEqual([{ data: d1, valor: 30 }])
    expect(result.tendencia).toEqual([{ data: d2, valor: 50 }])
  })

  it('retorna listas vazias quando não há dados', async () => {
    mockPrisma.resultadoChave.findUniqueOrThrow.mockResolvedValue({ objetivo: { plano: { clienteId: 'cliente-1' } } })
    mockPrisma.historicoValores.findMany.mockResolvedValue([])
    mockPrisma.linhaTendencia.findMany.mockResolvedValue([])

    const result = await getKRHistorico(validCuid)

    expect(result).toEqual({ historico: [], tendencia: [] })
  })
})
