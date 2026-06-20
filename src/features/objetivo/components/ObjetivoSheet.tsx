"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { createObjetivo, updateObjetivo } from "@/features/objetivo/actions"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export type ObjetivoUsuario = { id: string; nome: string; email: string }
export type ObjetivoInitial = {
  id: string
  titulo: string
  descricao?: string | null
  numero: number
  responsaveisIds: string[]
}

interface ObjetivoSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "criar" | "editar"
  planoId: string
  usuarios: ObjetivoUsuario[]
  initial?: ObjetivoInitial
  proximoNumero?: number
}

export function ObjetivoSheet({
  open,
  onOpenChange,
  mode,
  planoId,
  usuarios,
  initial,
  proximoNumero,
}: ObjetivoSheetProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [titulo, setTitulo] = useState(initial?.titulo ?? "")
  const [descricao, setDescricao] = useState(initial?.descricao ?? "")
  const [responsaveis, setResponsaveis] = useState<Set<string>>(
    new Set(initial?.responsaveisIds ?? [])
  )

  const toggle = (id: string) =>
    setResponsaveis((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (titulo.trim().length < 3) {
      setError("Título deve ter no mínimo 3 caracteres")
      return
    }
    setError("")

    startTransition(async () => {
      try {
        const base = {
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          numero: initial?.numero ?? proximoNumero ?? 1,
          responsaveisIds: Array.from(responsaveis),
        }
        if (mode === "editar" && initial) {
          await updateObjetivo(initial.id, base) // updateObjetivoSchema não inclui planoId
        } else {
          await createObjetivo({ planoId, ...base })
        }
        router.refresh()
        onOpenChange(false)
      } catch {
        setError("Erro ao salvar. Tente novamente.")
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{mode === "editar" ? "Editar objetivo" : "Novo objetivo"}</SheetTitle>
          <SheetDescription>
            {mode === "editar"
              ? "Atualize o objetivo e seus responsáveis."
              : "Defina um novo objetivo do plano."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-4">
          {error && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="obj-titulo">Título</Label>
            <Input id="obj-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="obj-descricao">Descrição</Label>
            <Input
              id="obj-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Opcional…"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Responsáveis</Label>
            <div className="flex max-h-48 flex-col gap-1.5 overflow-auto rounded-md border border-border p-2">
              {usuarios.length === 0 && (
                <span className="text-xs text-muted-foreground">Nenhum usuário no workspace.</span>
              )}
              {usuarios.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={responsaveis.has(u.id)}
                    onChange={() => toggle(u.id)}
                  />
                  <span className="text-foreground">{u.nome}</span>
                  <span className="text-xs text-muted-foreground">{u.email}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
