/**
 * Fonte ÚNICA de apresentação do status de um Plano (enum StatusPlano).
 * Rótulos e cores derivam daqui — não duplicar em componentes (NFR-7).
 * Cores via tokens do design system, nunca hex.
 */

export type StatusPlano = 'edicao' | 'publicado' | 'arquivado'

export const PLANO_STATUS_LABELS: Record<StatusPlano, string> = {
  edicao: 'Edição',
  publicado: 'Publicado',
  arquivado: 'Arquivado',
}

export function planoStatusLabel(status: string): string {
  return PLANO_STATUS_LABELS[status as StatusPlano] ?? String(status)
}

// Classes de token (fg + bg) por status. Literais completos para o scanner do Tailwind v4.
const PLANO_STATUS_BADGE_CLASSES: Record<StatusPlano, string> = {
  publicado: 'bg-status-no-prazo-bg text-status-no-prazo',
  edicao: 'bg-muted text-muted-foreground',
  arquivado: 'bg-muted text-muted-foreground',
}

export function planoStatusBadgeClasses(status: string): string {
  return PLANO_STATUS_BADGE_CLASSES[status as StatusPlano] ?? 'bg-muted text-muted-foreground'
}
