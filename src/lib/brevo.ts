const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

export type BrevoEmailParams = {
  to: { email: string; name?: string }[]
  templateId: number
  params?: Record<string, unknown>
}

export async function sendEmail(payload: BrevoEmailParams): Promise<void> {
  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Brevo error ${res.status}: ${body}`)
  }
}

export const TEMPLATES = {
  BOAS_VINDAS: 2,
  ACOMPANHAMENTO_PLANO: 3,
  LP_PLANEJAMENTO: 4,
  CONVITE: 5,
  RESPONSAVEL_OBJETIVO: 7,
} as const
