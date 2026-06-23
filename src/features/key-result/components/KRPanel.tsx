"use client"

import { useState, useTransition } from "react"

import { updateKeyResultValor } from "@/features/key-result/actions"
import type { StatusRisco } from "@/features/key-result/lib/calculos"
import { StatusPill } from "@/components/status-pill"
import { KRProgress } from "@/components/kr-progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

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
  const [valor, setValor] = useState("")
  const [comentario, setComentario] = useState("")
  const [error, setError] = useState("")
  const [currentKR, setCurrentKR] = useState(kr)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(valor)
    if (Number.isNaN(num)) {
      setError("Valor inválido")
      return
    }
    setError("")

    startTransition(async () => {
      try {
        const result = await updateKeyResultValor({
          krId: kr.id,
          valor: num,
          comentario: comentario || undefined,
        })
        if (result.ok) {
          const updated = { ...currentKR, valorAtual: num, progresso: result.progresso, status: result.status }
          setCurrentKR(updated)
          onUpdate(updated) // reflexo otimista no card + aria-live (ObjetivosBoard)
          setValor("")
          setComentario("")
          onClose() // fecha o Sheet em caso de sucesso
        } else {
          setError("Erro ao salvar. Tente novamente.")
        }
      } catch {
        // valor preservado no estado para nova tentativa
        setError("Erro ao salvar. Tente novamente.")
      }
    })
  }

  const pct = Math.round(Math.min(100, Math.max(0, currentKR.progresso)))

  return (
    <div data-testid="kr-panel" className="flex flex-col gap-4">
      {/* Estado atual */}
      <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
        <span className="text-lg font-bold tabular-nums text-foreground">{pct}%</span>
        <KRProgress value={currentKR.progresso} className="flex-1" />
        <StatusPill status={currentKR.status as StatusRisco} />
      </div>

      {error && (
        <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`valor-${kr.id}`}>
            Novo valor{currentKR.unidade ? ` (${currentKR.unidade})` : ""}
          </Label>
          <Input
            id={`valor-${kr.id}`}
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={String(currentKR.valorAtual)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`comentario-${kr.id}`}>Comentário</Label>
          <Input
            id={`comentario-${kr.id}`}
            type="text"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Opcional…"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  )
}
