export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getPlanoWithObjetivos } from '@/features/plano/queries'
import { PlanoTree } from '@/features/plano/components/PlanoTree'

export default async function PlanoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const plano = await getPlanoWithObjetivos(id)

  if (!plano) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{plano.titulo}</h1>
      <PlanoTree planos={[plano]} initialExpanded={id} />
    </div>
  )
}
