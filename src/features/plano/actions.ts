'use server'

import { prisma } from '@/lib/prisma'
import { openai, MODELO_PADRAO } from '@/lib/openai'
import { gerarLinhaTendencia, calcularRisco } from '@/features/key-result/lib/calculos'
import { requireUser, assertMesmoTenant } from '@/features/auth/guards'
import { criadorPlanoSchema, type CriadorPlanoInput } from '@/features/criador-plano/schemas'
import { updatePlanoSchema, type UpdatePlanoInput, createPlanoApoioSchema, type CreatePlanoApoioInput } from './schemas'

export async function createPlanoCorporativo(
  rawData: CriadorPlanoInput
): Promise<{ planoId: string }> {
  const user = await requireUser()
  const clienteId = user.clienteId
  const data = criadorPlanoSchema.parse(rawData)

  // 1. Persist PlanoEstrategico
  const planoEstrategico = await prisma.planoEstrategico.create({
    data: {
      clienteId,
      empresa: data.empresa,
      ramo: data.ramo,
      descricaoNegocio: data.descricaoNegocio,
      missao: data.missao,
      visao: data.visao,
      valores: data.valores,
      oportunidades: data.oportunidades,
      ameacas: data.ameacas,
      forcas: data.forcas ?? [],
      fraquezas: data.fraquezas ?? [],
      comecar: data.comecar,
      manter: data.manter ?? [],
      parar: data.parar ?? [],
      ondeEstamos: data.ondeEstamos,
    },
  })

  // 2. Generate objectives via OpenAI
  const objetivosResponse = await openai.chat.completions.create({
    model: MODELO_PADRAO,
    messages: [
      {
        role: 'system',
        content: `Você é um especialista em OKR (Objectives and Key Results) com experiência em planejamento estratégico empresarial.
Sua função é criar OKRs relevantes, mensuráveis e alinhados com os objetivos de negócio da empresa.`,
      },
      {
        role: 'user',
        content: `Crie 3 objetivos estratégicos OKR para a seguinte empresa:

Empresa: ${data.empresa}
Ramo: ${data.ramo}
Descrição: ${data.descricaoNegocio}
Missão: ${data.missao}
Visão: ${data.visao}
Onde estamos: ${data.ondeEstamos}

Responda em JSON com o formato: { "Objectives": [{ "Title": "...", "Description": "..." }] }`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  })

  let objectives: { Title: string; Description: string }[] = []
  try {
    const parsed = JSON.parse(objetivosResponse.choices[0].message.content ?? '{}')
    objectives = parsed.Objectives ?? []
  } catch {
    objectives = [
      { Title: 'Crescer receita', Description: 'Aumentar a receita da empresa' },
      { Title: 'Melhorar satisfação do cliente', Description: 'Elevar NPS da empresa' },
      { Title: 'Otimizar processos internos', Description: 'Reduzir custos operacionais' },
    ]
  }

  // 3. Create Plano
  const plano = await prisma.plano.create({
    data: {
      clienteId,
      planoEstrategicoId: planoEstrategico.id,
      titulo: `Plano Estratégico ${data.empresa}`,
      tipo: 'corporativo',
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      frequenciaAtualizacao: 'mensal',
    },
  })

  // 4. For each objective, generate KRs and persist
  for (let i = 0; i < objectives.length; i++) {
    const obj = objectives[i]

    const krsResponse = await openai.chat.completions.create({
      model: MODELO_PADRAO,
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em OKR. Crie Key Results mensuráveis e acionáveis.',
        },
        {
          role: 'user',
          content: `Para o objetivo "${obj.Title}" da empresa ${data.empresa} (${data.ramo}), crie 3 a 5 Key Results mensuráveis.

Responda em JSON: { "KeyResults": [{ "Description": "...", "ValorInicial": 0, "ValorAlvo": 100, "Unidade": "%" }] }`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
    })

    let krs: { Description: string; ValorInicial: number; ValorAlvo: number; Unidade: string }[] = []
    try {
      const parsed = JSON.parse(krsResponse.choices[0].message.content ?? '{}')
      krs = parsed.KeyResults ?? []
    } catch {
      krs = [
        { Description: 'Atingir meta principal', ValorInicial: 0, ValorAlvo: 100, Unidade: '%' },
        { Description: 'Aumentar indicador secundário', ValorInicial: 0, ValorAlvo: 50, Unidade: 'unidades' },
      ]
    }

    const objetivo = await prisma.objetivo.create({
      data: {
        planoId: plano.id,
        titulo: obj.Title,
        descricao: obj.Description,
        numero: i + 1,
      },
    })

    for (const kr of krs) {
      const resultadoChave = await prisma.resultadoChave.create({
        data: {
          objetivoId: objetivo.id,
          descricao: kr.Description,
          valorInicial: kr.ValorInicial ?? 0,
          valorAlvo: kr.ValorAlvo ?? 100,
          unidade: kr.Unidade,
          valorAtual: kr.ValorInicial ?? 0,
        },
      })

      // 5. Generate and persist LinhaTendencia
      const pontos = gerarLinhaTendencia({
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        valorInicial: kr.ValorInicial ?? 0,
        valorAlvo: kr.ValorAlvo ?? 100,
      })

      await prisma.linhaTendencia.createMany({
        data: pontos.map((p) => ({
          resultadoChaveId: resultadoChave.id,
          data: p.data,
          valor: p.valor,
        })),
      })
    }
  }

  return { planoId: plano.id }
}

export async function updatePlano(id: string, data: UpdatePlanoInput) {
  const parsed = updatePlanoSchema.parse(data)

  const anterior = await prisma.plano.findUniqueOrThrow({
    where: { id },
    select: { clienteId: true, dataInicio: true, dataFim: true },
  })
  const user = await requireUser()
  assertMesmoTenant(anterior.clienteId, user.clienteId)

  const plano = await prisma.plano.update({
    where: { id },
    data: {
      titulo: parsed.titulo,
      dataInicio: parsed.dataInicio,
      dataFim: parsed.dataFim,
      frequenciaAtualizacao: parsed.frequenciaAtualizacao,
    },
  })

  // Datas mudaram? Compara por DIA (UTC) — evita recompute espúrio por diferença de hora.
  const dia = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : null)
  const datasMudaram =
    (parsed.dataInicio !== undefined && dia(parsed.dataInicio) !== dia(anterior.dataInicio)) ||
    (parsed.dataFim !== undefined && dia(parsed.dataFim) !== dia(anterior.dataFim))

  // Risco e linha de tendência dependem das datas do plano → recomputar todos os KRs.
  // progresso/valorAtual NÃO dependem de datas e não são tocados.
  if (datasMudaram && plano.dataInicio && plano.dataFim) {
    const krs = await prisma.resultadoChave.findMany({
      where: { objetivo: { planoId: id } },
      select: { id: true, tipoMetrica: true, valorInicial: true, valorAlvo: true, valorAtual: true },
    })
    for (const kr of krs) {
      const tipoMetrica = kr.tipoMetrica as 'aumentar' | 'reduzir' | 'simNao'
      const status = calcularRisco({
        dataInicio: plano.dataInicio,
        dataFim: plano.dataFim,
        valorInicial: kr.valorInicial,
        valorAlvo: kr.valorAlvo,
        valorAtual: kr.valorAtual,
        tipoMetrica,
      })
      await prisma.resultadoChave.update({ where: { id: kr.id }, data: { status } })
      await prisma.linhaTendencia.deleteMany({ where: { resultadoChaveId: kr.id } })
      const pontos = gerarLinhaTendencia({
        dataInicio: plano.dataInicio,
        dataFim: plano.dataFim,
        valorInicial: kr.valorInicial,
        valorAlvo: kr.valorAlvo,
      })
      await prisma.linhaTendencia.createMany({
        data: pontos.map((p) => ({ resultadoChaveId: kr.id, data: p.data, valor: p.valor })),
      })
    }
  }

  return plano
}

export async function createPlanoDepartamento(data: CreatePlanoApoioInput) {
  const user = await requireUser()
  const parsed = createPlanoApoioSchema.parse(data)

  // O plano-pai deve pertencer ao mesmo tenant
  const pai = await prisma.plano.findUniqueOrThrow({
    where: { id: parsed.planoPaiId },
    select: { clienteId: true },
  })
  assertMesmoTenant(pai.clienteId, user.clienteId)

  const plano = await prisma.plano.create({
    data: {
      clienteId: user.clienteId,
      planoPaiId: parsed.planoPaiId,
      titulo: parsed.titulo,
      tipo: 'apoio',
      status: 'edicao',
      dataInicio: parsed.dataInicio,
      dataFim: parsed.dataFim,
    },
  })

  return { planoId: plano.id }
}
