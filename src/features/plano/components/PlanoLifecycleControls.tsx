"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Play, Archive, Pencil } from "lucide-react"

import { ativarPlano, arquivarPlano, reabrirPlano } from "@/features/plano/actions"
import { planoStatusLabel, planoStatusBadgeClasses, type StatusPlano } from "@/features/plano/lib/status"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { cn } from "@/lib/utils"

/**
 * Controles do ciclo de vida do Plano (Story 6.4). Reflete o estado atual e expõe as
 * transições válidas conforme a máquina de estado:
 *   - Em planejamento (edicao): Ativar, Arquivar
 *   - Ativo (publicado):        Editar (reabre p/ planejamento, com confirmação), Arquivar
 *   - Arquivado (arquivado):    terminal — só o selo de estado
 * As actions já impõem papel (owner) e a validade da transição no backend.
 */
export function PlanoLifecycleControls({ planoId, status }: { planoId: string; status: StatusPlano }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [confirm, setConfirm] = useState<null | "arquivar" | "reabrir">(null)
  const [error, setError] = useState("")

  // Estado único de "ocupado": vale para o caminho direto (Ativar) e os de confirmação
  // (reabrir/arquivar), de modo que TODOS os botões desabilitem durante a transição.
  const run = (action: (id: string) => Promise<unknown>) => async () => {
    setIsPending(true)
    setError("")
    try {
      await action(planoId)
      router.refresh()
    } catch {
      setError("Não foi possível alterar o estado do plano.")
    } finally {
      setIsPending(false)
    }
  }

  const ativar = run(ativarPlano)

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn("rounded-full px-2.5 py-1 text-xs font-medium", planoStatusBadgeClasses(status))}
        aria-label={`Estado do plano: ${planoStatusLabel(status)}`}
      >
        {planoStatusLabel(status)}
      </span>

      {status === "edicao" && (
        <Button size="sm" className="gap-1.5" disabled={isPending} onClick={ativar}>
          <Play className="size-4" /> Ativar
        </Button>
      )}

      {status === "publicado" && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={isPending}
          onClick={() => setConfirm("reabrir")}
        >
          <Pencil className="size-4" /> Editar
        </Button>
      )}

      {status !== "arquivado" && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          disabled={isPending}
          onClick={() => setConfirm("arquivar")}
        >
          <Archive className="size-4" /> Arquivar
        </Button>
      )}

      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}

      <ConfirmDialog
        open={confirm === "reabrir"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Reabrir o plano para edição?"
        description="Editar um plano Ativo o reabre para Em planejamento — ele deixa de estar ativo até você ativá-lo de novo."
        confirmLabel="Editar e reabrir"
        onConfirm={run(reabrirPlano)}
      />

      <ConfirmDialog
        open={confirm === "arquivar"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Arquivar este plano?"
        description="Um plano arquivado fica somente leitura e não pode ser reaberto por ora."
        confirmLabel="Arquivar"
        destructive
        onConfirm={run(arquivarPlano)}
      />
    </div>
  )
}
