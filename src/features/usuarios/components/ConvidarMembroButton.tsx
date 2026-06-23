"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { UserPlus } from "lucide-react"

import { inviteUser } from "@/features/usuarios/actions"
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

export function ConvidarMembroButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [nome, setNome] = useState("")
  const [error, setError] = useState("")
  const [sucesso, setSucesso] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSucesso("")
    if (!email.trim()) {
      setError("Informe um e-mail")
      return
    }
    startTransition(async () => {
      try {
        const res = await inviteUser({ email: email.trim(), nome: nome.trim() || undefined })
        if (!res.ok) {
          setError(res.erro)
          return
        }
        router.refresh()
        setSucesso(
          res.emailEnviado
            ? "Convite enviado."
            : "Convite criado, mas o e-mail não pôde ser enviado."
        )
        setEmail("")
        setNome("")
      } catch {
        setError("Não foi possível enviar o convite. Tente novamente.")
      }
    })
  }

  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" /> Convidar membro
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Convidar membro</SheetTitle>
            <SheetDescription>Envie um convite por e-mail para entrar no workspace.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-4">
            {error && (
              <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            {sucesso && (
              <div role="status" className="rounded-md bg-status-no-prazo-bg px-3 py-2 text-sm text-status-no-prazo">
                {sucesso}
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="convite-email">E-mail</Label>
              <Input
                id="convite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pessoa@empresa.com"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="convite-nome">Nome (opcional)</Label>
              <Input
                id="convite-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Como a pessoa será exibida"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
                Fechar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enviando…" : "Enviar convite"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
