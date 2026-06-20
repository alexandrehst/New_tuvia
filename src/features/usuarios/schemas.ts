import { z } from 'zod'

export const papelSchema = z.enum(['owner', 'editor', 'viewer'])
export const notificacaoCampoSchema = z.enum(['plano', 'objetivo', 'resultado'])

export const inviteUserSchema = z.object({
  email: z.string().email(),
  nome: z.string().optional(),
})

export type Papel = z.infer<typeof papelSchema>
export type NotificacaoCampo = z.infer<typeof notificacaoCampoSchema>
export type InviteUserInput = z.infer<typeof inviteUserSchema>
