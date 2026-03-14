export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { openai, MODELO_PADRAO } from '@/lib/openai'

export async function POST(request: NextRequest) {
  const { ramo, descricaoNegocio, empresa, missao } = await request.json()

  const stream = await openai.chat.completions.create({
    model: MODELO_PADRAO,
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'Você é um especialista em estratégia empresarial. Crie declarações de visão inspiradoras e ambiciosas.',
      },
      {
        role: 'user',
        content: `Crie 5 sugestões de visão para:

Empresa: ${empresa ?? ''}
Ramo: ${ramo}
Descrição: ${descricaoNegocio}
Missão: ${missao ?? ''}

Responda com 5 sugestões, uma por linha, sem numeração.`,
      },
    ],
    max_tokens: 600,
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
