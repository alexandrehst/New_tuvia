import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signIn, signUp, resetPassword } from '../actions'
import { redirect } from 'next/navigation'

vi.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cliente: { create: vi.fn() },
    user: { create: vi.fn() },
  },
}))

vi.mock('@/lib/brevo', () => ({
  sendEmail: vi.fn(),
  TEMPLATES: { BOAS_VINDAS: 2 },
}))

import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/brevo'

const mockCreateSupabase = createSupabaseServerClient as ReturnType<typeof vi.fn>
const mockPrisma = prisma as unknown as {
  cliente: { create: ReturnType<typeof vi.fn> }
  user: { create: ReturnType<typeof vi.fn> }
}

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData()
  Object.entries(fields).forEach(([k, v]) => fd.set(k, v))
  return fd
}

function makeSupabaseMock(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({}),
      ...overrides,
    },
  }
}

beforeEach(() => vi.clearAllMocks())

describe('signIn', () => {
  it('retorna erro para email inválido sem chamar Supabase', async () => {
    const result = await signIn(null, makeFormData({ email: 'invalido', password: '123456' }))
    expect(result?.error).toBeDefined()
    expect(mockCreateSupabase).not.toHaveBeenCalled()
  })

  it('retorna erro para senha muito curta sem chamar Supabase', async () => {
    const result = await signIn(null, makeFormData({ email: 'a@b.com', password: '123' }))
    expect(result?.error).toBeDefined()
    expect(mockCreateSupabase).not.toHaveBeenCalled()
  })

  it('retorna erro quando Supabase retorna erro de auth', async () => {
    const supabase = makeSupabaseMock()
    supabase.auth.signInWithPassword = vi.fn().mockResolvedValue({ error: { message: 'Invalid credentials' } })
    mockCreateSupabase.mockResolvedValue(supabase)

    const result = await signIn(null, makeFormData({ email: 'a@b.com', password: '123456' }))
    expect(result?.error).toBe('Email ou senha inválidos')
  })

  it('redireciona para /planos em caso de sucesso', async () => {
    mockCreateSupabase.mockResolvedValue(makeSupabaseMock())

    await signIn(null, makeFormData({ email: 'a@b.com', password: '123456' }))

    expect(redirect).toHaveBeenCalledWith('/planos')
  })
})

describe('signUp', () => {
  it('retorna erro para dados inválidos sem chamar Supabase', async () => {
    const result = await signUp(null, makeFormData({ nome: 'J', email: 'invalido', password: '12345678' }))
    expect(result?.error).toBeDefined()
    expect(mockCreateSupabase).not.toHaveBeenCalled()
  })

  it('retorna erro quando Supabase falha no cadastro', async () => {
    const supabase = makeSupabaseMock()
    supabase.auth.signUp = vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Email já existe' } })
    mockCreateSupabase.mockResolvedValue(supabase)

    const result = await signUp(null, makeFormData({ nome: 'João', email: 'a@b.com', password: '12345678' }))
    expect(result?.error).toBe('Email já existe')
  })

  it('retorna erro genérico quando user é null sem erro explícito', async () => {
    const supabase = makeSupabaseMock()
    supabase.auth.signUp = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    mockCreateSupabase.mockResolvedValue(supabase)

    const result = await signUp(null, makeFormData({ nome: 'João', email: 'a@b.com', password: '12345678' }))
    expect(result?.error).toBe('Erro ao criar conta')
  })

  it('cria cliente e usuário no Prisma em caso de sucesso', async () => {
    mockCreateSupabase.mockResolvedValue(makeSupabaseMock())
    mockPrisma.cliente.create.mockResolvedValue({ id: 'cliente-1' })
    mockPrisma.user.create.mockResolvedValue({})
    vi.mocked(sendEmail).mockResolvedValue(undefined)

    await signUp(null, makeFormData({ nome: 'João', email: 'joao@b.com', password: '12345678' }))

    expect(mockPrisma.cliente.create).toHaveBeenCalledWith({ data: { nome: 'João' } })
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ clienteId: 'cliente-1', email: 'joao@b.com' }),
      })
    )
  })

  it('envia email de boas-vindas', async () => {
    mockCreateSupabase.mockResolvedValue(makeSupabaseMock())
    mockPrisma.cliente.create.mockResolvedValue({ id: 'cliente-1' })
    mockPrisma.user.create.mockResolvedValue({})
    vi.mocked(sendEmail).mockResolvedValue(undefined)

    await signUp(null, makeFormData({ nome: 'João', email: 'joao@b.com', password: '12345678' }))

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ templateId: 2 })
    )
  })

  it('continua e redireciona mesmo se envio de email falhar', async () => {
    mockCreateSupabase.mockResolvedValue(makeSupabaseMock())
    mockPrisma.cliente.create.mockResolvedValue({ id: 'cliente-1' })
    mockPrisma.user.create.mockResolvedValue({})
    vi.mocked(sendEmail).mockRejectedValue(new Error('SMTP error'))

    await signUp(null, makeFormData({ nome: 'João', email: 'joao@b.com', password: '12345678' }))

    expect(redirect).toHaveBeenCalledWith('/planos')
  })

  it('redireciona para /planos em caso de sucesso', async () => {
    mockCreateSupabase.mockResolvedValue(makeSupabaseMock())
    mockPrisma.cliente.create.mockResolvedValue({ id: 'cliente-1' })
    mockPrisma.user.create.mockResolvedValue({})
    vi.mocked(sendEmail).mockResolvedValue(undefined)

    await signUp(null, makeFormData({ nome: 'João', email: 'joao@b.com', password: '12345678' }))

    expect(redirect).toHaveBeenCalledWith('/planos')
  })
})

describe('resetPassword', () => {
  it('retorna erro para email inválido', async () => {
    const result = await resetPassword(null, makeFormData({ email: 'invalido' }))
    expect(result?.error).toBeDefined()
    expect(mockCreateSupabase).not.toHaveBeenCalled()
  })

  it('chama Supabase resetPasswordForEmail com o email correto', async () => {
    const supabase = makeSupabaseMock()
    mockCreateSupabase.mockResolvedValue(supabase)

    await resetPassword(null, makeFormData({ email: 'a@b.com' }))

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'a@b.com',
      expect.objectContaining({ redirectTo: expect.stringContaining('/nova-senha') })
    )
  })

  it('retorna success: true em caso de sucesso', async () => {
    mockCreateSupabase.mockResolvedValue(makeSupabaseMock())

    const result = await resetPassword(null, makeFormData({ email: 'a@b.com' }))

    expect(result).toEqual({ success: true })
  })
})
