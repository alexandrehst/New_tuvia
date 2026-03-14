'use client'

import { useState } from 'react'
import { KRPanel } from '@/features/key-result/components/KRPanel'

type KRPanelData = {
  id: string
  descricao: string
  valorAtual: number
  progresso: number
  status: string
  unidade: string | null
}

type LinhaTendencia = {
  id: string
  data: Date
  valor: number
}

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
  linhaTendencia?: LinhaTendencia[]
}

type Objetivo = {
  id: string
  titulo: string
  numero: number
  progresso: number
  resultadosChave: ResultadoChave[]
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
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleObjetivo = (id: string) => {
    setExpandedObjetivos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderPlano = (plano: PlanoData) => {
    const isExpanded = expandedPlanos.has(plano.id)
    const objetivos = plano.objetivos ?? []

    return (
      <div key={plano.id} className="border rounded-lg mb-3 bg-white shadow-sm">
        <div
          data-testid="plano-row"
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => togglePlano(plano.id)}
        >
          <div className="flex items-center gap-3">
            <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
            <span className="font-medium text-gray-900">{plano.titulo}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {plano._count?.objetivos ?? objetivos.length} objetivos
            </span>
            <span className="text-xs rounded-full px-2 py-0.5 bg-blue-100 text-blue-700">
              {plano.status}
            </span>
          </div>
        </div>

        {isExpanded && objetivos.length > 0 && (
          <div className="border-t px-4 pb-4 pt-2">
            {objetivos.map((objetivo) => renderObjetivo(objetivo))}
          </div>
        )}
      </div>
    )
  }

  const renderObjetivo = (objetivo: Objetivo) => {
    const isExpanded = expandedObjetivos.has(objetivo.id)

    return (
      <div key={objetivo.id} className="ml-4 mt-2">
        <div
          data-testid="objetivo-row"
          className="flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-gray-50 border border-gray-100"
          onClick={() => toggleObjetivo(objetivo.id)}
        >
          <div className="flex items-center gap-3">
            <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
            <span className="text-sm font-medium text-gray-800">
              O{objetivo.numero} — {objetivo.titulo}
            </span>
          </div>
          <span className="text-sm text-gray-600">{Math.round(objetivo.progresso)}%</span>
        </div>

        {isExpanded && objetivo.resultadosChave.length > 0 && (
          <div className="ml-6 mt-1 space-y-1">
            {objetivo.resultadosChave.map((kr) => renderKR(kr))}
          </div>
        )}
      </div>
    )
  }

  const renderKR = (kr: ResultadoChave) => {
    const isOpen = openKR?.id === kr.id

    return (
      <div key={kr.id}>
        <div
          data-testid="kr-row"
          className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-blue-50 border border-gray-100"
          onClick={() => setOpenKR(isOpen ? null : { id: kr.id, descricao: kr.descricao, valorAtual: kr.valorAtual, progresso: kr.progresso, status: kr.status, unidade: kr.unidade })}
        >
          <span className="text-sm text-gray-700">{kr.descricao}</span>
          <div className="flex items-center gap-2">
            <span data-testid="kr-progresso" className="text-sm font-medium text-blue-700">
              {Math.round(kr.progresso)}%
            </span>
            <span
              data-testid="status-risco"
              className={`text-xs rounded-full px-2 py-0.5 ${statusColor(kr.status)}`}
            >
              {statusLabel(kr.status)}
            </span>
          </div>
        </div>

        {isOpen && openKR && (
          <KRPanel
            kr={openKR}
            onClose={() => setOpenKR(null)}
            onUpdate={(updated) => {
              setOpenKR(updated)
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div>
      {planos.map(renderPlano)}
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

function statusColor(status: string) {
  const colors: Record<string, string> = {
    no_prazo: 'bg-green-100 text-green-700',
    em_atraso: 'bg-yellow-100 text-yellow-700',
    em_risco: 'bg-orange-100 text-orange-700',
    risco_alto: 'bg-red-100 text-red-700',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-700'
}
