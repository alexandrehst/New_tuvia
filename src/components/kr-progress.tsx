"use client"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Barra de progresso de KR. Trilha `muted`, preenchimento `primary`.
 * A 100% recebe o tratamento "concluído" (preenchimento verde `status-no-prazo` + check),
 * distinto da pílula de risco (StatusPill).
 */
function KRProgress({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const v = Math.min(100, Math.max(0, Math.round(value)))
  const done = v >= 100

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ProgressPrimitive.Root value={v} className="flex-1">
        <ProgressPrimitive.Track className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <ProgressPrimitive.Indicator
            className={cn(
              "h-full rounded-full transition-all",
              done ? "bg-status-no-prazo" : "bg-primary"
            )}
          />
        </ProgressPrimitive.Track>
      </ProgressPrimitive.Root>
      {done && (
        <Check
          aria-hidden
          className="size-4 shrink-0 text-status-no-prazo"
        />
      )}
    </div>
  )
}

export { KRProgress }
