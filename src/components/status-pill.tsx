import type { StatusRisco } from "@/features/key-result/lib/calculos"
import { statusLabel, statusPillClasses } from "@/features/key-result/lib/status"
import { cn } from "@/lib/utils"

/**
 * Pílula de status de risco de KR. Componente apresentacional (dumb):
 * recebe o StatusRisco e renderiza SEMPRE rótulo textual + cor (a11y — nunca só cor).
 * Cores/rótulos vêm da fonte única em features/key-result/lib/status.
 */
function StatusPill({
  status,
  className,
}: {
  status: StatusRisco
  className?: string
}) {
  return (
    <span
      data-slot="status-pill"
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        statusPillClasses(status),
        className
      )}
    >
      {statusLabel(status)}
    </span>
  )
}

export { StatusPill }
