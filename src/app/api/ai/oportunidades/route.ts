export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { openai, MODELO_PADRAO } from '@/lib/openai'

export async function POST(request: NextRequest) {
  const { ramo, descricaoNegocio } = await request.json()

  const stream = await openai.chat.completions.create({
    model: MODELO_PADRAO,
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'Você é um especialista em análise SWOT. Identifique oportunidades de mercado.',
      },
      {
        role: 'user',
        content: `Identifique 5 oportunidades de mercado para uma empresa do ramo ${ramo}: ${descricaoNegocio}

Responda com 5 oportunidades, uma por linha.`,
      },
    ],
    max_tokens: 400,
  })

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) controller.enqueue(new TextEncoder().encode(text))
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
  })
}
