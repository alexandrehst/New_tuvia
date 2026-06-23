export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { openai, MODELO_PADRAO } from '@/lib/openai'
import { requireApiUser, unauthorizedResponse } from '@/features/auth/api-guard'
import { keyResultsSchema } from '@/features/ai/schemas'

export async function POST(request: NextRequest) {
  const user = await requireApiUser()
  if (!user) return unauthorizedResponse()

  const parsed = keyResultsSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return new Response('Invalid input', { status: 400 })
  const { objetivo, empresa, ramo } = parsed.data

  const stream = await openai.chat.completions.create({
    model: MODELO_PADRAO,
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'Você é um especialista em OKR. Crie Key Results mensuráveis e acionáveis.',
      },
      {
        role: 'user',
        content: `Crie 3-5 Key Results para o objetivo "${objetivo}" da empresa ${empresa} (${ramo}).

Responda com os KRs, um por linha, no formato: "Aumentar [métrica] de [inicial] para [alvo]"`,
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
