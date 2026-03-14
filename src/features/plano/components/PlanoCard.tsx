import Link from 'next/link'

type PlanoCardProps = {
  plano: {
    id: string
    titulo: string
    status: string
    dataFim?: Date | null
    _count?: { objetivos: number }
  }
}

export function PlanoCard({ plano }: PlanoCardProps) {
  const statusColor = {
    edicao: { bg: '#fef3c7', text: '#92400e', label: 'Edição' },
    publicado: { bg: '#d1fae5', text: '#065f46', label: 'Publicado' },
    arquivado: { bg: '#f3f4f6', text: '#6b7280', label: 'Arquivado' },
  }[plano.status] ?? { bg: '#f3f4f6', text: '#6b7280', label: plano.status }

  const dataFimFormatted = plano.dataFim
    ? new Date(plano.dataFim).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  return (
    <Link href={`/planos/${plano.id}`}>
      <div
        className="rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start justify-between mb-3">
          <div
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: statusColor.bg, color: statusColor.text }}
          >
            {statusColor.label}
          </div>
          {/* Progress circle placeholder */}
          <div className="relative w-10 h-10">
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" fill="none" stroke="#e5e7eb" strokeWidth="3"/>
              <circle
                cx="20" cy="20" r="16"
                fill="none"
                stroke="var(--teal)"
                strokeWidth="3"
                strokeDasharray="100.5"
                strokeDashoffset="100.5"
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              0%
            </span>
          </div>
        </div>

        <h3 className="font-semibold text-sm leading-snug mb-2" style={{ color: 'var(--text-primary)' }}>
          {plano.titulo}
        </h3>

        {dataFimFormatted && (
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Finaliza em {dataFimFormatted}
          </p>
        )}

        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                style={{ background: ['#3b82f6', '#8b5cf6', '#ec4899'][i - 1] }}
              />
            ))}
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {plano._count?.objetivos ?? 0} objetivos
          </span>
        </div>
      </div>
    </Link>
  )
}
