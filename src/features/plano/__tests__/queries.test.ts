import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPlanos, getPlanoWithObjetivos, getSidebarData } from '../queries'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    plano: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockPrisma = prisma as unknown as {
  plano: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
  }
  user: {
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
    mockPrisma.plano.findFirst.mockResolvedValue(fakePlano)

    const result = await getPlanoWithObjetivos('plan1', 'cliente-123')

    expect(mockPrisma.plano.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'plan1', clienteId: 'cliente-123' } })
    )
    expect(result).toEqual(fakePlano)
  })

  it('escopa a busca pelo clienteId do usuário (tenant isolation)', async () => {
    mockPrisma.plano.findFirst.mockResolvedValue(null)

    await getPlanoWithObjetivos('plan1', 'cliente-123')

    const call = mockPrisma.plano.findFirst.mock.calls[0][0]
    expect(call.where.clienteId).toBe('cliente-123')
  })

  it('não retorna plano de outro cliente (cross-tenant IDOR)', async () => {
    // Prisma com where: { id, clienteId } não casa um plano de outro tenant -> null.
    mockPrisma.plano.findFirst.mockResolvedValue(null)

    const result = await getPlanoWithObjetivos('plano-de-outro-cliente', 'cliente-123')

    expect(result).toBeNull()
    expect(mockPrisma.plano.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'plano-de-outro-cliente', clienteId: 'cliente-123' } })
    )
  })

  it('retorna null quando plano não existe', async () => {
    mockPrisma.plano.findFirst.mockResolvedValue(null)
    const result = await getPlanoWithObjetivos('nao-existe', 'cliente-123')
    expect(result).toBeNull()
  })

  it('inclui linhaTendencia nos resultadosChave', async () => {
    mockPrisma.plano.findFirst.mockResolvedValue(null)

    await getPlanoWithObjetivos('plan1', 'cliente-123')

    const call = mockPrisma.plano.findFirst.mock.calls[0][0]
    const krInclude = call.include.objetivos.include.resultadosChave.include
    expect(krInclude.linhaTendencia).toBeDefined()
  })

  it('ordena objetivos por numero ascendente', async () => {
    mockPrisma.plano.findFirst.mockResolvedValue(null)

    await getPlanoWithObjetivos('plan1', 'cliente-123')

    const call = mockPrisma.plano.findFirst.mock.calls[0][0]
    expect(call.include.objetivos.orderBy).toEqual({ numero: 'asc' })
  })

  it('inclui o planoPai (hierarquia) para o breadcrumb', async () => {
    mockPrisma.plano.findFirst.mockResolvedValue(null)

    await getPlanoWithObjetivos('plan1', 'cliente-123')

    const call = mockPrisma.plano.findFirst.mock.calls[0][0]
    expect(call.include.planoPai).toEqual({ select: { id: true, titulo: true } })
  })
})

describe('getSidebarData', () => {
  it('inclui o nome do Cliente no select do usuário', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1', nome: 'Ana', email: 'ana@acme.com', clienteId: 'c1', cliente: { nome: 'Acme Inc.' },
    })
    mockPrisma.plano.findMany.mockResolvedValue([])

    await getSidebarData('ana@acme.com')

    const call = mockPrisma.user.findUnique.mock.calls[0][0]
    expect(call.select.cliente).toEqual({ select: { nome: true } })
  })

  it('retorna o usuário (com cliente.nome) e os planos corporativos', async () => {
    const user = {
      id: 'u1', nome: 'Ana', email: 'ana@acme.com', clienteId: 'c1', cliente: { nome: 'Acme Inc.' },
    }
    mockPrisma.user.findUnique.mockResolvedValue(user)
    mockPrisma.plano.findMany.mockResolvedValue([{ id: 'p1', titulo: 'Plano 2025' }])

    const result = await getSidebarData('ana@acme.com')

    expect(result?.user.cliente?.nome).toBe('Acme Inc.')
    expect(result?.planos).toEqual([{ id: 'p1', titulo: 'Plano 2025' }])
    expect(mockPrisma.plano.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clienteId: 'c1', planoPaiId: null } })
    )
  })

  it('retorna null quando o usuário não existe', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    const result = await getSidebarData('ninguem@acme.com')
    expect(result).toBeNull()
    expect(mockPrisma.plano.findMany).not.toHaveBeenCalled()
  })
})
