import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { planoStatusLabel, planoStatusBadgeClasses } from '@/features/plano/lib/status'

type PlanoCardProps = {
  plano: {
    id: string
    titulo: string
    status: string
    dataFim?: Date | null
    _count?: { objetivos: number }
  }
}

export function PlanoCard({ plano }: PlanoCardProps) {
  const dataFimFormatted = plano.dataFim
    ? new Date(plano.dataFim).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  return (
    <Link href={`/planos/${plano.id}`} data-testid="plano-card">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <Badge className={planoStatusBadgeClasses(plano.status)}>
              {planoStatusLabel(plano.status)}
            </Badge>
          </div>

          <h3 className="font-semibold text-sm leading-snug mb-2 text-foreground">
            {plano.titulo}
          </h3>

          {dataFimFormatted && (
            <p className="text-xs text-muted-foreground mb-3">
              Finaliza em {dataFimFormatted}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            {plano._count?.objetivos ?? 0} objetivo{(plano._count?.objetivos ?? 0) !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
