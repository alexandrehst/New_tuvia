export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { openai, MODELO_PADRAO } from '@/lib/openai'
import { requireApiUser, unauthorizedResponse } from '@/features/auth/api-guard'
import { missaoSchema } from '@/features/ai/schemas'

export async function POST(request: NextRequest) {
  const user = await requireApiUser()
  if (!user) return unauthorizedResponse()

  const parsed = missaoSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return new Response('Invalid input', { status: 400 })
  const { ramo, descricaoNegocio, empresa } = parsed.data

  const stream = await openai.chat.completions.create({
    model: MODELO_PADRAO,
    stream: true,
    messages: [
      {
        role: 'system',
        content: `Você é um especialista em estratégia empresarial e planejamento organizacional.
Crie declarações de missão claras, inspiradoras e relevantes para empresas.`,
      },
      {
        role: 'user',
        content: `Crie 5 sugestões de missão para a seguinte empresa:

Empresa: ${empresa ?? ''}
Ramo: ${ramo}
Descrição: ${descricaoNegocio}

Responda com exatamente 5 sugestões, uma por linha, sem numeração, sem bullet points.
Cada linha deve ser uma declaração de missão completa.`,
      },
    ],
    max_tokens: 600,
  })

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) {
          controller.enqueue(new TextEncoder().encode(text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
