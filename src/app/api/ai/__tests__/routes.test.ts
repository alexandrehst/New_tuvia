import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetUser, mockFindUnique, mockCreate } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
}))

// Mock do Supabase (auth) — controlado em cada teste.
vi.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

// Mock do Prisma — `getCurrentUser` faz prisma.user.findUnique quando há sessão.
vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: mockFindUnique } },
}))

// Mock do OpenAI — stream falso de um único chunk.
vi.mock('@/lib/openai', () => ({
  openai: { chat: { completions: { create: mockCreate } } },
  MODELO_PADRAO: 'gpt-4o',
}))

import { POST as missaoPOST } from '../missao/route'
import { POST as keyResultsPOST } from '../key-results/route'

function authenticate() {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
  mockFindUnique.mockResolvedValue({ id: 'u1', clienteId: 'cliente-1' })
}

function unauthenticate() {
  mockGetUser.mockResolvedValue({ data: { user: null } })
}

function fakeStream() {
  mockCreate.mockResolvedValue({
    async *[Symbol.asyncIterator]() {
      yield { choices: [{ delta: { content: 'ok' } }] }
    },
  })
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/ai', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/ai/missao', () => {
  it('retorna 401 quando não autenticado', async () => {
    unauthenticate()
    const res = await missaoPOST(makeRequest({ ramo: 'Tech', descricaoNegocio: 'SaaS' }))
    expect(res.status).toBe(401)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('retorna 400 para input inválido', async () => {
    authenticate()
    // falta descricaoNegocio (obrigatório)
    const res = await missaoPOST(makeRequest({ ramo: 'Tech' }))
    expect(res.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('faz streaming quando autenticado e válido', async () => {
    authenticate()
    fakeStream()
    const res = await missaoPOST(makeRequest({ ramo: 'Tech', descricaoNegocio: 'SaaS' }))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8')
    expect(mockCreate).toHaveBeenCalledOnce()
  })
})

describe('POST /api/ai/key-results', () => {
  it('retorna 401 quando não autenticado', async () => {
    unauthenticate()
    const res = await keyResultsPOST(
      makeRequest({ objetivo: 'Crescer', empresa: 'Acme', ramo: 'Tech' })
    )
    expect(res.status).toBe(401)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('retorna 400 para input inválido (JSON malformado)', async () => {
    authenticate()
    const res = await keyResultsPOST(makeRequest('{not json'))
    expect(res.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('retorna 400 quando string excede o limite (.max)', async () => {
    authenticate()
    const res = await keyResultsPOST(
      makeRequest({ objetivo: 'x'.repeat(5000), empresa: 'Acme', ramo: 'Tech' })
    )
    expect(res.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })
})
