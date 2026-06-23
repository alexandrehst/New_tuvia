/**
 * Fonte ÚNICA de apresentação E de máquina de estado de um Plano (enum StatusPlano).
 * Rótulos, cores e transições derivam daqui — não duplicar em componentes nem nas actions (NFR-7).
 * Cores via tokens do design system, nunca hex.
 *
 * O enforcement de papel×estado por operação vive no contrato unificado
 * `assertPodeMutarPlano` (src/features/auth/guards.ts), que consome os helpers de estado daqui.
 */

export type StatusPlano = 'edicao' | 'publicado' | 'arquivado'

export const PLANO_STATUS_LABELS: Record<StatusPlano, string> = {
  edicao: 'Em planejamento',
  publicado: 'Ativo',
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

// ─────────────────────────────────────────────
// Máquina de estado (D3)
// ─────────────────────────────────────────────

/** Edição estrutural (objetivos/KRs/metadados do plano) só é livre em `edicao`. */
export function podeEditarEstrutura(status: string): boolean {
  return status === 'edicao'
}

/** Atualizar VALOR de KR é permitido em `edicao` e `publicado` (não em `arquivado`). */
export function podeAtualizarValor(status: string): boolean {
  return status === 'edicao' || status === 'publicado'
}

/**
 * Transições válidas do ciclo de vida do Plano (todas exigem papel `owner` — imposto no guard):
 *   edicao    → publicado   (Ativar)
 *   edicao    → arquivado   (Arquivar — descarta rascunho)
 *   publicado → edicao      ("Editar" reabre um plano Ativo para planejamento)
 *   publicado → arquivado   (Arquivar)
 *   arquivado → *           terminal
 */
const TRANSICOES_VALIDAS: Record<StatusPlano, StatusPlano[]> = {
  edicao: ['publicado', 'arquivado'],
  publicado: ['edicao', 'arquivado'],
  arquivado: [],
}

export function transicaoValida(de: string, para: StatusPlano): boolean {
  const saidas = TRANSICOES_VALIDAS[de as StatusPlano]
  return saidas ? saidas.includes(para) : false
}

/** Valida uma transição de estado; lança erro de domínio pt-BR se inválida. */
export function assertTransicaoPlano(de: string, para: StatusPlano): void {
  if (!transicaoValida(de, para)) {
    throw new Error(
      `Transição de estado inválida: não é possível ir de "${planoStatusLabel(de)}" para "${planoStatusLabel(para)}".`
    )
  }
}
