export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { getMembros } from '@/features/usuarios/queries'
import { MembrosList } from '@/features/usuarios/components/MembrosList'
import { ConvidarMembroButton } from '@/features/usuarios/components/ConvidarMembroButton'

export default async function UsuariosPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')

  const membros = await getMembros(user.clienteId)

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Membros do workspace, papéis por plano e preferências de notificação
          </p>
        </div>
        <ConvidarMembroButton />
      </div>

      <MembrosList membros={membros} />
    </div>
  )
}
