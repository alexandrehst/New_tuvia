export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PlanoEditButton } from '@/features/plano/components/PlanoEditButton'
import { PlanoApoioButton } from '@/features/plano/components/PlanoApoioButton'
import { getPlanoWithObjetivos } from '@/features/plano/queries'
import { getClienteUsuarios } from '@/features/usuarios/queries'
import { ObjetivosBoard } from '@/features/plano/components/ObjetivosBoard'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

function CircularProgress({ value, size = 60 }: { value: number; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(value, 100) / 100) * circ
  const center = size / 2
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={center} cy={center} r={r} fill="none" className="stroke-border" strokeWidth="5" />
        <circle
          cx={center} cy={center} r={r}
          fill="none"
          className="stroke-primary progress-ring"
          strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
        {Math.round(Math.min(100, Math.max(0, value)))}%
      </span>
    </div>
  )
}

function calcTimeElapsed(dataInicio: Date, dataFim: Date): number {
  const total = dataFim.getTime() - dataInicio.getTime()
  if (total <= 0) return 0
  const elapsed = Date.now() - dataInicio.getTime()
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
}

export default async function PlanoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const plano = await getPlanoWithObjetivos(id)
  if (!plano) notFound()

  const objetivos = plano.objetivos ?? []
  const usuarios = await getClienteUsuarios(plano.clienteId)
  const todosKRs = objetivos.flatMap(o => o.resultadosChave)
  const totalKRs = todosKRs.length
  const completedKRs = todosKRs.filter(kr => kr.progresso >= 100).length
  const openKRs = totalKRs - completedKRs

  const overallProgress = objetivos.length > 0
    ? Math.round(objetivos.reduce((sum, o) => sum + o.progresso, 0) / objetivos.length)
    : 0

  let timeElapsed = 0
  let dataInicioStr: string | null = null
  let dataFimStr: string | null = null
  if (plano.dataInicio && plano.dataFim) {
    timeElapsed = calcTimeElapsed(plano.dataInicio, plano.dataFim)
    dataInicioStr = plano.dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    dataFimStr = plano.dataFim.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Breadcrumb className="mb-1">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/planos" />}>Planos</BreadcrumbLink>
              </BreadcrumbItem>
              {plano.planoPai && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link href={`/planos/${plano.planoPai.id}`} />}>
                      {plano.planoPai.titulo}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{plano.titulo}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-bold text-foreground">{plano.titulo}</h1>
        </div>
        <div className="flex items-center gap-2">
          {plano.tipo === 'corporativo' && (
            <PlanoApoioButton
              planoPaiId={plano.id}
              dataInicio={plano.dataInicio}
              dataFim={plano.dataFim}
            />
          )}
          <PlanoEditButton
            plano={{
              id: plano.id,
              titulo: plano.titulo,
              dataInicio: plano.dataInicio,
              dataFim: plano.dataFim,
              frequenciaAtualizacao: plano.frequenciaAtualizacao,
            }}
          />
        </div>
      </div>

      {/* Summary card */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-8 flex-wrap">
            {/* Overall achievement */}
            <div className="flex items-center gap-4">
              <CircularProgress value={overallProgress} />
              <div>
                <p className="font-semibold text-sm">Progresso geral</p>
                <p className="text-xs text-muted-foreground">Média dos objetivos</p>
              </div>
            </div>

            {plano.dataInicio && plano.dataFim && (
              <>
                <Separator orientation="vertical" className="h-14 hidden sm:block" />
                <div className="flex items-center gap-4">
                  <CircularProgress value={timeElapsed} />
                  <div>
                    <p className="font-semibold text-sm">Tempo decorrido</p>
                    <p className="text-xs text-muted-foreground">Do período total</p>
                  </div>
                </div>
              </>
            )}

            <Separator orientation="vertical" className="h-14 hidden sm:block" />

            {/* KR counts */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-metric">{totalKRs}</p>
                <p className="text-xs text-muted-foreground">Total KRs</p>
              </div>
              <div className="text-center">
                <p className="text-metric text-primary">{openKRs}</p>
                <p className="text-xs text-muted-foreground">Em aberto</p>
              </div>
              <div className="text-center">
                <p className="text-metric">{completedKRs}</p>
                <p className="text-xs text-muted-foreground">Concluídos</p>
              </div>
            </div>

            {dataInicioStr && dataFimStr && (
              <>
                <Separator orientation="vertical" className="h-14 hidden sm:block" />
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Início</p>
                    <p className="text-sm font-medium">{dataInicioStr}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fim</p>
                    <p className="text-sm font-medium">{dataFimStr}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Objectives section */}
      <ObjetivosBoard objetivos={objetivos} planoId={plano.id} usuarios={usuarios} />
    </div>
  )
}
