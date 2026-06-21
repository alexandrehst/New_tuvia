export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getCurrentUser } from '@/features/auth/guards'
import { getPlanos } from '@/features/plano/queries'
import { PlanoCard } from '@/features/plano/components/PlanoCard'
import { Button } from '@/components/ui/button'

export default async function PlanosPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const planos = await getPlanos(user.clienteId)
  const nome = user.nome.split(' ')[0]

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bem-vindo(a), {nome}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe e gerencie os seus planos estratégicos
          </p>
        </div>
        <Button render={<Link href="/criador" />} className="gap-2">
          <Plus className="size-4" />
          Novo plano
        </Button>
      </div>

      {planos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="size-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground mb-1">Nenhum plano ainda</p>
            <p className="text-sm text-muted-foreground">Crie o primeiro plano estratégico</p>
          </div>
          <Button render={<Link href="/criador" />}>
            Criar primeiro plano
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {planos.map((plano) => (
            <PlanoCard key={plano.id} plano={plano} />
          ))}
        </div>
      )}
    </div>
  )
}
