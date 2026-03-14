import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPlanos, getPlanoWithObjetivos } from '../queries'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    plano: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockPrisma = prisma as unknown as {
  plano: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
  }
}

beforeEach(() => vi.clearAllMocks())

describe('getPlanos', () => {
  it('busca planos do cliente com contagem de objetivos', async () => {
    const fakePlanos = [
      { id: 'plan1', titulo: 'Plano 2025', _count: { objetivos: 3 }, planosFilhos: [] },
    ]
    mockPrisma.plano.findMany.mockResolvedValue(fakePlanos)

    const result = await getPlanos('cliente-123')

    expect(mockPrisma.plano.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clienteId: 'cliente-123' },
        orderBy: { createdAt: 'desc' },
      })
    )
    expect(result).toEqual(fakePlanos)
  })

  it('inclui planosFilhos com contagem de objetivos', async () => {
    mockPrisma.plano.findMany.mockResolvedValue([])

    await getPlanos('cliente-123')

    const call = mockPrisma.plano.findMany.mock.calls[0][0]
    expect(call.include.planosFilhos).toBeDefined()
    expect(call.include._count).toBeDefined()
  })

  it('retorna array vazio quando não há planos', async () => {
    mockPrisma.plano.findMany.mockResolvedValue([])
    const result = await getPlanos('cliente-sem-planos')
    expect(result).toEqual([])
  })
})

describe('getPlanoWithObjetivos', () => {
  it('busca plano com objetivos e resultados chave', async () => {
    const fakePlano = {
      id: 'plan1',
      titulo: 'Plano 2025',
      objetivos: [
        {
          id: 'obj1',
          titulo: 'Crescer receita',
          numero: 1,
          resultadosChave: [],
          responsaveis: [],
        },
      ],
      planosFilhos: [],
    }
    mockPrisma.plano.findUnique.mockResolvedValue(fakePlano)

    const result = await getPlanoWithObjetivos('plan1')

    expect(mockPrisma.plano.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'plan1' } })
    )
    expect(result).toEqual(fakePlano)
  })

  it('retorna null quando plano não existe', async () => {
    mockPrisma.plano.findUnique.mockResolvedValue(null)
    const result = await getPlanoWithObjetivos('nao-existe')
    expect(result).toBeNull()
  })

  it('inclui linhaTendencia nos resultadosChave', async () => {
    mockPrisma.plano.findUnique.mockResolvedValue(null)

    await getPlanoWithObjetivos('plan1')

    const call = mockPrisma.plano.findUnique.mock.calls[0][0]
    const krInclude = call.include.objetivos.include.resultadosChave.include
    expect(krInclude.linhaTendencia).toBeDefined()
  })

  it('ordena objetivos por numero ascendente', async () => {
    mockPrisma.plano.findUnique.mockResolvedValue(null)

    await getPlanoWithObjetivos('plan1')

    const call = mockPrisma.plano.findUnique.mock.calls[0][0]
    expect(call.include.objetivos.orderBy).toEqual({ numero: 'asc' })
  })
})
