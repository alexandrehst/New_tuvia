export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/features/auth/guards'
import { CriadorWizard } from '@/features/criador-plano/components/CriadorWizard'

export default async function CriadorPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-foreground">Criar Plano Estratégico</h1>
      <CriadorWizard />
    </div>
  )
}
