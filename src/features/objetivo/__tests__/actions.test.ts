import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createObjetivo, updateObjetivo, deleteObjetivo } from '../actions'

const validCuid = 'clh1234567890abcdefghijklm'
const validCuid2 = 'clh9876543210zyxwvutsrqpon'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    plano: { findUniqueOrThrow: vi.fn() },
    objetivo: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    objetivoResponsavel: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock('@/features/auth/guards', () => ({
  requireUser: vi.fn(async () => ({ id: 'u', clienteId: 'cliente-1' })),
  assertMesmoTenant: (recurso: string | null | undefined, usuario: string) => {
    if (recurso !== usuario) throw new Error('Recurso não encontrado')
  },
}))

import { prisma } from '@/lib/prisma'

const mockPrisma = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma.plano.findUniqueOrThrow.mockResolvedValue({ clienteId: 'cliente-1' })
  mockPrisma.objetivo.findUniqueOrThrow.mockResolvedValue({ plano: { clienteId: 'cliente-1' } })
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

  it('bloqueia criação em plano de outro tenant', async () => {
    mockPrisma.plano.findUniqueOrThrow.mockResolvedValue({ clienteId: 'cliente-2' })
    await expect(
      createObjetivo({ planoId: validCuid, titulo: 'Crescer receita', numero: 1 })
    ).rejects.toThrow()
    expect(mockPrisma.objetivo.create).not.toHaveBeenCalled()
  })
})

describe('updateObjetivo', () => {
  it('atualiza campos e reconcilia responsáveis (deleteMany + createMany)', async () => {
    mockPrisma.objetivo.update.mockResolvedValue({ id: validCuid, titulo: 'Novo título', numero: 1 })
    mockPrisma.objetivoResponsavel.deleteMany.mockResolvedValue({ count: 2 })
    mockPrisma.objetivoResponsavel.createMany.mockResolvedValue({ count: 1 })

    await updateObjetivo(validCuid, {
      titulo: 'Novo título',
      numero: 1,
      responsaveisIds: [validCuid2],
    })

    expect(mockPrisma.objetivo.update).toHaveBeenCalledWith({
      where: { id: validCuid },
      data: expect.objectContaining({ titulo: 'Novo título', numero: 1 }),
    })
    expect(mockPrisma.objetivoResponsavel.deleteMany).toHaveBeenCalledWith({ where: { objetivoId: validCuid } })
    expect(mockPrisma.objetivoResponsavel.createMany).toHaveBeenCalledWith({
      data: [{ objetivoId: validCuid, userId: validCuid2 }],
    })
  })

  it('remove responsáveis quando array vazio (deleteMany, sem createMany)', async () => {
    mockPrisma.objetivo.update.mockResolvedValue({ id: validCuid })
    mockPrisma.objetivoResponsavel.deleteMany.mockResolvedValue({ count: 0 })

    await updateObjetivo(validCuid, {
      titulo: 'Sem responsáveis',
      numero: 1,
      responsaveisIds: [],
    })

    expect(mockPrisma.objetivoResponsavel.deleteMany).toHaveBeenCalled()
    expect(mockPrisma.objetivoResponsavel.createMany).not.toHaveBeenCalled()
  })

  it('lança erro de validação para título muito curto', async () => {
    await expect(
      updateObjetivo(validCuid, { titulo: 'AB', numero: 1 })
    ).rejects.toThrow()
  })
})

describe('deleteObjetivo', () => {
  it('deleta objetivo pelo id (mesmo tenant)', async () => {
    mockPrisma.objetivo.delete.mockResolvedValue({})

    await deleteObjetivo(validCuid)

    expect(mockPrisma.objetivo.delete).toHaveBeenCalledWith({ where: { id: validCuid } })
  })

  it('bloqueia exclusão de outro tenant', async () => {
    mockPrisma.objetivo.findUniqueOrThrow.mockResolvedValue({ plano: { clienteId: 'cliente-2' } })
    await expect(deleteObjetivo(validCuid)).rejects.toThrow()
    expect(mockPrisma.objetivo.delete).not.toHaveBeenCalled()
  })
})
