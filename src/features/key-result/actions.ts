'use server'

import { prisma } from '@/lib/prisma'
import { sendEmail, TEMPLATES } from '@/lib/brevo'
import { gerarLinhaTendencia, calcularProgresso, calcularRisco, calcularProgressoObjetivo } from './lib/calculos'
import { requireUser, assertMesmoTenant } from '@/features/auth/guards'
import { updateKeyResultValorSchema, createKeyResultSchema, updateKeyResultSchema, type UpdateKeyResultValorInput, type CreateKeyResultInput, type UpdateKeyResultInput } from './schemas'

export async function updateKeyResultValor(data: UpdateKeyResultValorInput) {
  const parsed = updateKeyResultValorSchema.parse(data)

  // 1. Fetch KR with plan dates via objetivo → plano
  const kr = await prisma.resultadoChave.findUniqueOrThrow({
    where: { id: parsed.krId },
    include: {
      objetivo: {
        include: {
          plano: true,
          resultadosChave: { select: { id: true, progresso: true, peso: true } },
        },
      },
    },
  })

  const plano = kr.objetivo.plano

  const user = await requireUser()
  assertMesmoTenant(plano.clienteId, user.clienteId)

  // 2. Calculate progress and risk
  const progresso = calcularProgresso(
    kr.tipoMetrica as 'aumentar' | 'reduzir' | 'simNao',
    kr.valorInicial,
    kr.valorAlvo,
    parsed.valor
  )

  const status = calcularRisco({
    dataInicio: plano.dataInicio ?? new Date(),
    dataFim: plano.dataFim ?? new Date(),
    valorInicial: kr.valorInicial,
    valorAlvo: kr.valorAlvo,
    valorAtual: parsed.valor,
    tipoMetrica: kr.tipoMetrica as 'aumentar' | 'reduzir' | 'simNao',
  })

  // 3. Update ResultadoChave
  await prisma.resultadoChave.update({
    where: { id: parsed.krId },
    data: {
      valorAtual: parsed.valor,
      progresso,
      status,
    },
  })

  // 4. Insert HistoricoValores
  await prisma.historicoValores.create({
    data: {
      resultadoChaveId: parsed.krId,
      valor: parsed.valor,
      comentario: parsed.comentario,
    },
  })

  // 5. Recalculate objective progress
  const allKrs = kr.objetivo.resultadosChave.map((k) =>
    k.id === parsed.krId ? { progresso, peso: kr.peso } : k
  )
  const progressoObjetivo = calcularProgressoObjetivo(allKrs)

  await prisma.objetivo.update({
    where: { id: kr.objetivoId },
    data: { progresso: progressoObjetivo },
  })

  // 6. Send email notification if user has it enabled
  try {
    const responsaveis = await prisma.objetivoResponsavel.findMany({
      where: { objetivoId: kr.objetivoId },
      include: { user: true },
    })

    for (const resp of responsaveis) {
      if (resp.user.atualizacaoEmailResultado) {
        await sendEmail({
          to: [{ email: resp.user.email, name: resp.user.nome }],
          templateId: TEMPLATES.ACOMPANHAMENTO_PLANO,
          params: {
            krDescricao: kr.descricao,
            valorAtual: parsed.valor,
            progresso,
            status,
          },
        })
      }
    }
  } catch {
    // Non-fatal
  }

  return { ok: true, progresso, status }
}

export async function createKeyResult(data: CreateKeyResultInput) {
  const parsed = createKeyResultSchema.parse(data)

  const objetivo = await prisma.objetivo.findUniqueOrThrow({
    where: { id: parsed.objetivoId },
    include: { plano: true },
  })

  const user = await requireUser()
  assertMesmoTenant(objetivo.plano.clienteId, user.clienteId)

  const kr = await prisma.resultadoChave.create({
    data: {
      objetivoId: parsed.objetivoId,
      descricao: parsed.descricao,
      tipoMetrica: parsed.tipoMetrica,
      valorInicial: parsed.valorInicial,
      valorAlvo: parsed.valorAlvo,
      unidade: parsed.unidade,
      peso: parsed.peso,
      valorAtual: parsed.valorInicial,
    },
  })

  if (objetivo.plano.dataInicio && objetivo.plano.dataFim) {
    const pontos = gerarLinhaTendencia({
      dataInicio: objetivo.plano.dataInicio,
      dataFim: objetivo.plano.dataFim,
      valorInicial: parsed.valorInicial,
      valorAlvo: parsed.valorAlvo,
    })

    await prisma.linhaTendencia.createMany({
      data: pontos.map((p) => ({
        resultadoChaveId: kr.id,
        data: p.data,
        valor: p.valor,
      })),
    })
  }

  return kr
}

export async function getKRHistorico(krId: string) {
  const kr = await prisma.resultadoChave.findUniqueOrThrow({
    where: { id: krId },
    select: { objetivo: { select: { plano: { select: { clienteId: true } } } } },
  })
  const user = await requireUser()
  assertMesmoTenant(kr.objetivo.plano.clienteId, user.clienteId)

  const [historico, tendencia] = await Promise.all([
    prisma.historicoValores.findMany({
      where: { resultadoChaveId: krId },
      orderBy: { dataRegistro: 'asc' },
      select: { dataRegistro: true, valor: true },
    }),
    prisma.linhaTendencia.findMany({
      where: { resultadoChaveId: krId },
      orderBy: { data: 'asc' },
      select: { data: true, valor: true },
    }),
  ])
  return {
    historico: historico.map((h) => ({ data: h.dataRegistro, valor: h.valor })),
    tendencia: tendencia.map((t) => ({ data: t.data, valor: t.valor })),
  }
}

export async function deleteKeyResult(id: string) {
  const kr = await prisma.resultadoChave.findUniqueOrThrow({
    where: { id },
    select: { objetivo: { select: { plano: { select: { clienteId: true } } } } },
  })
  const user = await requireUser()
  assertMesmoTenant(kr.objetivo.plano.clienteId, user.clienteId)

  // Cascata do schema remove HistoricoValores e LinhaTendencia
  await prisma.resultadoChave.delete({ where: { id } })
}

export async function updateKeyResult(id: string, data: UpdateKeyResultInput) {
  const parsed = updateKeyResultSchema.parse(data)

  const kr = await prisma.resultadoChave.findUniqueOrThrow({
    where: { id },
    include: {
      objetivo: {
        include: {
          plano: true,
          resultadosChave: { select: { id: true, progresso: true, peso: true } },
        },
      },
    },
  })
  const plano = kr.objetivo.plano

  const user = await requireUser()
  assertMesmoTenant(plano.clienteId, user.clienteId)

  // Base mesclada (campo enviado ou valor atual) — afeta progresso/risco/tendência
  const tipoMetrica = (parsed.tipoMetrica ?? kr.tipoMetrica) as 'aumentar' | 'reduzir' | 'simNao'
  const valorInicial = parsed.valorInicial ?? kr.valorInicial
  const valorAlvo = parsed.valorAlvo ?? kr.valorAlvo
  const peso = parsed.peso ?? kr.peso

  // Recalcula sobre o valorAtual existente (atualizar VALOR é a Story 2.3)
  const progresso = calcularProgresso(tipoMetrica, valorInicial, valorAlvo, kr.valorAtual)
  const status = calcularRisco({
    dataInicio: plano.dataInicio ?? new Date(),
    dataFim: plano.dataFim ?? new Date(),
    valorInicial,
    valorAlvo,
    valorAtual: kr.valorAtual,
    tipoMetrica,
  })

  const updated = await prisma.resultadoChave.update({
    where: { id },
    data: {
      descricao: parsed.descricao,
      tipoMetrica: parsed.tipoMetrica,
      valorInicial: parsed.valorInicial,
      valorAlvo: parsed.valorAlvo,
      unidade: parsed.unidade,
      peso: parsed.peso,
      progresso,
      status,
    },
  })

  // Recalcula progresso ponderado do Objetivo
  const allKrs = kr.objetivo.resultadosChave.map((k) =>
    k.id === id ? { progresso, peso } : k
  )
  await prisma.objetivo.update({
    where: { id: kr.objetivoId },
    data: { progresso: calcularProgressoObjetivo(allKrs) },
  })

  // Regenera a linha de tendência (baseline) se o plano tem datas
  if (plano.dataInicio && plano.dataFim) {
    await prisma.linhaTendencia.deleteMany({ where: { resultadoChaveId: id } })
    const pontos = gerarLinhaTendencia({
      dataInicio: plano.dataInicio,
      dataFim: plano.dataFim,
      valorInicial,
      valorAlvo,
    })
    await prisma.linhaTendencia.createMany({
      data: pontos.map((p) => ({ resultadoChaveId: id, data: p.data, valor: p.valor })),
    })
  }

  return updated
}
