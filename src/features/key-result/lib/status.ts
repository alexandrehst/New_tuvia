import type { StatusRisco } from './calculos'

/**
 * Fonte ÚNICA de apresentação do status de risco de um Resultado-Chave.
 * Rótulos e cores derivam daqui — não duplicar em componentes (NFR-7).
 * Cores via tokens do design system (`--color-status-*`), nunca hex.
 */

export const STATUS_LABELS: Record<StatusRisco, string> = {
  no_prazo: 'No prazo',
  em_atraso: 'Em atraso',
  em_risco: 'Em risco',
  risco_alto: 'Risco alto',
}

export function statusLabel(status: StatusRisco): string {
  return STATUS_LABELS[status] ?? String(status)
}

// Classes de token (fg + bg) por status. Literais completos para o scanner do Tailwind v4 detectar.
const STATUS_PILL_CLASSES: Record<StatusRisco, string> = {
  no_prazo: 'bg-status-no-prazo-bg text-status-no-prazo',
  em_atraso: 'bg-status-em-atraso-bg text-status-em-atraso',
  em_risco: 'bg-status-em-risco-bg text-status-em-risco',
  risco_alto: 'bg-status-risco-alto-bg text-status-risco-alto',
}

export function statusPillClasses(status: StatusRisco): string {
  return STATUS_PILL_CLASSES[status] ?? 'bg-muted text-muted-foreground'
}
