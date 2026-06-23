import { prisma } from '@/lib/prisma'

/**
 * Decide se o tenant está em "primeiro acesso" (onboarding em andamento).
 *
 * Sinal por dados: ausência de qualquer `Plano` no `Cliente`. Não há flag de
 * onboarding no schema (decisão da Story 6.3) — o estado vazio de `/planos` é a
 * UI natural disso. Leitura pura: NÃO cria nem altera nada (bootstrap de tenant
 * é responsabilidade do `signUp`).
 *
 * Isolamento multi-tenant (AC-6): SEMPRE escopado por `clienteId`. Nunca contar
 * planos globalmente — isso vazaria o estado de onboarding entre tenants.
 */
export async function isPrimeiroAcesso(clienteId: string): Promise<boolean> {
  const total = await prisma.plano.count({ where: { clienteId } })
  return total === 0
}
