import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    plano: { findUniqueOrThrow: vi.fn() },
    planoUsuario: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import {
  resolverPapelPlano,
  assertPapelPlano,
  assertPodeMutarPlano,
} from '../guards'

const mockPrisma = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>

const membro = { id: 'user-1', clienteId: 'cliente-1', tipoUser: 'membro' as const }
const admin = { id: 'admin-1', clienteId: 'cliente-1', tipoUser: 'admin' as const }

beforeEach(() => vi.clearAllMocks())

describe('resolverPapelPlano', () => {
  it('admin global resolve owner sem consultar PlanoUsuario', async () => {
    const papel = await resolverPapelPlano('plano-1', admin)
    expect(papel).toBe('owner')
    expect(mockPrisma.planoUsuario.findUnique).not.toHaveBeenCalled()
  })

  it('resolve o papel da linha PlanoUsuario para não-admin', async () => {
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ papel: 'editor' })
    const papel = await resolverPapelPlano('plano-1', membro)
    expect(papel).toBe('editor')
    expect(mockPrisma.planoUsuario.findUnique).toHaveBeenCalledWith({
      where: { planoId_userId: { planoId: 'plano-1', userId: 'user-1' } },
      select: { papel: true },
    })
  })

  it('retorna null quando não há linha (default-deny)', async () => {
    mockPrisma.planoUsuario.findUnique.mockResolvedValue(null)
    const papel = await resolverPapelPlano('plano-1', membro)
    expect(papel).toBeNull()
  })
})

describe('assertPapelPlano', () => {
  it('viewer pedindo editor → lança Acesso negado', async () => {
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ papel: 'viewer' })
    await expect(assertPapelPlano('plano-1', membro, 'editor')).rejects.toThrow('Acesso negado')
  })

  it('editor pedindo editor → passa', async () => {
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ papel: 'editor' })
    await expect(assertPapelPlano('plano-1', membro, 'editor')).resolves.toBeUndefined()
  })

  it('editor pedindo owner → lança', async () => {
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ papel: 'editor' })
    await expect(assertPapelPlano('plano-1', membro, 'owner')).rejects.toThrow('Acesso negado')
  })

  it('owner pedindo owner e editor → passa', async () => {
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ papel: 'owner' })
    await expect(assertPapelPlano('plano-1', membro, 'owner')).resolves.toBeUndefined()
    await expect(assertPapelPlano('plano-1', membro, 'editor')).resolves.toBeUndefined()
  })

  it('admin global passa em owner sem linha PlanoUsuario', async () => {
    await expect(assertPapelPlano('plano-1', admin, 'owner')).resolves.toBeUndefined()
    expect(mockPrisma.planoUsuario.findUnique).not.toHaveBeenCalled()
  })

  it('sem linha e não-admin → lança (default-deny)', async () => {
    mockPrisma.planoUsuario.findUnique.mockResolvedValue(null)
    await expect(assertPapelPlano('plano-1', membro, 'viewer')).rejects.toThrow('Acesso negado')
  })
})

describe('assertPodeMutarPlano', () => {
  const setPlano = (status: string, clienteId = 'cliente-1') =>
    mockPrisma.plano.findUniqueOrThrow.mockResolvedValue({ clienteId, status })

  it('resolve tenant ANTES de papel: recurso de outro tenant lança sem consultar papel', async () => {
    setPlano('edicao', 'cliente-2')
    await expect(
      assertPodeMutarPlano('plano-1', membro, 'editarEstrutura')
    ).rejects.toThrow('Recurso não encontrado')
    expect(mockPrisma.planoUsuario.findUnique).not.toHaveBeenCalled()
  })

  it('editarEstrutura: editor + edicao → passa', async () => {
    setPlano('edicao')
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ papel: 'editor' })
    await expect(assertPodeMutarPlano('plano-1', membro, 'editarEstrutura')).resolves.not.toThrow()
  })

  it('editarEstrutura: editor + publicado → bloqueia (estado)', async () => {
    setPlano('publicado')
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ papel: 'editor' })
    await expect(assertPodeMutarPlano('plano-1', membro, 'editarEstrutura')).rejects.toThrow()
  })

  it('editarEstrutura: viewer + edicao → bloqueia (papel)', async () => {
    setPlano('edicao')
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ papel: 'viewer' })
    await expect(assertPodeMutarPlano('plano-1', membro, 'editarEstrutura')).rejects.toThrow('Acesso negado')
  })

  it('updateKeyResultValor: editor + publicado → passa', async () => {
    setPlano('publicado')
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ papel: 'editor' })
    await expect(assertPodeMutarPlano('plano-1', membro, 'updateKeyResultValor')).resolves.not.toThrow()
  })

  it('updateKeyResultValor: editor + arquivado → bloqueia', async () => {
    setPlano('arquivado')
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ papel: 'editor' })
    await expect(assertPodeMutarPlano('plano-1', membro, 'updateKeyResultValor')).rejects.toThrow()
  })

  it('gerirPlano: arquivado → bloqueia mesmo owner (somente leitura)', async () => {
    setPlano('arquivado')
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ papel: 'owner' })
    await expect(assertPodeMutarPlano('plano-1', membro, 'gerirPlano')).rejects.toThrow()
  })

  it('gerirPlano: owner + publicado → passa', async () => {
    setPlano('publicado')
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ papel: 'owner' })
    await expect(assertPodeMutarPlano('plano-1', membro, 'gerirPlano')).resolves.not.toThrow()
  })

  it('gerirPlano: editor → bloqueia (precisa owner)', async () => {
    setPlano('edicao')
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ papel: 'editor' })
    await expect(assertPodeMutarPlano('plano-1', membro, 'gerirPlano')).rejects.toThrow('Acesso negado')
  })

  it('admin global muta em qualquer operação/estado sem linha', async () => {
    setPlano('publicado')
    await expect(assertPodeMutarPlano('plano-1', admin, 'gerirPlano')).resolves.not.toThrow()
    expect(mockPrisma.planoUsuario.findUnique).not.toHaveBeenCalled()
  })

  it('default-deny: sem linha e não-admin → bloqueia mesmo em edicao', async () => {
    setPlano('edicao')
    mockPrisma.planoUsuario.findUnique.mockResolvedValue(null)
    await expect(assertPodeMutarPlano('plano-1', membro, 'editarEstrutura')).rejects.toThrow('Acesso negado')
  })

  it('retorna o plano carregado ({ clienteId, status }) para reuso', async () => {
    setPlano('edicao')
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ papel: 'owner' })
    const plano = await assertPodeMutarPlano('plano-1', membro, 'gerirPlano')
    expect(plano).toEqual({ clienteId: 'cliente-1', status: 'edicao' })
  })
})
