export type TipoMetrica = 'aumentar' | 'reduzir' | 'simNao'

export type StatusRisco = 'no_prazo' | 'em_atraso' | 'em_risco' | 'risco_alto'

/**
 * Calcula o progresso percentual de um Key Result (0–100).
 */
export function calcularProgresso(
  tipoMetrica: TipoMetrica,
  valorInicial: number,
  valorAlvo: number,
  valorAtual: number
): number {
  if (tipoMetrica === 'simNao') {
    return valorAtual ? 100 : 0
  }
  if (tipoMetrica === 'reduzir') {
    const range = valorInicial - valorAlvo
    if (range === 0) return 100
    return Math.round((1 - (valorAtual - valorAlvo) / range) * 100)
  }
  // aumentar (default)
  const range = valorAlvo - valorInicial
  if (range === 0) return 100
  return Math.round(((valorAtual - valorInicial) / range) * 100)
}

/**
 * Calcula o status de risco de um Key Result com base no progresso linear esperado.
 */
export function calcularRisco(params: {
  dataInicio: Date
  dataFim: Date
  valorInicial: number
  valorAlvo: number
  valorAtual: number
  tipoMetrica: TipoMetrica
  dataCalculo?: Date
}): StatusRisco {
  const { dataInicio, dataFim, valorInicial, valorAlvo, valorAtual, tipoMetrica } = params
  const dataCalculo = params.dataCalculo ?? new Date()

  const prazoTotal = dataFim.getTime() - dataInicio.getTime()
  const decorrido = dataCalculo.getTime() - dataInicio.getTime()

  if (decorrido <= 0 || prazoTotal <= 0) return 'no_prazo'

  const fracaoDecorrida = decorrido / prazoTotal

  let valorEsperado: number
  if (tipoMetrica === 'reduzir') {
    valorEsperado = valorInicial - (valorInicial - valorAlvo) * fracaoDecorrida
  } else {
    valorEsperado = valorInicial + (valorAlvo - valorInicial) * fracaoDecorrida
  }

  if (valorEsperado === 0) return 'no_prazo'

  // Para "reduzir": estar acima do esperado significa estar atrasado → inverte o sinal
  const rawDiff = (valorAtual - valorEsperado) / Math.abs(valorEsperado)
  const diff = tipoMetrica === 'reduzir' ? rawDiff * -1 : rawDiff

  if (diff < -0.5) return 'risco_alto'
  if (diff < -0.25) return 'em_risco'
  if (diff < 0) return 'em_atraso'
  return 'no_prazo'
}

/**
 * Calcula o progresso ponderado de um Objetivo com base nos KRs.
 */
export function calcularProgressoObjetivo(
  krs: { progresso: number; peso: number }[]
): number {
  if (krs.length === 0) return 0
  const totalPeso = krs.reduce((sum, kr) => sum + kr.peso, 0)
  if (totalPeso === 0) return 0
  const somaPonderada = krs.reduce((sum, kr) => sum + kr.progresso * kr.peso, 0)
  return Math.round(somaPonderada / totalPeso)
}

/**
 * Gera a linha de tendência (baseline linear) para um Key Result.
 * Retorna um array de { data, valor }.
 */
export function gerarLinhaTendencia(params: {
  dataInicio: Date
  dataFim: Date
  valorInicial: number
  valorAlvo: number
}): { data: Date; valor: number }[] {
  const { dataInicio, dataFim, valorInicial, valorAlvo } = params

  const diffMs = dataFim.getTime() - dataInicio.getTime()
  const diffMeses = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30))

  const numeroPontos = diffMeses < 6 ? Math.max(diffMeses, 2) : 6

  const pontos: { data: Date; valor: number }[] = []
  for (let i = 0; i < numeroPontos; i++) {
    const fracao = i / (numeroPontos - 1)
    const data = new Date(dataInicio.getTime() + fracao * diffMs)
    const valor = valorInicial + fracao * (valorAlvo - valorInicial)
    pontos.push({ data, valor: Math.round(valor * 100) / 100 })
  }

  return pontos
}
