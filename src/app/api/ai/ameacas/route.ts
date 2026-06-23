export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { openai, MODELO_PADRAO } from '@/lib/openai'
import { requireApiUser, unauthorizedResponse } from '@/features/auth/api-guard'
import { ameacasSchema } from '@/features/ai/schemas'

export async function POST(request: NextRequest) {
  const user = await requireApiUser()
  if (!user) return unauthorizedResponse()

  const parsed = ameacasSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return new Response('Invalid input', { status: 400 })
  const { ramo, descricaoNegocio } = parsed.data

  const stream = await openai.chat.completions.create({
    model: MODELO_PADRAO,
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'Você é um especialista em análise SWOT. Identifique ameaças e riscos de mercado.',
      },
      {
        role: 'user',
        content: `Identifique 5 ameaças para uma empresa do ramo ${ramo}: ${descricaoNegocio}

Responda com 5 ameaças, uma por linha.`,
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
