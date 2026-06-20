import { cn } from "@/lib/utils"

export type SeriePonto = { data: Date | string; valor: number }

const W = 480
const H = 200
const PAD = { top: 12, right: 12, bottom: 28, left: 36 }

function toTime(d: Date | string): number {
  return (d instanceof Date ? d : new Date(d)).getTime()
}

function fmtData(t: number): string {
  return new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

function buildPath(
  pts: SeriePonto[],
  xScale: (t: number) => number,
  yScale: (v: number) => number
): string {
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(toTime(p.data)).toFixed(1)} ${yScale(p.valor).toFixed(1)}`)
    .join(" ")
}

/**
 * Gráfico de histórico do KR (SVG, componente dumb).
 * `historico` = valores reais (linha sólida primary); `tendencia` = baseline projetado (tracejada).
 */
export function HistoricoChart({
  historico,
  tendencia,
  className,
}: {
  historico: SeriePonto[]
  tendencia: SeriePonto[]
  className?: string
}) {
  const all = [...historico, ...tendencia]
  if (all.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">Sem histórico ainda.</p>
    )
  }

  const times = all.map((p) => toTime(p.data))
  const vals = all.map((p) => p.valor)
  const minT = Math.min(...times)
  const maxT = Math.max(...times)
  const maxV = Math.max(...vals, 0)
  const minV = Math.min(...vals, 0)

  const xScale = (t: number) =>
    PAD.left + (maxT === minT ? 0 : ((t - minT) / (maxT - minT)) * (W - PAD.left - PAD.right))
  const yScale = (v: number) =>
    H - PAD.bottom - (maxV === minV ? 0 : ((v - minV) / (maxV - minV)) * (H - PAD.top - PAD.bottom))

  const ultimoValor = historico.length ? historico[historico.length - 1].valor : null
  const aria = `Histórico do resultado-chave: ${historico.length} ponto(s)${
    ultimoValor !== null ? `, valor atual ${ultimoValor}` : ""
  }; ${tendencia.length} ponto(s) de tendência.`

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={aria}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* eixos */}
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} className="stroke-border" />
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} className="stroke-border" />

        {/* rótulos de valor (min/max) */}
        <text x={PAD.left - 6} y={yScale(maxV)} textAnchor="end" dominantBaseline="middle" className="fill-muted-foreground text-[10px]">
          {Math.round(maxV)}
        </text>
        <text x={PAD.left - 6} y={H - PAD.bottom} textAnchor="end" dominantBaseline="middle" className="fill-muted-foreground text-[10px]">
          {Math.round(minV)}
        </text>
        {/* rótulos de data (início/fim) */}
        <text x={PAD.left} y={H - PAD.bottom + 16} textAnchor="start" className="fill-muted-foreground text-[10px]">
          {fmtData(minT)}
        </text>
        <text x={W - PAD.right} y={H - PAD.bottom + 16} textAnchor="end" className="fill-muted-foreground text-[10px]">
          {fmtData(maxT)}
        </text>

        {/* tendência (baseline) tracejada */}
        {tendencia.length > 1 && (
          <path d={buildPath(tendencia, xScale, yScale)} fill="none" className="stroke-muted-foreground" strokeWidth="1.5" strokeDasharray="4 3" />
        )}

        {/* histórico (real) sólido + pontos */}
        {historico.length > 1 && (
          <path d={buildPath(historico, xScale, yScale)} fill="none" className="stroke-primary" strokeWidth="2" />
        )}
        {historico.map((p, i) => (
          <circle key={i} cx={xScale(toTime(p.data))} cy={yScale(p.valor)} r="3" className="fill-primary" />
        ))}
      </svg>

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-primary" /> Realizado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-4 border-t-2 border-dashed border-muted-foreground" /> Tendência
        </span>
      </div>
    </div>
  )
}
