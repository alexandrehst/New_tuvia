import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createObjetivo, deleteObjetivo } from '../actions'

const validCuid = 'clh1234567890abcdefghijklm'
const validCuid2 = 'clh9876543210zyxwvutsrqpon'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    objetivo: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    objetivoResponsavel: {
      createMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockPrisma = prisma as unknown as {
  objetivo: { create: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }
  objetivoResponsavel: { createMany: ReturnType<typeof vi.fn> }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createObjetivo', () => {
  it('cria objetivo sem responsáveis', async () => {
    const fakeObjetivo = { id: validCuid, titulo: 'Crescer receita', numero: 1 }
    mockPrisma.objetivo.create.mockResolvedValue(fakeObjetivo)

    const result = await createObjetivo({
      planoId: validCuid,
      titulo: 'Crescer receita',
      numero: 1,
    })

    expect(mockPrisma.objetivo.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        planoId: validCuid,
        titulo: 'Crescer receita',
        numero: 1,
      }),
    })
    expect(mockPrisma.objetivoResponsavel.createMany).not.toHaveBeenCalled()
    expect(result).toEqual(fakeObjetivo)
  })

  it('cria objetivo com responsáveis', async () => {
    const fakeObjetivo = { id: validCuid2, titulo: 'Melhorar NPS', numero: 2 }
    mockPrisma.objetivo.create.mockResolvedValue(fakeObjetivo)
    mockPrisma.objetivoResponsavel.createMany.mockResolvedValue({ count: 1 })

    await createObjetivo({
      planoId: validCuid,
      titulo: 'Melhorar NPS',
      numero: 2,
      responsaveisIds: [validCuid],
    })

    expect(mockPrisma.objetivoResponsavel.createMany).toHaveBeenCalledWith({
      data: [{ objetivoId: validCuid2, userId: validCuid }],
    })
  })

  it('não cria responsáveis quando array está vazio', async () => {
    mockPrisma.objetivo.create.mockResolvedValue({ id: validCuid })

    await createObjetivo({
      planoId: validCuid,
      titulo: 'Objetivo sem responsáveis',
      numero: 1,
      responsaveisIds: [],
    })

    expect(mockPrisma.objetivoResponsavel.createMany).not.toHaveBeenCalled()
  })

  it('lança erro de validação para título muito curto', async () => {
    await expect(
      createObjetivo({ planoId: validCuid, titulo: 'AB', numero: 1 })
    ).rejects.toThrow()
  })
})

describe('deleteObjetivo', () => {
  it('deleta objetivo pelo id', async () => {
    mockPrisma.objetivo.delete.mockResolvedValue({})

    await deleteObjetivo(validCuid)

    expect(mockPrisma.objetivo.delete).toHaveBeenCalledWith({ where: { id: validCuid } })
  })
})
