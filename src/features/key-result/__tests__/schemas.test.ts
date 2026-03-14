import { describe, it, expect } from 'vitest'
import {
  createKeyResultSchema,
  updateKeyResultValorSchema,
  updateKeyResultSchema,
} from '../schemas'

describe('createKeyResultSchema', () => {
  it('aceita dados válidos com defaults', () => {
    const result = createKeyResultSchema.safeParse({
      objetivoId: 'clx0000000000000000000000',
      descricao: 'Atingir R$ 1M em MRR',
      valorAlvo: 1_000_000,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tipoMetrica).toBe('aumentar')
      expect(result.data.valorInicial).toBe(0)
      expect(result.data.peso).toBe(1)
    }
  })

  it('rejeita quando valorAlvo está ausente', () => {
    const result = createKeyResultSchema.safeParse({
      objetivoId: 'clx0000000000000000000000',
      descricao: 'Sem alvo',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('valorAlvo')
  })

  it('rejeita peso negativo', () => {
    const result = createKeyResultSchema.safeParse({
      objetivoId: 'clx0000000000000000000000',
      descricao: 'KR válido',
      valorAlvo: 100,
      peso: -1,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('peso')
  })

  it('rejeita descrição vazia', () => {
    const result = createKeyResultSchema.safeParse({
      objetivoId: 'clx0000000000000000000000',
      descricao: 'ab',
      valorAlvo: 100,
    })
    expect(result.success).toBe(false)
  })
})

describe('updateKeyResultValorSchema', () => {
  it('aceita valor sem comentário', () => {
    const result = updateKeyResultValorSchema.safeParse({
      krId: 'clx0000000000000000000000',
      valor: 500,
    })
    expect(result.success).toBe(true)
  })

  it('aceita valor com comentário', () => {
    const result = updateKeyResultValorSchema.safeParse({
      krId: 'clx0000000000000000000000',
      valor: 500,
      comentario: 'Boa semana de vendas',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita quando valor está ausente', () => {
    const result = updateKeyResultValorSchema.safeParse({
      krId: 'clx0000000000000000000000',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('valor')
  })
})

describe('updateKeyResultSchema', () => {
  it('aceita objeto parcial vazio (todos campos opcionais)', () => {
    const result = updateKeyResultSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('aceita atualização parcial com apenas descrição', () => {
    const result = updateKeyResultSchema.safeParse({ descricao: 'Nova descrição do KR' })
    expect(result.success).toBe(true)
  })
})
