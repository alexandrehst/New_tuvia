'use server'

import { prisma } from '@/lib/prisma'
import { sendEmail, TEMPLATES } from '@/lib/brevo'
import { gerarLinhaTendencia, calcularProgresso, calcularRisco, calcularProgressoObjetivo } from './lib/calculos'
import { updateKeyResultValorSchema, createKeyResultSchema, type UpdateKeyResultValorInput, type CreateKeyResultInput } from './schemas'

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
