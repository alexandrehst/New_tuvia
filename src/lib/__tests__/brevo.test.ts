import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendEmail, TEMPLATES } from '../brevo'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  process.env.BREVO_API_KEY = 'test-api-key'
})

describe('sendEmail', () => {
  it('faz POST para a API do Brevo com payload correto', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)

    await sendEmail({
      to: [{ email: 'user@test.com', name: 'User' }],
      templateId: TEMPLATES.BOAS_VINDAS,
      params: { nome: 'User' },
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'api-key': 'test-api-key',
          'Content-Type': 'application/json',
        }),
      })
    )
  })

  it('inclui o payload correto no body', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)

    const payload = {
      to: [{ email: 'user@test.com', name: 'User' }],
      templateId: TEMPLATES.BOAS_VINDAS,
    }

    await sendEmail(payload)

    const call = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse(call[1]!.body as string)
    expect(body).toEqual(payload)
  })

  it('lança erro quando a API retorna status não-ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    } as Response)

    await expect(
      sendEmail({ to: [{ email: 'user@test.com' }], templateId: 1 })
    ).rejects.toThrow('Brevo error 401')
  })

  it('inclui a mensagem de erro no throw', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    } as Response)

    await expect(
      sendEmail({ to: [{ email: 'user@test.com' }], templateId: 1 })
    ).rejects.toThrow('Bad Request')
  })

  it('resolve sem erro quando envio é bem-sucedido', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)

    await expect(
      sendEmail({ to: [{ email: 'user@test.com' }], templateId: TEMPLATES.CONVITE })
    ).resolves.toBeUndefined()
  })
})

describe('TEMPLATES', () => {
  it('exporta os IDs corretos', () => {
    expect(TEMPLATES.BOAS_VINDAS).toBe(2)
    expect(TEMPLATES.ACOMPANHAMENTO_PLANO).toBe(3)
    expect(TEMPLATES.LP_PLANEJAMENTO).toBe(4)
    expect(TEMPLATES.CONVITE).toBe(5)
    expect(TEMPLATES.RESPONSAVEL_OBJETIVO).toBe(7)
  })
})
