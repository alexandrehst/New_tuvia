import { describe, it, expect } from 'vitest'
import { planoStatusLabel, planoStatusBadgeClasses } from '../status'

describe('planoStatusLabel', () => {
  it('retorna rótulos em pt-BR para cada status', () => {
    expect(planoStatusLabel('edicao')).toBe('Em planejamento')
    expect(planoStatusLabel('publicado')).toBe('Ativo')
    expect(planoStatusLabel('arquivado')).toBe('Arquivado')
  })

  it('faz fallback para o valor cru em status desconhecido', () => {
    expect(planoStatusLabel('outro')).toBe('outro')
  })
})

describe('planoStatusBadgeClasses', () => {
  it('usa o token de sucesso para publicado', () => {
    expect(planoStatusBadgeClasses('publicado')).toBe('bg-status-no-prazo-bg text-status-no-prazo')
  })

  it('usa muted para edicao e arquivado', () => {
    expect(planoStatusBadgeClasses('edicao')).toBe('bg-muted text-muted-foreground')
    expect(planoStatusBadgeClasses('arquivado')).toBe('bg-muted text-muted-foreground')
  })

  it('faz fallback seguro para status desconhecido', () => {
    expect(planoStatusBadgeClasses('outro')).toBe('bg-muted text-muted-foreground')
  })
})
