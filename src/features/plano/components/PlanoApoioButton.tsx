"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { GitBranch } from "lucide-react"

import { createPlanoDepartamento } from "@/features/plano/actions"
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

function toInputDate(d: Date | string | null): string {
  if (!d) return ""
  const date = d instanceof Date ? d : new Date(d)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
}

interface PlanoApoioButtonProps {
  planoPaiId: string
  dataInicio: Date | string | null
  dataFim: Date | string | null
}

export function PlanoApoioButton({ planoPaiId, dataInicio, dataFim }: PlanoApoioButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [titulo, setTitulo] = useState("")
  const [inicio, setInicio] = useState(toInputDate(dataInicio))
  const [fim, setFim] = useState(toInputDate(dataFim))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (titulo.trim().length < 3) {
      setError("Título deve ter no mínimo 3 caracteres")
      return
    }
    if (!inicio || !fim) {
      setError("Informe as datas de início e fim")
      return
    }
    setError("")
    startTransition(async () => {
      try {
        const { planoId } = await createPlanoDepartamento({
          titulo: titulo.trim(),
          planoPaiId,
          dataInicio: new Date(inicio),
          dataFim: new Date(fim),
        })
        router.push(`/planos/${planoId}`)
      } catch {
        setError("Erro ao criar o plano de apoio. Tente novamente.")
      }
    })
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <GitBranch className="size-4" /> Criar plano de apoio
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Novo plano de apoio</SheetTitle>
            <SheetDescription>Um plano departamental vinculado a este plano corporativo.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-4">
            {error && (
              <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="apoio-titulo">Título</Label>
              <Input id="apoio-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Plano de Marketing" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="apoio-inicio">Início</Label>
                <Input id="apoio-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="apoio-fim">Fim</Label>
                <Input id="apoio-fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Criando…" : "Criar plano de apoio"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
