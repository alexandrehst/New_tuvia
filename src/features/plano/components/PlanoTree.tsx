'use client'

import { useState } from 'react'
import { KRPanel } from '@/features/key-result/components/KRPanel'

type ResultadoChave = {
  id: string
  descricao: string
  tipoMetrica: string
  valorInicial: number
  valorAlvo: number
  valorAtual: number
  unidade: string | null
  peso: number
  progresso: number
  status: string
}

type KRPanelData = {
  id: string
  descricao: string
  valorAtual: number
  progresso: number
  status: string
  unidade: string | null
}

type Objetivo = {
  id: string
  titulo: string
  numero: number
  progresso: number
  resultadosChave: ResultadoChave[]
  responsaveis?: { user: { nome: string } }[]
}

type PlanoData = {
  id: string
  titulo: string
  status: string
  _count?: { objetivos: number }
  objetivos?: Objetivo[]
  planosFilhos?: PlanoData[]
}

interface PlanoTreeProps {
  planos: PlanoData[]
  initialExpanded?: string
}

export function PlanoTree({ planos, initialExpanded }: PlanoTreeProps) {
  const [expandedPlanos, setExpandedPlanos] = useState<Set<string>>(
    initialExpanded ? new Set([initialExpanded]) : new Set()
  )
  const [expandedObjetivos, setExpandedObjetivos] = useState<Set<string>>(new Set())
  const [openKR, setOpenKR] = useState<KRPanelData | null>(null)

  const togglePlano = (id: string) => {
    setExpandedPlanos((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleObjetivo = (id: string) => {
    setExpandedObjetivos((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-3">
      {planos.map((plano) => renderPlano(plano, expandedPlanos, togglePlano, expandedObjetivos, toggleObjetivo, openKR, setOpenKR))}
    </div>
  )
}

function renderPlano(
  plano: PlanoData,
  expandedPlanos: Set<string>,
  togglePlano: (id: string) => void,
  expandedObjetivos: Set<string>,
  toggleObjetivo: (id: string) => void,
  openKR: KRPanelData | null,
  setOpenKR: (kr: KRPanelData | null) => void
) {
  const isExpanded = expandedPlanos.has(plano.id)
  const objetivos = plano.objetivos ?? []

  return (
    <div key={plano.id} className="space-y-3">
      {objetivos.map((objetivo) =>
        renderObjetivo(objetivo, expandedObjetivos, toggleObjetivo, openKR, setOpenKR)
      )}
    </div>
  )
}

function CircleProgress({ value }: { value: number }) {
  const r = 16
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(value, 100) / 100) * circ

  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <circle
          cx="24" cy="24" r={r}
          fill="none"
          stroke="var(--teal)"
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
        {Math.round(value)}%
      </span>
    </div>
  )
}

function renderObjetivo(
  objetivo: Objetivo,
  expandedObjetivos: Set<string>,
  toggleObjetivo: (id: string) => void,
  openKR: KRPanelData | null,
  setOpenKR: (kr: KRPanelData | null) => void
) {
  const isExpanded = expandedObjetivos.has(objetivo.id)

  return (
    <div
      key={objetivo.id}
      data-testid="objetivo-row"
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Objective header */}
      <div
        className="flex items-start gap-4 p-5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => toggleObjetivo(objetivo.id)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Objetivo #{objetivo.numero} — {objetivo.titulo}
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span>Responsáveis</span>
            {objetivo.responsaveis && objetivo.responsaveis.length > 0 && (
              <div className="flex -space-x-1">
                {objetivo.responsaveis.slice(0, 3).map((r, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-white text-xs font-medium"
                    style={{ background: ['#3b82f6', '#8b5cf6', '#ec4899'][i % 3] }}
                  >
                    {r.user.nome[0]}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <CircleProgress value={objetivo.progresso} />
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-gray-50"
            style={{ borderColor: 'var(--teal)', color: 'var(--teal)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar OKR
          </button>
        </div>
      </div>

      {/* KRs */}
      {isExpanded && objetivo.resultadosChave.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <div className="px-5 py-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Resultado chave
            </span>
          </div>
          {objetivo.resultadosChave.map((kr, idx) => (
            <div key={kr.id}>
              <div
                data-testid="kr-row"
                className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderTop: idx > 0 ? '1px solid var(--border)' : undefined }}
                onClick={() => setOpenKR(
                  openKR?.id === kr.id ? null :
                  { id: kr.id, descricao: kr.descricao, valorAtual: kr.valorAtual, progresso: kr.progresso, status: kr.status, unidade: kr.unidade }
                )}
              >
                {/* Avatar placeholder */}
                <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-medium"
                  style={{ background: 'var(--teal)' }}>
                  {kr.descricao[0]?.toUpperCase()}
                </div>

                {/* Description */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{kr.descricao}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Peso {kr.peso}</p>
                </div>

                {/* Progress bar */}
                <div className="w-32 shrink-0">
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${Math.min(kr.progresso, 100)}%` }} />
                  </div>
                </div>

                {/* Values & status */}
                <div className="text-right shrink-0 w-24">
                  <div data-testid="kr-progresso" className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {Math.round(kr.progresso)}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {kr.valorAtual}/{kr.valorAlvo}{kr.unidade ? ` ${kr.unidade}` : ''}
                  </div>
                </div>

                {/* Status badge */}
                <div className="shrink-0">
                  <span
                    data-testid="status-risco"
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={statusStyle(kr.status)}
                  >
                    {statusLabel(kr.status)}
                  </span>
                </div>

                {/* 3-dot menu */}
                <button className="shrink-0 p-1 rounded hover:bg-gray-100" onClick={(e) => e.stopPropagation()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-muted)' }}>
                    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                  </svg>
                </button>
              </div>

              {/* KR Panel */}
              {openKR?.id === kr.id && (
                <div style={{ borderTop: '1px solid var(--border)', background: '#f9fafb' }}>
                  <KRPanel
                    kr={openKR}
                    onClose={() => setOpenKR(null)}
                    onUpdate={(updated) => setOpenKR(updated)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    no_prazo: 'No prazo',
    em_atraso: 'Em atraso',
    em_risco: 'Em risco',
    risco_alto: 'Risco alto',
  }
  return labels[status] ?? status
}

function statusStyle(status: string): React.CSSProperties {
  const styles: Record<string, React.CSSProperties> = {
    no_prazo: { background: '#d1fae5', color: '#065f46' },
    em_atraso: { background: '#fef3c7', color: '#92400e' },
    em_risco: { background: '#ffedd5', color: '#9a3412' },
    risco_alto: { background: '#fee2e2', color: '#991b1b' },
  }
  return styles[status] ?? { background: '#f3f4f6', color: '#6b7280' }
}
