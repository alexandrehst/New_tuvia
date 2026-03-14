'use client'

import { useState, useTransition } from 'react'
import { updateKeyResultValor } from '@/features/key-result/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    if (isNaN(num)) {
      setError('Valor inválido')
      return
    }

    startTransition(async () => {
      try {
        const result = await updateKeyResultValor({
          krId: kr.id,
          valor: num,
          comentario: comentario || undefined,
        })

        if (result.ok) {
          const updated = {
            ...currentKR,
            valorAtual: num,
            progresso: result.progresso,
            status: result.status,
          }
          setCurrentKR(updated)
          onUpdate(updated)
          setShowToast(true)
          setValor('')
          setComentario('')
          setTimeout(() => setShowToast(false), 3000)
        }
      } catch {
        setError('Erro ao salvar. Tente novamente.')
      }
    })
  }

  return (
    <div data-testid="kr-panel" className="ml-4 mt-2 p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">{currentKR.descricao}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Valor atual: </span>
          <span className="font-medium">{currentKR.valorAtual}{currentKR.unidade ? ` ${currentKR.unidade}` : ''}</span>
        </div>
        <div>
          <span className="text-gray-500">Progresso: </span>
          <span data-testid="kr-progresso" className="font-medium text-blue-700">{Math.round(currentKR.progresso)}%</span>
        </div>
        <span
          data-testid="status-risco"
          className={`text-xs rounded-full px-2 py-0.5 ${statusColor(currentKR.status)}`}
        >
          {statusLabel(currentKR.status)}
        </span>
      </div>

      {showToast && (
        <div data-testid="toast-sucesso" className="mb-3 rounded-md bg-green-50 p-3 text-sm text-green-700">
          Valor atualizado com sucesso!
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor={`valor-${kr.id}`}>Novo valor</Label>
          <Input
            id={`valor-${kr.id}`}
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={String(currentKR.valorAtual)}
          />
        </div>

        <div>
          <Label htmlFor={`comentario-${kr.id}`}>Comentário</Label>
          <Input
            id={`comentario-${kr.id}`}
            type="text"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Adicione um comentário..."
          />
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
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
