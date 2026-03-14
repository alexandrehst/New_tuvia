'use server'

import { prisma } from '@/lib/prisma'
import { openai, MODELO_PADRAO } from '@/lib/openai'
import { gerarLinhaTendencia } from '@/features/key-result/lib/calculos'
import { criadorPlanoSchema, type CriadorPlanoInput } from '@/features/criador-plano/schemas'

export async function createPlanoCorporativo(
  clienteId: string,
  rawData: CriadorPlanoInput
): Promise<{ planoId: string }> {
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
