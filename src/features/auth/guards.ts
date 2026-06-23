import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import type { PapelPlano } from '@prisma/client'
import { podeEditarEstrutura, podeAtualizarValor } from '@/features/plano/lib/status'

/** Usuário autenticado atual (ou null). Para uso em Server Actions/Components.
 *  Usa getUser() — revalida o JWT no Auth server (não confia só no cookie, ao contrário de getSession). */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return prisma.user.findUnique({ where: { id: user.id } })
}

/** Exige um usuário autenticado; lança se não houver sessão. */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Não autenticado')
  return user
}

/** Exige um admin autenticado; lança se não for admin. Retorna o admin (com clienteId). */
export async function requireAdmin() {
  const user = await requireUser()
  if (user.tipoUser !== 'admin') throw new Error('Acesso negado')
  return user
}

/** Garante que um recurso pertence ao mesmo tenant do usuário; lança caso contrário. */
export function assertMesmoTenant(recursoClienteId: string | null | undefined, usuarioClienteId: string) {
  if (recursoClienteId !== usuarioClienteId) throw new Error('Recurso não encontrado')
}

// ─────────────────────────────────────────────
// Enforcement de papel por plano (Story 6.5)
// + Contrato unificado tenant → papel → estado (Story 6.4/6.5, D1)
// ─────────────────────────────────────────────

/** Identidade mínima de usuário que os guards de papel consomem. */
type GuardUser = { id: string; clienteId: string; tipoUser: string }

/** Hierarquia de papel: viewer < editor < owner. */
const ORDEM_PAPEL: Record<PapelPlano, number> = { viewer: 0, editor: 1, owner: 2 }

/**
 * Resolve o papel do usuário no plano alvo.
 * `tipoUser === 'admin'` (global do tenant) = `owner` implícito (curto-circuita, sem consultar PlanoUsuario).
 * Sem linha PlanoUsuario e não-admin ⇒ `null` (default-deny). Assume que o tenant já foi validado.
 */
export async function resolverPapelPlano(planoId: string, user: GuardUser): Promise<PapelPlano | null> {
  if (user.tipoUser === 'admin') return 'owner'
  const vinculo = await prisma.planoUsuario.findUnique({
    where: { planoId_userId: { planoId, userId: user.id } },
    select: { papel: true },
  })
  return vinculo?.papel ?? null
}

/**
 * Exige um papel mínimo do usuário no plano; lança `Acesso negado` se sem papel ou abaixo do mínimo.
 * Default-deny. Assume que `assertMesmoTenant` já rodou (não refaz checagem de tenant).
 */
export async function assertPapelPlano(planoId: string, user: GuardUser, papelMinimo: PapelPlano): Promise<void> {
  const papel = await resolverPapelPlano(planoId, user)
  if (papel === null || ORDEM_PAPEL[papel] < ORDEM_PAPEL[papelMinimo]) {
    throw new Error('Acesso negado')
  }
}

/** Operações de mutação cobertas pelo contrato unificado, mapeadas para (papel mínimo × estado). */
export type OperacaoPlano =
  | 'updateKeyResultValor' // editor; edicao | publicado (não arquivado)
  | 'editarEstrutura'      // editor; somente edicao
  | 'transicao'            // owner; a máquina de estado valida o destino (lib/status)
  | 'gerirPlano'           // owner; gerir plano/membros, qualquer estado

const PAPEL_MINIMO: Record<OperacaoPlano, PapelPlano> = {
  updateKeyResultValor: 'editor',
  editarEstrutura: 'editor',
  transicao: 'owner',
  gerirPlano: 'owner',
}

/** Verifica se o estado do plano permite a operação (a regra de papel é separada). */
function estadoPermiteOperacao(status: string, operacao: OperacaoPlano): boolean {
  switch (operacao) {
    case 'editarEstrutura':
      return podeEditarEstrutura(status)
    case 'updateKeyResultValor':
      return podeAtualizarValor(status)
    // Transições não são barradas pelo estado aqui — a máquina de estado em lib/status
    // valida o destino (ex.: arquivado é terminal).
    case 'transicao':
      return true
    // Gestão de plano/membros é permitida em planejamento/ativo, mas NÃO em arquivado
    // (arquivado = somente leitura, coerente com a UI).
    case 'gerirPlano':
      return status !== 'arquivado'
  }
}

/**
 * Contrato de autorização unificado (D1). Resolve na ordem **tenant → papel → estado**:
 *  1. carrega o Plano (clienteId + status) e valida o tenant;
 *  2. checa o papel mínimo da operação (admin = owner implícito; default-deny sem vínculo);
 *  3. checa se o estado do plano permite a operação.
 * Lança erro de domínio em qualquer falha. Retorna `{ clienteId, status }` para reuso.
 */
export async function assertPodeMutarPlano(
  planoId: string,
  user: GuardUser,
  operacao: OperacaoPlano
): Promise<{ clienteId: string; status: string }> {
  const plano = await prisma.plano.findUniqueOrThrow({
    where: { id: planoId },
    select: { clienteId: true, status: true },
  })
  // 1. tenant
  assertMesmoTenant(plano.clienteId, user.clienteId)
  // 2. papel
  await assertPapelPlano(planoId, user, PAPEL_MINIMO[operacao])
  // 3. estado
  if (!estadoPermiteOperacao(plano.status, operacao)) {
    if (plano.status === 'arquivado') {
      throw new Error('Plano arquivado: somente leitura.')
    }
    if (plano.status === 'publicado') {
      throw new Error('Plano publicado: só é possível atualizar valores dos resultados-chave.')
    }
    throw new Error(`O estado atual do plano ("${plano.status}") não permite esta operação.`)
  }
  return plano
}
