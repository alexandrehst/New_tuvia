export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPlanoWithObjetivos } from '@/features/plano/queries'
import { PlanoTree } from '@/features/plano/components/PlanoTree'

export default async function PlanoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const plano = await getPlanoWithObjetivos(id)
  if (!plano) notFound()

  const dataFim = plano.dataFim
    ? new Date(plano.dataFim).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  const objetivosCount = plano.objetivos?.length ?? 0

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
        <Link href="/planos" className="hover:underline">Todos os planos</Link>
        <span>/</span>
        <span style={{ color: 'var(--text-secondary)' }}>{plano.titulo}</span>
      </div>

      {/* Title row */}
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{plano.titulo}</h1>
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50"
          style={{ borderColor: 'var(--teal)', color: 'var(--teal)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editar plano
        </button>
      </div>

      {dataFim && (
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Finaliza em {dataFim}
        </p>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-6 mb-6" style={{ borderBottom: '2px solid var(--border)' }}>
        <button
          className="pb-3 text-sm font-semibold flex items-center gap-1.5"
          style={{ borderBottom: '2px solid var(--teal)', color: 'var(--teal)', marginBottom: '-2px' }}
        >
          OKRs
          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--teal)', color: 'white' }}>
            {objetivosCount}
          </span>
        </button>
        <button className="pb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Membros
        </button>
        <button className="pb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          APIs
        </button>
      </div>

      {/* Nova OKR button */}
      <div className="mb-6">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--teal)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Nova OKR
        </button>
      </div>

      {/* OKR Tree */}
      {objetivosCount === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">Nenhum objetivo ainda. Clique em &quot;Nova OKR&quot; para começar.</p>
        </div>
      ) : (
        <PlanoTree planos={[plano]} initialExpanded={id} />
      )}
    </div>
  )
}
