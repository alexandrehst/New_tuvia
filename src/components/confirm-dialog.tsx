"use client"

import { useTransition } from "react"
import { AlertDialog } from "@base-ui/react/alert-dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      await onConfirm()
      onOpenChange(false)
    })
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <AlertDialog.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2",
            "flex flex-col gap-3 rounded-lg border border-border bg-popover p-5 text-popover-foreground shadow-lg",
            "transition data-ending-style:opacity-0 data-starting-style:opacity-0"
          )}
        >
          <AlertDialog.Title className="text-base font-semibold">{title}</AlertDialog.Title>
          {description && (
            <AlertDialog.Description className="text-sm text-muted-foreground">
              {description}
            </AlertDialog.Description>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <AlertDialog.Close render={<Button variant="ghost" disabled={isPending} />}>
              {cancelLabel}
            </AlertDialog.Close>
            <Button
              variant={destructive ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? "…" : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
