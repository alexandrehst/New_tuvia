import { describe, it, expect } from 'vitest'
import {
  planoStatusLabel,
  planoStatusBadgeClasses,
  podeEditarEstrutura,
  podeAtualizarValor,
  transicaoValida,
  assertTransicaoPlano,
} from '../lib/status'

describe('rótulos pt-BR', () => {
  it('mapeia enum → rótulo (Em planejamento / Ativo / Arquivado)', () => {
    expect(planoStatusLabel('edicao')).toBe('Em planejamento')
    expect(planoStatusLabel('publicado')).toBe('Ativo')
    expect(planoStatusLabel('arquivado')).toBe('Arquivado')
  })

  it('faz fallback para o valor cru em status desconhecido', () => {
    expect(planoStatusLabel('xpto')).toBe('xpto')
  })

  it('badge classes por status e fallback', () => {
    expect(planoStatusBadgeClasses('publicado')).toContain('status-no-prazo')
    expect(planoStatusBadgeClasses('edicao')).toContain('muted')
    expect(planoStatusBadgeClasses('xpto')).toContain('muted')
  })
})

describe('podeEditarEstrutura', () => {
  it('só permite em edicao', () => {
    expect(podeEditarEstrutura('edicao')).toBe(true)
    expect(podeEditarEstrutura('publicado')).toBe(false)
    expect(podeEditarEstrutura('arquivado')).toBe(false)
  })
})

describe('podeAtualizarValor', () => {
  it('permite em edicao e publicado, bloqueia em arquivado', () => {
    expect(podeAtualizarValor('edicao')).toBe(true)
    expect(podeAtualizarValor('publicado')).toBe(true)
    expect(podeAtualizarValor('arquivado')).toBe(false)
  })
})

describe('transicaoValida / assertTransicaoPlano', () => {
  it('transições válidas', () => {
    expect(transicaoValida('edicao', 'publicado')).toBe(true) // Ativar
    expect(transicaoValida('edicao', 'arquivado')).toBe(true) // Arquivar rascunho
    expect(transicaoValida('publicado', 'edicao')).toBe(true) // Editar reabre
    expect(transicaoValida('publicado', 'arquivado')).toBe(true) // Arquivar
  })

  it('transições inválidas', () => {
    expect(transicaoValida('arquivado', 'publicado')).toBe(false) // terminal
    expect(transicaoValida('arquivado', 'edicao')).toBe(false) // terminal
    expect(transicaoValida('xpto', 'publicado')).toBe(false) // origem desconhecida
  })

  it('assertTransicaoPlano passa em válida e lança em inválida', () => {
    expect(() => assertTransicaoPlano('edicao', 'publicado')).not.toThrow()
    expect(() => assertTransicaoPlano('arquivado', 'publicado')).toThrow(/Transição de estado inválida/)
  })
})
