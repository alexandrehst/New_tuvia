import { describe, it, expect } from 'vitest'
import { createObjetivoSchema, updateObjetivoSchema } from '../schemas'

const validCuid = 'clh1234567890abcdefghijklm'

describe('createObjetivoSchema', () => {
  it('aceita dados válidos mínimos', () => {
    const result = createObjetivoSchema.safeParse({
      planoId: validCuid,
      titulo: 'Aumentar receita',
      numero: 1,
    })
    expect(result.success).toBe(true)
  })

  it('aceita dados completos com responsáveis', () => {
    const result = createObjetivoSchema.safeParse({
      planoId: validCuid,
      titulo: 'Aumentar receita',
      descricao: 'Crescer 20% YoY',
      numero: 1,
      responsaveisIds: [validCuid],
      objetivoVinculadoId: validCuid,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita título com menos de 3 caracteres', () => {
    const result = createObjetivoSchema.safeParse({
      planoId: validCuid,
      titulo: 'AB',
      numero: 1,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('titulo')
  })

  it('rejeita planoId inválido', () => {
    const result = createObjetivoSchema.safeParse({
      planoId: 'nao-e-cuid',
      titulo: 'Objetivo válido',
      numero: 1,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('planoId')
  })

  it('rejeita numero não-positivo', () => {
    const result = createObjetivoSchema.safeParse({
      planoId: validCuid,
      titulo: 'Objetivo válido',
      numero: 0,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('numero')
  })

  it('rejeita numero negativo', () => {
    const result = createObjetivoSchema.safeParse({
      planoId: validCuid,
      titulo: 'Objetivo válido',
      numero: -1,
    })
    expect(result.success).toBe(false)
  })

  it('rejeita numero decimal', () => {
    const result = createObjetivoSchema.safeParse({
      planoId: validCuid,
      titulo: 'Objetivo válido',
      numero: 1.5,
    })
    expect(result.success).toBe(false)
  })

  it('rejeita responsaveisIds com CUID inválido', () => {
    const result = createObjetivoSchema.safeParse({
      planoId: validCuid,
      titulo: 'Objetivo válido',
      numero: 1,
      responsaveisIds: ['nao-e-cuid'],
    })
    expect(result.success).toBe(false)
  })

  it('aceita responsaveisIds vazio', () => {
    const result = createObjetivoSchema.safeParse({
      planoId: validCuid,
      titulo: 'Objetivo válido',
      numero: 1,
      responsaveisIds: [],
    })
    expect(result.success).toBe(true)
  })
})

describe('updateObjetivoSchema', () => {
  it('aceita objeto vazio (tudo opcional)', () => {
    expect(updateObjetivoSchema.safeParse({}).success).toBe(true)
  })

  it('aceita atualização parcial de titulo', () => {
    const result = updateObjetivoSchema.safeParse({ titulo: 'Novo título' })
    expect(result.success).toBe(true)
  })

  it('rejeita titulo muito curto mesmo em update', () => {
    const result = updateObjetivoSchema.safeParse({ titulo: 'AB' })
    expect(result.success).toBe(false)
  })

  it('não aceita planoId (foi omitido do schema)', () => {
    const result = updateObjetivoSchema.safeParse({ planoId: validCuid })
    // planoId is stripped (omit), parse succeeds but field is ignored
    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as Record<string, unknown>).planoId).toBeUndefined()
    }
  })
})
