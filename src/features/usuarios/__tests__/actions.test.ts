import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    planoUsuario: { update: vi.fn(), delete: vi.fn(), findUnique: vi.fn() },
    user: { update: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('@/lib/brevo', () => ({
  sendEmail: vi.fn(),
  TEMPLATES: { CONVITE: 5 },
}))

vi.mock('@/features/auth/guards', () => ({
  requireUser: vi.fn(async () => ({ id: 'u-1', clienteId: 'cliente-1', tipoUser: 'admin' })),
  requireAdmin: vi.fn(async () => ({ id: 'admin-1', clienteId: 'cliente-1', tipoUser: 'admin' })),
  assertMesmoTenant: (recurso: string | null | undefined, usuario: string) => {
    if (recurso !== usuario) throw new Error('Recurso não encontrado')
  },
  // updatePapel/removerMembroDoPlano usam o contrato (gerirPlano = owner); testado em guards.test.ts.
  assertPodeMutarPlano: vi.fn(async () => ({ clienteId: 'cliente-1', status: 'edicao' })),
}))

import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/brevo'
import { requireAdmin, assertPodeMutarPlano } from '@/features/auth/guards'
import { updatePapel, updateNotificacao, removerMembroDoPlano, inviteUser } from '../actions'

const mockSendEmail = sendEmail as unknown as ReturnType<typeof vi.fn>
const mockRequireAdmin = requireAdmin as unknown as ReturnType<typeof vi.fn>
const mockPrisma = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>

const ADMIN = { id: 'admin-1', clienteId: 'cliente-1', tipoUser: 'admin' }

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireAdmin.mockResolvedValue(ADMIN)
})

describe('updatePapel', () => {
  it('atualiza o papel do vínculo (autorizado pelo contrato)', async () => {
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ planoId: 'p-1' })
    mockPrisma.planoUsuario.update.mockResolvedValue({})

    await updatePapel('pu-1', 'editor')

    expect(mockPrisma.planoUsuario.update).toHaveBeenCalledWith({
      where: { id: 'pu-1' },
      data: { papel: 'editor' },
    })
    // Gerir papel = operação 'gerirPlano' (owner) sobre o plano do vínculo.
    expect(vi.mocked(assertPodeMutarPlano)).toHaveBeenCalledWith('p-1', expect.anything(), 'gerirPlano')
  })

  it('rejeita papel inválido', async () => {
    // @ts-expect-error testando valor inválido
    await expect(updatePapel('pu-1', 'superadmin')).rejects.toThrow()
  })

  it('lança quando o vínculo não existe', async () => {
    mockPrisma.planoUsuario.findUnique.mockResolvedValue(null)
    await expect(updatePapel('pu-1', 'editor')).rejects.toThrow()
    expect(mockPrisma.planoUsuario.update).not.toHaveBeenCalled()
  })

  it('bloqueia quem não pode gerir o plano (guard nega)', async () => {
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ planoId: 'p-1' })
    vi.mocked(assertPodeMutarPlano).mockRejectedValueOnce(new Error('Acesso negado'))
    await expect(updatePapel('pu-1', 'editor')).rejects.toThrow()
    expect(mockPrisma.planoUsuario.update).not.toHaveBeenCalled()
  })
})

describe('updateNotificacao', () => {
  it('mapeia campo para a coluna correta e atualiza (mesmo tenant)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ clienteId: 'cliente-1' })
    mockPrisma.user.update.mockResolvedValue({})

    await updateNotificacao('u-1', 'objetivo', false)

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u-1' },
      data: { atualizacaoEmailObjetivo: false },
    })
  })

  it('mapeia plano e resultado', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ clienteId: 'cliente-1' })
    mockPrisma.user.update.mockResolvedValue({})

    await updateNotificacao('u-1', 'plano', true)
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u-1' },
      data: { atualizacaoEmailPlano: true },
    })
    await updateNotificacao('u-1', 'resultado', false)
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u-1' },
      data: { atualizacaoEmailResultado: false },
    })
  })

  it('rejeita campo inválido', async () => {
    // @ts-expect-error testando valor inválido
    await expect(updateNotificacao('u-1', 'sms', true)).rejects.toThrow()
  })

  it('bloqueia usuário de outro tenant', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ clienteId: 'cliente-2' })
    await expect(updateNotificacao('u-1', 'plano', true)).rejects.toThrow()
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })
})

describe('removerMembroDoPlano', () => {
  it('deleta o vínculo (autorizado pelo contrato)', async () => {
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ planoId: 'p-9' })
    mockPrisma.planoUsuario.delete.mockResolvedValue({})

    await removerMembroDoPlano('pu-9')

    expect(mockPrisma.planoUsuario.delete).toHaveBeenCalledWith({ where: { id: 'pu-9' } })
  })

  it('bloqueia quem não pode gerir o plano (guard nega)', async () => {
    mockPrisma.planoUsuario.findUnique.mockResolvedValue({ planoId: 'p-9' })
    vi.mocked(assertPodeMutarPlano).mockRejectedValueOnce(new Error('Acesso negado'))
    await expect(removerMembroDoPlano('pu-9')).rejects.toThrow()
    expect(mockPrisma.planoUsuario.delete).not.toHaveBeenCalled()
  })
})

describe('inviteUser', () => {
  it('cria o membro pendente no tenant do admin e envia o convite', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({ id: 'u-novo' })
    mockSendEmail.mockResolvedValue(undefined)

    const result = await inviteUser({ email: 'novo@acme.com', nome: 'Novo' })

    expect(result).toEqual({ ok: true, emailEnviado: true })
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clienteId: 'cliente-1',
          email: 'novo@acme.com',
          nome: 'Novo',
          statusUser: 'pendente',
          temConvite: true,
        }),
      })
    )
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ templateId: 5, to: [{ email: 'novo@acme.com', name: 'Novo' }] })
    )
  })

  it('deriva o nome do local-part quando não informado', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({ id: 'u' })
    mockSendEmail.mockResolvedValue(undefined)

    await inviteUser({ email: 'maria@acme.com' })

    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ nome: 'maria', clienteId: 'cliente-1' }) })
    )
  })

  it('retorna erro para e-mail inválido (sem criar)', async () => {
    const result = await inviteUser({ email: 'invalido' })
    expect(result).toEqual({ ok: false, erro: 'E-mail inválido' })
    expect(mockPrisma.user.create).not.toHaveBeenCalled()
  })

  it('retorna erro para e-mail duplicado (sem criar)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existente' })
    const result = await inviteUser({ email: 'ana@acme.com' })
    expect(result).toEqual({ ok: false, erro: 'Este e-mail já é membro' })
    expect(mockPrisma.user.create).not.toHaveBeenCalled()
  })

  it('trata falha de e-mail como não-fatal (membro criado)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({ id: 'u' })
    mockSendEmail.mockRejectedValue(new Error('Brevo down'))

    const result = await inviteUser({ email: 'novo@acme.com' })

    expect(result).toEqual({ ok: true, emailEnviado: false })
    expect(mockPrisma.user.create).toHaveBeenCalled()
  })

  it('bloqueia não-admin (sem criar)', async () => {
    mockRequireAdmin.mockRejectedValue(new Error('Acesso negado'))
    await expect(inviteUser({ email: 'novo@acme.com' })).rejects.toThrow()
    expect(mockPrisma.user.create).not.toHaveBeenCalled()
  })
})
