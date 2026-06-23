import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isPrimeiroAcesso } from '../queries'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    plano: {
      count: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockPrisma = prisma as unknown as {
  plano: {
    count: ReturnType<typeof vi.fn>
  }
}

beforeEach(() => vi.clearAllMocks())

describe('isPrimeiroAcesso', () => {
  it('retorna true quando o cliente não tem nenhum plano (count === 0)', async () => {
    mockPrisma.plano.count.mockResolvedValue(0)

    const result = await isPrimeiroAcesso('cliente-123')

    expect(result).toBe(true)
  })

  it('retorna false quando o cliente tem ao menos 1 plano (count >= 1)', async () => {
    mockPrisma.plano.count.mockResolvedValue(1)

    const result = await isPrimeiroAcesso('cliente-123')

    expect(result).toBe(false)
  })

  it('retorna false quando o cliente tem múltiplos planos', async () => {
    mockPrisma.plano.count.mockResolvedValue(5)

    const result = await isPrimeiroAcesso('cliente-123')

    expect(result).toBe(false)
  })

  it('escopa a contagem pelo clienteId do tenant (isolamento AC-6)', async () => {
    mockPrisma.plano.count.mockResolvedValue(0)

    await isPrimeiroAcesso('cliente-tenant-A')

    expect(mockPrisma.plano.count).toHaveBeenCalledWith({
      where: { clienteId: 'cliente-tenant-A' },
    })
  })

  it('nunca conta planos globalmente — o where sempre carrega o clienteId', async () => {
    mockPrisma.plano.count.mockResolvedValue(3)

    await isPrimeiroAcesso('cliente-tenant-B')

    const call = mockPrisma.plano.count.mock.calls[0][0]
    expect(call.where.clienteId).toBe('cliente-tenant-B')
  })

  it('é leitura pura: não chama create/upsert no Prisma', async () => {
    mockPrisma.plano.count.mockResolvedValue(0)

    await isPrimeiroAcesso('cliente-123')

    // O mock só expõe `count`; qualquer create/upsert quebraria por undefined.
    expect(mockPrisma.plano.count).toHaveBeenCalledTimes(1)
  })
})
