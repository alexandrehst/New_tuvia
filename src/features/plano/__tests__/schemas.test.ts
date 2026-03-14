import { describe, it, expect } from 'vitest'
import { createPlanoSchema, updatePlanoSchema } from '../schemas'

const validCuid = 'clh1234567890abcdefghijklm'

describe('createPlanoSchema', () => {
  it('aceita dados válidos', () => {
    const result = createPlanoSchema.safeParse({
      titulo: 'Plano Estratégico 2025',
      dataInicio: '2025-01-01',
      dataFim: '2025-12-31',
    })
    expect(result.success).toBe(true)
  })

  it('aplica frequenciaAtualizacao padrão mensal', () => {
    const result = createPlanoSchema.safeParse({
      titulo: 'Plano 2025',
      dataInicio: '2025-01-01',
      dataFim: '2025-12-31',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.frequenciaAtualizacao).toBe('mensal')
    }
  })

  it('aceita todas as frequências válidas', () => {
    for (const freq of ['semanal', 'quinzenal', 'mensal']) {
      const result = createPlanoSchema.safeParse({
        titulo: 'Plano 2025',
        dataInicio: '2025-01-01',
        dataFim: '2025-12-31',
        frequenciaAtualizacao: freq,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejeita frequência inválida', () => {
    const result = createPlanoSchema.safeParse({
      titulo: 'Plano 2025',
      dataInicio: '2025-01-01',
      dataFim: '2025-12-31',
      frequenciaAtualizacao: 'diario',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita título com menos de 3 caracteres', () => {
    const result = createPlanoSchema.safeParse({
      titulo: 'AB',
      dataInicio: '2025-01-01',
      dataFim: '2025-12-31',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('titulo')
  })

  it('converte string de data para Date', () => {
    const result = createPlanoSchema.safeParse({
      titulo: 'Plano 2025',
      dataInicio: '2025-01-01',
      dataFim: '2025-12-31',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dataInicio).toBeInstanceOf(Date)
      expect(result.data.dataFim).toBeInstanceOf(Date)
    }
  })

  it('aceita Date diretamente', () => {
    const result = createPlanoSchema.safeParse({
      titulo: 'Plano 2025',
      dataInicio: new Date('2025-01-01'),
      dataFim: new Date('2025-12-31'),
    })
    expect(result.success).toBe(true)
  })

  it('aceita campos opcionais de IDs', () => {
    const result = createPlanoSchema.safeParse({
      titulo: 'Plano Depto',
      dataInicio: '2025-01-01',
      dataFim: '2025-12-31',
      departamentoId: validCuid,
      planoPaiId: validCuid,
      planoEstrategicoId: validCuid,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita departamentoId com CUID inválido', () => {
    const result = createPlanoSchema.safeParse({
      titulo: 'Plano Depto',
      dataInicio: '2025-01-01',
      dataFim: '2025-12-31',
      departamentoId: 'nao-e-cuid',
    })
    expect(result.success).toBe(false)
  })
})

describe('updatePlanoSchema', () => {
  it('aceita objeto vazio (tudo opcional)', () => {
    expect(updatePlanoSchema.safeParse({}).success).toBe(true)
  })

  it('aceita atualização parcial', () => {
    const result = updatePlanoSchema.safeParse({ titulo: 'Novo título do plano' })
    expect(result.success).toBe(true)
  })

  it('rejeita título curto mesmo em update', () => {
    const result = updatePlanoSchema.safeParse({ titulo: 'AB' })
    expect(result.success).toBe(false)
  })
})
