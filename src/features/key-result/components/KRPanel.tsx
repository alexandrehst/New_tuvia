'use client'

import { useState, useTransition } from 'react'
import { updateKeyResultValor } from '@/features/key-result/actions'

type KRData = {
  id: string
  descricao: string
  valorAtual: number
  progresso: number
  status: string
  unidade: string | null
}

interface KRPanelProps {
  kr: KRData
  onClose: () => void
  onUpdate: (updated: KRData) => void
}

export function KRPanel({ kr, onClose, onUpdate }: KRPanelProps) {
  const [valor, setValor] = useState('')
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [currentKR, setCurrentKR] = useState(kr)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(valor)
    if (isNaN(num)) { setError('Valor inválido'); return }
    setError('')

    startTransition(async () => {
      try {
        const result = await updateKeyResultValor({ krId: kr.id, valor: num, comentario: comentario || undefined })
        if (result.ok) {
          const updated = { ...currentKR, valorAtual: num, progresso: result.progresso, status: result.status }
          setCurrentKR(updated)
          onUpdate(updated)
          setValor('')
          setComentario('')
          setShowToast(true)
          setTimeout(() => setShowToast(false), 3000)
        }
      } catch {
        setError('Erro ao salvar. Tente novamente.')
      }
    })
  }

  return (
    <div data-testid="kr-panel" className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>Atualizar resultado chave</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{currentKR.descricao}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-200 transition-colors" style={{ color: 'var(--text-muted)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Current stats */}
      <div className="flex items-center gap-4 mb-4 p-3 rounded-lg" style={{ background: '#f9fafb', border: '1px solid var(--border)' }}>
        <div className="text-center">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Progresso</p>
          <p data-testid="kr-progresso" className="text-base font-bold" style={{ color: 'var(--teal)' }}>
            {Math.round(currentKR.progresso)}%
          </p>
        </div>
        <div className="flex-1">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${Math.min(currentKR.progresso, 100)}%` }} />
          </div>
        </div>
        <span
          data-testid="status-risco"
          className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
          style={statusStyle(currentKR.status)}
        >
          {statusLabel(currentKR.status)}
        </span>
      </div>

      {showToast && (
        <div data-testid="toast-sucesso" className="mb-3 rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{ background: '#d1fae5', color: '#065f46' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          Valor atualizado com sucesso!
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-lg px-4 py-2.5 text-sm" style={{ background: '#fef2f2', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor={`valor-${kr.id}`} className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Novo valor{currentKR.unidade ? ` (${currentKR.unidade})` : ''}
          </label>
          <input
            id={`valor-${kr.id}`}
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={String(currentKR.valorAtual)}
            className="w-full px-3 py-2 text-sm rounded-lg outline-none"
            style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex-1">
          <label htmlFor={`comentario-${kr.id}`} className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Comentário
          </label>
          <input
            id={`comentario-${kr.id}`}
            type="text"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Adicione um comentário..."
            className="w-full px-3 py-2 text-sm rounded-lg outline-none"
            style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 shrink-0"
          style={{ background: 'var(--teal)' }}
        >
          {isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    no_prazo: 'No prazo', em_atraso: 'Em atraso', em_risco: 'Em risco', risco_alto: 'Risco alto',
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
