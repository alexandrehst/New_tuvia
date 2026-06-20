import { describe, it, expect } from 'vitest'
import { tempoRelativo } from '../lib/tempo'

const now = Date.now()

describe('tempoRelativo', () => {
  it('retorna "agora" para menos de 1 min', () => {
    expect(tempoRelativo(new Date(now - 30_000))).toBe('agora')
  })

  it('retorna minutos', () => {
    expect(tempoRelativo(new Date(now - 5 * 60_000))).toBe('há 5 min')
  })

  it('retorna horas', () => {
    expect(tempoRelativo(new Date(now - 3 * 3_600_000))).toBe('há 3 h')
  })

  it('singular para 1 dia, plural para vários', () => {
    expect(tempoRelativo(new Date(now - 24 * 3_600_000))).toBe('há 1 dia')
    expect(tempoRelativo(new Date(now - 5 * 24 * 3_600_000))).toBe('há 5 dias')
  })

  it('cai para data curta a partir de ~30 dias', () => {
    const old = new Date(now - 60 * 24 * 3_600_000)
    expect(tempoRelativo(old)).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })

  it('aceita string e número; retorna "" para data inválida', () => {
    expect(tempoRelativo(new Date(now - 5 * 60_000).toISOString())).toBe('há 5 min')
    expect(tempoRelativo('data-invalida')).toBe('')
  })
})
