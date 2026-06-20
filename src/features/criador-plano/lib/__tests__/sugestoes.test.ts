import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchSugestoes } from '../sugestoes'

afterEach(() => vi.unstubAllGlobals())

function mockFetch(impl: () => Partial<Response>) {
  vi.stubGlobal('fetch', vi.fn(async () => impl() as Response))
}

describe('fetchSugestoes', () => {
  it('parseia o corpo em linhas (trim/filtra vazios/≤5)', async () => {
    mockFetch(() => ({ ok: true, text: async () => '  Inovação  \n\nRespeito\nFoco\n' }))

    const result = await fetchSugestoes('valores', { empresa: 'Acme' })

    expect(result).toEqual(['Inovação', 'Respeito', 'Foco'])
  })

  it('limita a 5 sugestões', async () => {
    mockFetch(() => ({ ok: true, text: async () => 'a\nb\nc\nd\ne\nf\ng' }))

    const result = await fetchSugestoes('visao', {})

    expect(result).toHaveLength(5)
    expect(result).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('retorna lista vazia quando o corpo vem vazio', async () => {
    mockFetch(() => ({ ok: true, text: async () => '   \n  \n' }))

    const result = await fetchSugestoes('missao', {})

    expect(result).toEqual([])
  })

  it('lança erro quando a resposta não é ok', async () => {
    mockFetch(() => ({ ok: false, text: async () => '' }))

    await expect(fetchSugestoes('missao', {})).rejects.toThrow()
  })

  it('chama o endpoint correto com POST e JSON', async () => {
    const spy = vi.fn(async () => ({ ok: true, text: async () => 'x' }) as Response)
    vi.stubGlobal('fetch', spy)

    await fetchSugestoes('oportunidades', { ramo: 'Tech' })

    expect(spy).toHaveBeenCalledWith(
      '/api/ai/oportunidades',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ ramo: 'Tech' }) })
    )
  })
})
