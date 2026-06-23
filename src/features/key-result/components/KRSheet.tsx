"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { createKeyResult, updateKeyResult } from "@/features/key-result/actions"
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

type TipoMetrica = "aumentar" | "reduzir" | "simNao"

export type KRInitial = {
  id: string
  descricao: string
  tipoMetrica: string
  valorInicial: number
  valorAlvo: number
  unidade: string | null
  peso: number
}

interface KRSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "criar" | "editar"
  objetivoId?: string
  initial?: KRInitial
}

const TIPOS: { value: TipoMetrica; label: string }[] = [
  { value: "aumentar", label: "Aumentar" },
  { value: "reduzir", label: "Reduzir" },
  { value: "simNao", label: "Sim / Não" },
]

export function KRSheet({ open, onOpenChange, mode, objetivoId, initial }: KRSheetProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [descricao, setDescricao] = useState(initial?.descricao ?? "")
  const [tipoMetrica, setTipoMetrica] = useState<TipoMetrica>((initial?.tipoMetrica as TipoMetrica) ?? "aumentar")
  const [valorInicial, setValorInicial] = useState(String(initial?.valorInicial ?? 0))
  const [valorAlvo, setValorAlvo] = useState(initial ? String(initial.valorAlvo) : "")
  const [unidade, setUnidade] = useState(initial?.unidade ?? "")
  const [peso, setPeso] = useState(String(initial?.peso ?? 1))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (descricao.trim().length < 3) {
      setError("Descrição deve ter no mínimo 3 caracteres")
      return
    }
    const alvo = parseFloat(valorAlvo)
    if (Number.isNaN(alvo)) {
      setError("Valor alvo é obrigatório")
      return
    }
    setError("")

    startTransition(async () => {
      try {
        const base = {
          descricao: descricao.trim(),
          tipoMetrica,
          valorInicial: parseFloat(valorInicial) || 0,
          valorAlvo: alvo,
          unidade: unidade.trim() || undefined,
          peso: parseFloat(peso) || 1,
        }
        if (mode === "editar" && initial) {
          await updateKeyResult(initial.id, base)
        } else if (objetivoId) {
          await createKeyResult({ objetivoId, ...base })
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
          <SheetTitle>{mode === "editar" ? "Editar resultado-chave" : "Novo resultado-chave"}</SheetTitle>
          <SheetDescription>Defina como o progresso deste KR é medido.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-4">
          {error && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="kr-descricao">Descrição</Label>
            <Input id="kr-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="kr-tipo">Tipo de métrica</Label>
            <select
              id="kr-tipo"
              value={tipoMetrica}
              onChange={(e) => setTipoMetrica(e.target.value as TipoMetrica)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="kr-inicial">Valor inicial</Label>
              <Input id="kr-inicial" type="number" value={valorInicial} onChange={(e) => setValorInicial(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="kr-alvo">Valor alvo</Label>
              <Input id="kr-alvo" type="number" value={valorAlvo} onChange={(e) => setValorAlvo(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="kr-unidade">Unidade</Label>
              <Input id="kr-unidade" value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="Opcional…" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="kr-peso">Peso</Label>
              <Input id="kr-peso" type="number" value={peso} onChange={(e) => setPeso(e.target.value)} />
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
