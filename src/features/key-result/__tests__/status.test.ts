import { describe, it, expect } from 'vitest'
import type { StatusRisco } from '../lib/calculos'
import { statusLabel, statusPillClasses, STATUS_LABELS } from '../lib/status'

const ALL: StatusRisco[] = ['no_prazo', 'em_atraso', 'em_risco', 'risco_alto']

describe('statusLabel', () => {
  it('mapeia cada StatusRisco ao rótulo pt-BR canônico', () => {
    expect(statusLabel('no_prazo')).toBe('No prazo')
    expect(statusLabel('em_atraso')).toBe('Em atraso')
    expect(statusLabel('em_risco')).toBe('Em risco')
    expect(statusLabel('risco_alto')).toBe('Risco alto')
  })

  it('cobre os 4 valores de StatusRisco', () => {
    ALL.forEach((s) => expect(STATUS_LABELS[s]).toBeTruthy())
  })
})

describe('statusPillClasses', () => {
  it('retorna par de classes de token fg + bg por status', () => {
    expect(statusPillClasses('no_prazo')).toContain('text-status-no-prazo')
    expect(statusPillClasses('no_prazo')).toContain('bg-status-no-prazo-bg')
    expect(statusPillClasses('risco_alto')).toContain('text-status-risco-alto')
    expect(statusPillClasses('risco_alto')).toContain('bg-status-risco-alto-bg')
  })

  it('cada status tem fg e bg de token (sem hex)', () => {
    ALL.forEach((s) => {
      const cls = statusPillClasses(s)
      expect(cls).toMatch(/bg-status-[a-z-]+-bg/)
      expect(cls).toMatch(/text-status-[a-z-]+/)
      expect(cls).not.toMatch(/#[0-9a-fA-F]{3,6}/)
    })
  })
})
