export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { CriadorWizard } from '@/features/criador-plano/components/CriadorWizard'

export default async function CriadorPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Criar Plano Estratégico</h1>
      <CriadorWizard clienteId={user.clienteId} />
    </div>
  )
}
