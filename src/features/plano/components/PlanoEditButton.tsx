"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Settings2 } from "lucide-react"

import { updatePlano } from "@/features/plano/actions"
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

type Frequencia = "semanal" | "quinzenal" | "mensal"

const FREQUENCIAS: { value: Frequencia; label: string }[] = [
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
]

function toInputDate(d: Date | string | null): string {
  if (!d) return ""
  const date = d instanceof Date ? d : new Date(d)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
}

interface PlanoEditButtonProps {
  plano: {
    id: string
    titulo: string
    dataInicio: Date | string | null
    dataFim: Date | string | null
    frequenciaAtualizacao: string
  }
}

export function PlanoEditButton({ plano }: PlanoEditButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [titulo, setTitulo] = useState(plano.titulo)
  const [dataInicio, setDataInicio] = useState(toInputDate(plano.dataInicio))
  const [dataFim, setDataFim] = useState(toInputDate(plano.dataFim))
  const [frequencia, setFrequencia] = useState<Frequencia>(
    (plano.frequenciaAtualizacao as Frequencia) ?? "mensal"
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (titulo.trim().length < 3) {
      setError("Título deve ter no mínimo 3 caracteres")
      return
    }
    setError("")
    startTransition(async () => {
      try {
        await updatePlano(plano.id, {
          titulo: titulo.trim(),
          dataInicio: dataInicio ? new Date(dataInicio) : undefined,
          dataFim: dataFim ? new Date(dataFim) : undefined,
          frequenciaAtualizacao: frequencia,
        })
        router.refresh()
        setOpen(false)
      } catch {
        setError("Erro ao salvar. Tente novamente.")
      }
    })
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Settings2 className="size-4" /> Editar plano
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Editar plano</SheetTitle>
            <SheetDescription>Ajuste o título, o intervalo e a frequência de atualização.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-4">
            {error && (
              <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="plano-titulo">Título</Label>
              <Input id="plano-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="plano-inicio">Início</Label>
                <Input id="plano-inicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="plano-fim">Fim</Label>
                <Input id="plano-fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="plano-frequencia">Frequência de atualização</Label>
              <select
                id="plano-frequencia"
                value={frequencia}
                onChange={(e) => setFrequencia(e.target.value as Frequencia)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {FREQUENCIAS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
