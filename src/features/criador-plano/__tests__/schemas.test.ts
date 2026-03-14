import { describe, it, expect } from 'vitest'
import {
  step1EmpresaSchema,
  step2SwotSchema,
  step3DiagnosticoSchema,
  criadorPlanoSchema,
} from '../schemas'

describe('step1EmpresaSchema', () => {
  const valid = {
    empresa: 'TechCorp',
    ramo: 'Tecnologia',
    descricaoNegocio: 'Software B2B para gestão de times',
    missao: 'Transformar gestão',
    visao: 'Ser líder no mercado',
    valores: ['Inovação', 'Respeito'],
  }

  it('aceita dados válidos', () => {
    expect(step1EmpresaSchema.safeParse(valid).success).toBe(true)
  })

  it('rejeita empresa com menos de 2 caracteres', () => {
    const result = step1EmpresaSchema.safeParse({ ...valid, empresa: 'T' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('empresa')
  })

  it('rejeita descricaoNegocio com menos de 10 caracteres', () => {
    const result = step1EmpresaSchema.safeParse({ ...valid, descricaoNegocio: 'Curta' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('descricaoNegocio')
  })

  it('rejeita missao com menos de 5 caracteres', () => {
    const result = step1EmpresaSchema.safeParse({ ...valid, missao: 'Abc' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('missao')
  })

  it('rejeita visao com menos de 5 caracteres', () => {
    const result = step1EmpresaSchema.safeParse({ ...valid, visao: 'Abc' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('visao')
  })

  it('rejeita valores com array vazio', () => {
    const result = step1EmpresaSchema.safeParse({ ...valid, valores: [] })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('valores')
  })
})

describe('step2SwotSchema', () => {
  const valid = {
    oportunidades: ['Mercado em crescimento'],
    ameacas: ['Concorrência'],
  }

  it('aceita dados válidos', () => {
    expect(step2SwotSchema.safeParse(valid).success).toBe(true)
  })

  it('aplica default de array vazio para forcas e fraquezas', () => {
    const result = step2SwotSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.forcas).toEqual([])
      expect(result.data.fraquezas).toEqual([])
    }
  })

  it('aceita forcas e fraquezas explícitas', () => {
    const result = step2SwotSchema.safeParse({
      ...valid,
      forcas: ['Equipe experiente'],
      fraquezas: ['Pouco capital'],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.forcas).toEqual(['Equipe experiente'])
      expect(result.data.fraquezas).toEqual(['Pouco capital'])
    }
  })

  it('rejeita oportunidades vazio', () => {
    const result = step2SwotSchema.safeParse({ ...valid, oportunidades: [] })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('oportunidades')
  })

  it('rejeita ameacas vazio', () => {
    const result = step2SwotSchema.safeParse({ ...valid, ameacas: [] })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('ameacas')
  })
})

describe('step3DiagnosticoSchema', () => {
  const valid = {
    ondeEstamos: 'Somos uma empresa em crescimento com 50 colaboradores',
    comecar: ['Implementar OKRs'],
    dataInicio: '2025-01-01',
    dataFim: '2025-12-31',
  }

  it('aceita dados válidos', () => {
    expect(step3DiagnosticoSchema.safeParse(valid).success).toBe(true)
  })

  it('aplica defaults de array vazio para manter e parar', () => {
    const result = step3DiagnosticoSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.manter).toEqual([])
      expect(result.data.parar).toEqual([])
    }
  })

  it('rejeita ondeEstamos com menos de 10 caracteres', () => {
    const result = step3DiagnosticoSchema.safeParse({ ...valid, ondeEstamos: 'Curto' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('ondeEstamos')
  })

  it('rejeita comecar vazio', () => {
    const result = step3DiagnosticoSchema.safeParse({ ...valid, comecar: [] })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('comecar')
  })

  it('converte strings de data para Date', () => {
    const result = step3DiagnosticoSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dataInicio).toBeInstanceOf(Date)
      expect(result.data.dataFim).toBeInstanceOf(Date)
    }
  })
})

describe('criadorPlanoSchema', () => {
  const valid = {
    empresa: 'TechCorp',
    ramo: 'Tecnologia',
    descricaoNegocio: 'Software B2B para gestão de times',
    missao: 'Transformar gestão',
    visao: 'Ser líder no mercado',
    valores: ['Inovação'],
    oportunidades: ['Mercado em crescimento'],
    ameacas: ['Concorrência'],
    ondeEstamos: 'Somos uma empresa com 50 colaboradores',
    comecar: ['Implementar OKRs'],
    dataInicio: '2025-01-01',
    dataFim: '2025-12-31',
  }

  it('aceita dados completos de todos os steps', () => {
    expect(criadorPlanoSchema.safeParse(valid).success).toBe(true)
  })

  it('rejeita dados incompletos sem campos obrigatórios', () => {
    const { empresa, ...sem } = valid
    expect(criadorPlanoSchema.safeParse(sem).success).toBe(false)
  })

  it('aplica todos os defaults dos steps', () => {
    const result = criadorPlanoSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.forcas).toEqual([])
      expect(result.data.fraquezas).toEqual([])
      expect(result.data.manter).toEqual([])
      expect(result.data.parar).toEqual([])
    }
  })
})
