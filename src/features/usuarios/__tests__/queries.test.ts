import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getClienteUsuarios, getMembros } from '../queries'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockPrisma = prisma as unknown as {
  user: { findMany: ReturnType<typeof vi.fn> }
}

beforeEach(() => vi.clearAllMocks())

describe('getClienteUsuarios', () => {
  it('busca usuários do cliente com select e ordenação por nome', async () => {
    const fake = [{ id: 'u1', nome: 'Ana', email: 'ana@acme.com' }]
    mockPrisma.user.findMany.mockResolvedValue(fake)

    const result = await getClienteUsuarios('cliente-1')

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      where: { clienteId: 'cliente-1' },
      select: { id: true, nome: true, email: true },
      orderBy: { nome: 'asc' },
    })
    expect(result).toEqual(fake)
  })

  it('retorna lista vazia quando não há usuários', async () => {
    mockPrisma.user.findMany.mockResolvedValue([])
    expect(await getClienteUsuarios('cliente-x')).toEqual([])
  })
})

describe('getMembros', () => {
  it('busca membros do cliente com papéis por plano e notificações', async () => {
    const fake = [{ id: 'u1', nome: 'Ana', email: 'ana@acme.com', planosUsuario: [] }]
    mockPrisma.user.findMany.mockResolvedValue(fake)

    const result = await getMembros('cliente-1')

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clienteId: 'cliente-1' },
        orderBy: { nome: 'asc' },
        select: expect.objectContaining({
          tipoUser: true,
          atualizacaoEmailPlano: true,
          planosUsuario: expect.objectContaining({
            select: expect.objectContaining({ papel: true }),
          }),
        }),
      })
    )
    expect(result).toEqual(fake)
  })
})
