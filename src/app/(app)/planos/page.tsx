export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { getPlanos } from '@/features/plano/queries'
import { PlanoTree } from '@/features/plano/components/PlanoTree'

export default async function PlanosPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')

  const planos = await getPlanos(user.clienteId)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Planos</h1>
      {planos.length === 0 ? (
        <p className="text-gray-500">Nenhum plano encontrado.</p>
      ) : (
        <PlanoTree planos={planos} />
      )}
    </div>
  )
}
