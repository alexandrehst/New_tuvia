import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export const signUpSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export const inviteUserSchema = z.object({
  email: z.string().email('Email inválido'),
  nome: z.string().min(2),
})

export const novaSenhaSchema = z
  .object({
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    confirmar: z.string(),
  })
  .refine((data) => data.password === data.confirmar, {
    message: 'As senhas não conferem',
    path: ['confirmar'],
  })

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type InviteUserInput = z.infer<typeof inviteUserSchema>
export type NovaSenhaInput = z.infer<typeof novaSenhaSchema>
