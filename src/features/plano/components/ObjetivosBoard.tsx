"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { KRCard, type KRCardData } from "@/features/key-result/components/KRCard"
import { KRPanel } from "@/features/key-result/components/KRPanel"
import { KRSheet, type KRInitial } from "@/features/key-result/components/KRSheet"
import { deleteObjetivo } from "@/features/objetivo/actions"
import { deleteKeyResult, getKRHistorico } from "@/features/key-result/actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { HistoricoChart, type SeriePonto } from "@/components/historico-chart"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ObjetivoSheet,
  type ObjetivoInitial,
  type ObjetivoUsuario,
} from "@/features/objetivo/components/ObjetivoSheet"
import { statusLabel } from "@/features/key-result/lib/status"
import type { StatusRisco } from "@/features/key-result/lib/calculos"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

type ResultadoChave = KRCardData & { valorInicial: number; tipoMetrica: string }
type Objetivo = {
  id: string
  titulo: string
  descricao?: string | null
  numero: number
  progresso: number
  resultadosChave: ResultadoChave[]
  responsaveis?: { user: { id: string; nome: string } }[]
}

type KRPanelData = {
  id: string
  descricao: string
  valorAtual: number
  progresso: number
  status: string
  unidade: string | null
}

type KROverride = { progresso: number; status: string; valorAtual: number }
type ObjetivoSheetState = { mode: "criar" | "editar"; initial?: ObjetivoInitial }
type KRSheetState =
  | { mode: "criar"; objetivoId: string }
  | { mode: "editar"; initial: KRInitial }
type ConfirmState =
  | { tipo: "objetivo"; id: string; titulo: string }
  | { tipo: "kr"; id: string; descricao: string }

// Painel de histórico — busca lazy ao montar (getKRHistorico é Server Action)
function HistoricoPanelContent({ krId }: { krId: string }) {
  const [data, setData] = useState<{ historico: SeriePonto[]; tendencia: SeriePonto[] } | null>(null)

  useEffect(() => {
    let active = true
    getKRHistorico(krId).then((d) => {
      if (active) setData(d)
    })
    return () => {
      active = false
    }
  }, [krId])

  if (!data) return <Skeleton className="h-48 w-full" />
  return <HistoricoChart historico={data.historico} tendencia={data.tendencia} />
}

function toPanelData(kr: ResultadoChave): KRPanelData {
  return {
    id: kr.id,
    descricao: kr.descricao,
    valorAtual: kr.valorAtual,
    progresso: kr.progresso,
    status: kr.status,
    unidade: kr.unidade,
  }
}

export function ObjetivosBoard({
  objetivos,
  planoId,
  usuarios,
}: {
  objetivos: Objetivo[]
  planoId: string
  usuarios: ObjetivoUsuario[]
}) {
  const [openKR, setOpenKR] = useState<KRPanelData | null>(null)
  const [overrides, setOverrides] = useState<Record<string, KROverride>>({})
  const [announce, setAnnounce] = useState("")
  const [objetivoSheet, setObjetivoSheet] = useState<ObjetivoSheetState | null>(null)
  const [krSheet, setKrSheet] = useState<KRSheetState | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [historico, setHistorico] = useState<{ krId: string; descricao: string } | null>(null)
  const router = useRouter()

  const display = (kr: ResultadoChave): ResultadoChave => {
    const o = overrides[kr.id]
    return o ? { ...kr, ...o } : kr
  }

  const proximoNumero =
    objetivos.reduce((max, o) => Math.max(max, o.numero), 0) + 1

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Objetivos ({objetivos.length})
        </h2>
        <Button size="sm" className="gap-1.5" onClick={() => setObjetivoSheet({ mode: "criar" })}>
          <Plus className="size-4" /> Novo objetivo
        </Button>
      </div>

      {objetivos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">Nenhum objetivo ainda.</p>
          <Button size="sm" onClick={() => setObjetivoSheet({ mode: "criar" })}>
            Criar primeiro objetivo
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 overflow-x-auto pb-2 lg:flex-row lg:items-start">
          {objetivos.map((objetivo) => (
            <section
              key={objetivo.id}
              data-testid="objetivo-coluna"
              className="flex w-full shrink-0 flex-col gap-3 lg:w-80"
            >
              <header className="px-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Objetivo {objetivo.numero}
                </p>
                <h3 className="mt-0.5 text-base font-semibold leading-snug text-foreground">
                  {objetivo.titulo}
                </h3>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    Progresso ponderado · {Math.round(objetivo.progresso)}%
                  </span>
                  <div className="flex items-center gap-2">
                    {objetivo.responsaveis && objetivo.responsaveis.length > 0 && (
                      <div className="flex -space-x-1">
                        {objetivo.responsaveis.slice(0, 3).map((r) => (
                          <Avatar key={r.user.id} className="size-5 border border-background">
                            <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                              {r.user.nome[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {objetivo.responsaveis.length > 3 && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            +{objetivo.responsaveis.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Editar objetivo"
                      onClick={() =>
                        setObjetivoSheet({
                          mode: "editar",
                          initial: {
                            id: objetivo.id,
                            titulo: objetivo.titulo,
                            descricao: objetivo.descricao,
                            numero: objetivo.numero,
                            responsaveisIds: (objetivo.responsaveis ?? []).map((r) => r.user.id),
                          },
                        })
                      }
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Excluir objetivo"
                      onClick={() => setConfirm({ tipo: "objetivo", id: objetivo.id, titulo: objetivo.titulo })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </header>

              {objetivo.resultadosChave.map((kr) => (
                <KRCard
                  key={kr.id}
                  kr={display(kr)}
                  onAtualizar={() => setOpenKR(toPanelData(display(kr)))}
                  onEditar={() =>
                    setKrSheet({
                      mode: "editar",
                      initial: {
                        id: kr.id,
                        descricao: kr.descricao,
                        tipoMetrica: kr.tipoMetrica,
                        valorInicial: kr.valorInicial,
                        valorAlvo: kr.valorAlvo,
                        unidade: kr.unidade,
                        peso: kr.peso,
                      },
                    })
                  }
                  onExcluir={() => setConfirm({ tipo: "kr", id: kr.id, descricao: kr.descricao })}
                  onHistorico={() => setHistorico({ krId: kr.id, descricao: kr.descricao })}
                />
              ))}

              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-1.5 border-dashed text-muted-foreground"
                onClick={() => setKrSheet({ mode: "criar", objetivoId: objetivo.id })}
              >
                <Plus className="size-3.5" /> Adicionar KR
              </Button>
            </section>
          ))}
        </div>
      )}

      {/* Painel de atualizar valor de KR */}
      <Sheet open={!!openKR} onOpenChange={(open) => !open && setOpenKR(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Atualizar resultado-chave</SheetTitle>
            <SheetDescription>{openKR?.descricao}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            {openKR && (
              <KRPanel
                kr={openKR}
                onClose={() => setOpenKR(null)}
                onUpdate={(updated) => {
                  setOverrides((prev) => ({
                    ...prev,
                    [updated.id]: {
                      progresso: updated.progresso,
                      status: updated.status,
                      valorAtual: updated.valorAtual,
                    },
                  }))
                  setAnnounce(
                    `Resultado-chave atualizado: ${statusLabel(updated.status as StatusRisco)}, ${Math.round(updated.progresso)}%`
                  )
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Painel de criar/editar objetivo (remonta por key para resetar o form) */}
      {objetivoSheet && (
        <ObjetivoSheet
          key={objetivoSheet.initial?.id ?? "criar"}
          open
          onOpenChange={(open) => !open && setObjetivoSheet(null)}
          mode={objetivoSheet.mode}
          planoId={planoId}
          usuarios={usuarios}
          initial={objetivoSheet.initial}
          proximoNumero={proximoNumero}
        />
      )}

      {/* Painel de criar/editar KR */}
      {krSheet && (
        <KRSheet
          key={krSheet.mode === "editar" ? krSheet.initial.id : `criar-${krSheet.objetivoId}`}
          open
          onOpenChange={(open) => !open && setKrSheet(null)}
          mode={krSheet.mode}
          objetivoId={krSheet.mode === "criar" ? krSheet.objetivoId : undefined}
          initial={krSheet.mode === "editar" ? krSheet.initial : undefined}
        />
      )}

      {/* Confirmação de exclusão (objetivo ou KR) */}
      {confirm && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setConfirm(null)}
          destructive
          confirmLabel="Excluir"
          title={confirm.tipo === "objetivo" ? "Excluir objetivo?" : "Excluir resultado-chave?"}
          description={
            confirm.tipo === "objetivo"
              ? `Excluir o objetivo "${confirm.titulo}"? Os resultados-chave também serão removidos.`
              : `Excluir "${confirm.descricao}"? O histórico de valores será removido.`
          }
          onConfirm={async () => {
            if (confirm.tipo === "objetivo") await deleteObjetivo(confirm.id)
            else await deleteKeyResult(confirm.id)
            router.refresh()
          }}
        />
      )}

      {/* Painel de histórico / tendência */}
      <Sheet open={!!historico} onOpenChange={(open) => !open && setHistorico(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Histórico do resultado-chave</SheetTitle>
            <SheetDescription>{historico?.descricao}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            {historico && <HistoricoPanelContent key={historico.krId} krId={historico.krId} />}
          </div>
        </SheetContent>
      </Sheet>

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
    </>
  )
}
