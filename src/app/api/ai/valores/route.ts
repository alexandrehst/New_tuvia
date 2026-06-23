export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { openai, MODELO_PADRAO } from '@/lib/openai'
import { requireApiUser, unauthorizedResponse } from '@/features/auth/api-guard'
import { valoresSchema } from '@/features/ai/schemas'

export async function POST(request: NextRequest) {
  const user = await requireApiUser()
  if (!user) return unauthorizedResponse()

  const parsed = valoresSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return new Response('Invalid input', { status: 400 })
  const { ramo, descricaoNegocio, empresa } = parsed.data

  const stream = await openai.chat.completions.create({
    model: MODELO_PADRAO,
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'Você é um especialista em cultura organizacional. Sugira valores empresariais relevantes.',
      },
      {
        role: 'user',
        content: `Sugira 5 valores organizacionais para:

Empresa: ${empresa ?? ''}
Ramo: ${ramo}
Descrição: ${descricaoNegocio}

Responda com 5 valores, um por linha (apenas o nome do valor, sem explicação).`,
      },
    ],
    max_tokens: 200,
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
