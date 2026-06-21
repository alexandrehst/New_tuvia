import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

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
