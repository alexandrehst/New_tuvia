export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { getPlanos } from '@/features/plano/queries'
import { PlanoCard } from '@/features/plano/components/PlanoCard'

export default async function PlanosPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')

  const planos = await getPlanos(user.clienteId)
  const nome = user.nome.split(' ')[0]

  return (
    <div className="p-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Bem vindo(a), {nome}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Acompanhe e gerencie os seus planos estratégicos
        </p>
      </div>

      {planos.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-32">
          <div className="mb-6">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" fill="#dbeafe" opacity="0.6"/>
              <circle cx="40" cy="40" r="24" fill="#bfdbfe" opacity="0.8"/>
              <circle cx="40" cy="40" r="14" fill="#93c5fd" opacity="0.9"/>
              <circle cx="40" cy="40" r="7" fill="white" opacity="0.9"/>
              <circle cx="40" cy="40" r="3" fill="#2b6478"/>
              <circle cx="26" cy="30" r="4" fill="#93c5fd" opacity="0.7"/>
              <circle cx="54" cy="28" r="3" fill="#bfdbfe" opacity="0.7"/>
              <circle cx="58" cy="52" r="5" fill="#dbeafe" opacity="0.6"/>
            </svg>
          </div>
          <p className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Ainda sem planos
          </p>
          <Link
            href="/criador"
            style={{ background: 'var(--teal)', color: 'white' }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Criar primeiro plano
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
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
