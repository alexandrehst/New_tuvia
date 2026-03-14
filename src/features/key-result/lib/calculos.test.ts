import { describe, it, expect } from 'vitest'
import {
  calcularProgresso,
  calcularRisco,
  calcularProgressoObjetivo,
  gerarLinhaTendencia,
} from './calculos'

// ─────────────────────────────────────────────
// calcularProgresso
// ─────────────────────────────────────────────

describe('calcularProgresso', () => {
  describe('tipo: aumentar', () => {
    it('retorna 50% quando no meio do caminho', () => {
      expect(calcularProgresso('aumentar', 0, 100, 50)).toBe(50)
    })

    it('retorna 0% quando valor igual ao inicial', () => {
      expect(calcularProgresso('aumentar', 200, 400, 200)).toBe(0)
    })

    it('retorna 100% quando valor igual ao alvo', () => {
      expect(calcularProgresso('aumentar', 0, 100, 100)).toBe(100)
    })

    it('retorna > 100% quando valor ultrapassa o alvo', () => {
      expect(calcularProgresso('aumentar', 0, 100, 120)).toBe(120)
    })

    it('retorna valor negativo quando abaixo do inicial', () => {
      expect(calcularProgresso('aumentar', 100, 200, 50)).toBe(-50)
    })

    it('retorna 100% quando range é zero (evita divisão por zero)', () => {
      expect(calcularProgresso('aumentar', 50, 50, 50)).toBe(100)
    })
  })

  describe('tipo: reduzir', () => {
    it('retorna 50% quando no meio do caminho', () => {
      expect(calcularProgresso('reduzir', 100, 0, 50)).toBe(50)
    })

    it('retorna 0% quando valor igual ao inicial (nenhuma redução)', () => {
      expect(calcularProgresso('reduzir', 100, 0, 100)).toBe(0)
    })

    it('retorna 100% quando valor igual ao alvo', () => {
      expect(calcularProgresso('reduzir', 100, 0, 0)).toBe(100)
    })

    it('retorna 100% quando range é zero', () => {
      expect(calcularProgresso('reduzir', 50, 50, 50)).toBe(100)
    })
  })

  describe('tipo: simNao', () => {
    it('retorna 100% quando valor é truthy', () => {
      expect(calcularProgresso('simNao', 0, 1, 1)).toBe(100)
    })

    it('retorna 0% quando valor é 0', () => {
      expect(calcularProgresso('simNao', 0, 1, 0)).toBe(0)
    })
  })
})

// ─────────────────────────────────────────────
// calcularRisco
// ─────────────────────────────────────────────

describe('calcularRisco', () => {
  const base = {
    dataInicio: new Date('2025-01-01'),
    dataFim: new Date('2025-12-31'),
    valorInicial: 0,
    valorAlvo: 1000,
    tipoMetrica: 'aumentar' as const,
  }

  it('retorna no_prazo quando exatamente no valor esperado', () => {
    // No dia 01/07 (meio do ano) o esperado é ~493. Valor atual = 500 (acima).
    const result = calcularRisco({
      ...base,
      valorAtual: 500,
      dataCalculo: new Date('2025-07-01'),
    })
    expect(result).toBe('no_prazo')
  })

  it('retorna em_atraso quando 10% abaixo do esperado', () => {
    // Esperado ~493, atual = 443 (≈ 10% abaixo)
    const result = calcularRisco({
      ...base,
      valorAtual: 443,
      dataCalculo: new Date('2025-07-01'),
    })
    expect(result).toBe('em_atraso')
  })

  it('retorna em_risco quando ~30% abaixo do esperado', () => {
    // Esperado ~493, atual = 345 (≈ 30% abaixo)
    const result = calcularRisco({
      ...base,
      valorAtual: 345,
      dataCalculo: new Date('2025-07-01'),
    })
    expect(result).toBe('em_risco')
  })

  it('retorna risco_alto quando >50% abaixo do esperado', () => {
    // Esperado ~493, atual = 200 (≈ 59% abaixo)
    const result = calcularRisco({
      ...base,
      valorAtual: 200,
      dataCalculo: new Date('2025-07-01'),
    })
    expect(result).toBe('risco_alto')
  })

  it('retorna no_prazo antes da data de início', () => {
    const result = calcularRisco({
      ...base,
      valorAtual: 0,
      dataCalculo: new Date('2024-12-31'),
    })
    expect(result).toBe('no_prazo')
  })

  it('funciona com tipo reduzir', () => {
    // Reduzir de 1000 para 0. No meio (Jul) o esperado é ~503.
    // Valor atual = 600 (acima do esperado → em atraso na redução)
    const result = calcularRisco({
      dataInicio: new Date('2025-01-01'),
      dataFim: new Date('2025-12-31'),
      valorInicial: 1000,
      valorAlvo: 0,
      valorAtual: 600,
      tipoMetrica: 'reduzir',
      dataCalculo: new Date('2025-07-01'),
    })
    expect(['em_atraso', 'em_risco', 'risco_alto']).toContain(result)
  })
})

// ─────────────────────────────────────────────
// calcularProgressoObjetivo
// ─────────────────────────────────────────────

describe('calcularProgressoObjetivo', () => {
  it('retorna 0 para lista vazia', () => {
    expect(calcularProgressoObjetivo([])).toBe(0)
  })

  it('retorna média simples quando todos os pesos são 1', () => {
    const krs = [
      { progresso: 80, peso: 1 },
      { progresso: 60, peso: 1 },
      { progresso: 40, peso: 1 },
    ]
    expect(calcularProgressoObjetivo(krs)).toBe(60)
  })

  it('aplica pesos corretamente', () => {
    const krs = [
      { progresso: 100, peso: 2 }, // peso duplo
      { progresso: 0, peso: 1 },
    ]
    // (100*2 + 0*1) / 3 = 66,67 → arredondado = 67
    expect(calcularProgressoObjetivo(krs)).toBe(67)
  })

  it('retorna 0 quando soma dos pesos é zero', () => {
    const krs = [{ progresso: 100, peso: 0 }]
    expect(calcularProgressoObjetivo(krs)).toBe(0)
  })
})

// ─────────────────────────────────────────────
// gerarLinhaTendencia
// ─────────────────────────────────────────────

describe('gerarLinhaTendencia', () => {
  it('gera N pontos = N meses quando duração < 6 meses', () => {
    const pontos = gerarLinhaTendencia({
      dataInicio: new Date('2025-01-01'),
      dataFim: new Date('2025-04-01'), // ~3 meses
      valorInicial: 0,
      valorAlvo: 300,
    })
    expect(pontos.length).toBeGreaterThanOrEqual(2)
    expect(pontos.length).toBeLessThanOrEqual(4)
  })

  it('gera 6 pontos quando duração ≥ 6 meses', () => {
    const pontos = gerarLinhaTendencia({
      dataInicio: new Date('2025-01-01'),
      dataFim: new Date('2025-12-31'), // 12 meses
      valorInicial: 0,
      valorAlvo: 1000,
    })
    expect(pontos.length).toBe(6)
  })

  it('primeiro ponto tem valorInicial e último tem valorAlvo', () => {
    const pontos = gerarLinhaTendencia({
      dataInicio: new Date('2025-01-01'),
      dataFim: new Date('2025-12-31'),
      valorInicial: 100,
      valorAlvo: 700,
    })
    expect(pontos[0].valor).toBe(100)
    expect(pontos[pontos.length - 1].valor).toBe(700)
  })

  it('todos os pontos têm data válida', () => {
    const pontos = gerarLinhaTendencia({
      dataInicio: new Date('2025-01-01'),
      dataFim: new Date('2025-12-31'),
      valorInicial: 0,
      valorAlvo: 100,
    })
    pontos.forEach((p) => {
      expect(p.data).toBeInstanceOf(Date)
      expect(isNaN(p.data.getTime())).toBe(false)
    })
  })

  it('progressão é estritamente linear (valores crescentes para aumentar)', () => {
    const pontos = gerarLinhaTendencia({
      dataInicio: new Date('2025-01-01'),
      dataFim: new Date('2025-12-31'),
      valorInicial: 0,
      valorAlvo: 1000,
    })
    for (let i = 1; i < pontos.length; i++) {
      expect(pontos[i].valor).toBeGreaterThan(pontos[i - 1].valor)
    }
  })
})
