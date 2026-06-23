"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

import { updatePapel, updateNotificacao, removerMembroDoPlano } from "@/features/usuarios/actions"
import type { Papel, NotificacaoCampo } from "@/features/usuarios/schemas"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ConfirmDialog } from "@/components/confirm-dialog"

type VinculoPlano = { id: string; papel: string; plano: { id: string; titulo: string } }
type Membro = {
  id: string
  nome: string
  email: string
  tipoUser: string
  statusUser: string
  atualizacaoEmailPlano: boolean
  atualizacaoEmailObjetivo: boolean
  atualizacaoEmailResultado: boolean
  planosUsuario: VinculoPlano[]
}

const PAPEL_LABELS: Record<string, string> = { owner: "Owner", editor: "Editor", viewer: "Visualizador" }
const PAPEIS: Papel[] = ["owner", "editor", "viewer"]
const NOTIFICACOES: { campo: NotificacaoCampo; label: string; prop: keyof Membro }[] = [
  { campo: "plano", label: "Plano", prop: "atualizacaoEmailPlano" },
  { campo: "objetivo", label: "Objetivo", prop: "atualizacaoEmailObjetivo" },
  { campo: "resultado", label: "Resultado", prop: "atualizacaoEmailResultado" },
]

function NotificacaoSwitch({
  userId,
  campo,
  label,
  inicial,
  onSaved,
  onError,
}: {
  userId: string
  campo: NotificacaoCampo
  label: string
  inicial: boolean
  onSaved: () => void
  onError: () => void
}) {
  const [checked, setChecked] = useState(inicial)
  const [, startTransition] = useTransition()
  const id = `notif-${userId}-${campo}`
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={(v: boolean) => {
          setChecked(v)
          startTransition(async () => {
            try {
              await updateNotificacao(userId, campo, v)
              onSaved()
            } catch {
              setChecked(!v)
              onError()
            }
          })
        }}
      />
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
    </div>
  )
}

function PapelSelect({ vinculoId, papel, onSaved, onError }: { vinculoId: string; papel: string; onSaved: () => void; onError: () => void }) {
  const [valor, setValor] = useState(papel)
  const [, startTransition] = useTransition()
  return (
    <select
      aria-label="Papel"
      value={valor}
      onChange={(e) => {
        const novo = e.target.value
        const anterior = valor
        setValor(novo)
        startTransition(async () => {
          try {
            await updatePapel(vinculoId, novo as Papel)
            onSaved()
          } catch {
            setValor(anterior)
            onError()
          }
        })
      }}
      className="h-7 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {PAPEIS.map((p) => (
        <option key={p} value={p}>{PAPEL_LABELS[p]}</option>
      ))}
    </select>
  )
}

export function MembrosList({ membros }: { membros: Membro[] }) {
  const router = useRouter()
  const [announce, setAnnounce] = useState("")
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; label: string } | null>(null)

  // marcador zero-width alternado força o leitor de tela a reanunciar mensagens repetidas
  const tick = useRef(0)
  const anunciar = (msg: string) => {
    tick.current += 1
    setAnnounce(msg + "​".repeat(tick.current % 2))
  }
  const onSaved = () => {
    anunciar("Alterações salvas")
    router.refresh()
  }
  const onError = () => {
    anunciar("Não foi possível salvar. Tente novamente.")
  }

  if (membros.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-border bg-card py-16 text-center">
        <p className="text-sm text-muted-foreground">Nenhum membro ainda.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {membros.map((m) => (
          <div key={m.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {m.nome[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{m.nome}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{m.tipoUser === "admin" ? "Admin" : "Membro"}</Badge>
                {m.statusUser !== "ativo" && (
                  <span className="text-xs text-muted-foreground capitalize">{m.statusUser}</span>
                )}
              </div>
            </div>

            {/* Notificações por e-mail */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notificações por e-mail
              </p>
              <div className="flex flex-wrap gap-4">
                {NOTIFICACOES.map((n) => (
                  <NotificacaoSwitch
                    key={n.campo}
                    userId={m.id}
                    campo={n.campo}
                    label={n.label}
                    inicial={m[n.prop] as boolean}
                    onSaved={onSaved}
                    onError={onError}
                  />
                ))}
              </div>
            </div>

            {/* Papéis por plano */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Planos
              </p>
              {m.planosUsuario.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem planos atribuídos.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {m.planosUsuario.map((v) => (
                    <div key={v.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                      <span className="flex-1 truncate text-sm text-foreground">{v.plano.titulo}</span>
                      <PapelSelect vinculoId={v.id} papel={v.papel} onSaved={onSaved} onError={onError} />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remover ${m.nome} de ${v.plano.titulo}`}
                        onClick={() => setConfirmRemove({ id: v.id, label: `${m.nome} de "${v.plano.titulo}"` })}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {confirmRemove && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setConfirmRemove(null)}
          destructive
          confirmLabel="Remover"
          title="Remover do plano?"
          description={`Remover ${confirmRemove.label}? O usuário perde o acesso a este plano (a conta não é excluída).`}
          onConfirm={async () => {
            try {
              await removerMembroDoPlano(confirmRemove.id)
              onSaved()
            } catch {
              onError()
            }
          }}
        />
      )}

      <div aria-live="polite" className="sr-only">{announce}</div>
    </>
  )
}
