"use client"

import { Pencil, LineChart, PencilLine, Trash2 } from "lucide-react"

import type { StatusRisco } from "@/features/key-result/lib/calculos"
import { tempoRelativo } from "@/features/key-result/lib/tempo"
import { StatusPill } from "@/components/status-pill"
import { KRProgress } from "@/components/kr-progress"
import { Button } from "@/components/ui/button"

export type KRCardData = {
  id: string
  descricao: string
  valorAtual: number
  valorAlvo: number
  unidade: string | null
  peso: number
  progresso: number
  status: string
  updatedAt?: Date | string
}

function KRCard({
  kr,
  onAtualizar,
  onEditar,
  onHistorico,
  onExcluir,
}: {
  kr: KRCardData
  onAtualizar?: () => void
  onEditar?: () => void
  onHistorico?: () => void
  onExcluir?: () => void
}) {
  const pct = Math.round(Math.min(100, Math.max(0, kr.progresso)))

  return (
    <div
      data-testid="kr-card"
      className="group/kr rounded-md border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {kr.updatedAt ? `Atualizado ${tempoRelativo(kr.updatedAt)}` : null}
        </span>
        <StatusPill status={kr.status as StatusRisco} />
      </div>

      <p className="mt-2 text-sm text-foreground">{kr.descricao}</p>

      <KRProgress value={kr.progresso} className="mt-3" />

      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-lg font-bold tracking-tight tabular-nums text-foreground">{pct}%</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {kr.valorAtual}
          <span className="text-muted-foreground/60">/{kr.valorAlvo}</span>
          {kr.unidade ? ` ${kr.unidade}` : ""}
        </span>
      </div>

      {/* Ações — reveladas no hover (desktop) e no foco (teclado/touch). Painéis reais: Stories 2.3-2.5 */}
      <div className="mt-3 flex gap-1 opacity-0 transition-opacity group-hover/kr:opacity-100 focus-within:opacity-100">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onAtualizar} disabled={!onAtualizar}>
          <PencilLine className="size-3.5" /> Atualizar
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Editar resultado-chave" onClick={onEditar} disabled={!onEditar}>
          <Pencil className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Ver histórico" onClick={onHistorico} disabled={!onHistorico}>
          <LineChart className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Excluir resultado-chave" onClick={onExcluir} disabled={!onExcluir}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

export { KRCard }
