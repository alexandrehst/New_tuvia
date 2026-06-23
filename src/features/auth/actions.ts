'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { sendEmail, TEMPLATES } from '@/lib/brevo'
import { signInSchema, signUpSchema, resetPasswordSchema, novaSenhaSchema } from './schemas'

export async function signIn(prevState: { error?: string } | null, formData: FormData) {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = signInSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: 'Email ou senha inválidos' }
  }

  redirect('/planos')
}

export async function signUp(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  const raw = {
    nome: formData.get('nome') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = signUpSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error || !data.user) {
    return { error: error?.message ?? 'Erro ao criar conta' }
  }

  // Create a default cliente and user in Prisma
  const cliente = await prisma.cliente.create({
    data: { nome: parsed.data.nome },
  })

  await prisma.user.create({
    data: {
      id: data.user.id,
      clienteId: cliente.id,
      email: parsed.data.email,
      nome: parsed.data.nome,
      statusUser: 'ativo',
    },
  })

  try {
    await sendEmail({
      to: [{ email: parsed.data.email, name: parsed.data.nome }],
      templateId: TEMPLATES.BOAS_VINDAS,
      params: { nome: parsed.data.nome },
    })
  } catch {
    // Non-fatal: continue even if email fails
  }

  // Com confirmação de e-mail exigida, o signUp não devolve sessão: a conta
  // existe mas não está autenticada. Não logamos — pedimos a confirmação.
  if (!data.session) {
    return { success: true }
  }

  redirect('/planos')
}

export async function signOut() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resetPassword(prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const raw = { email: formData.get('email') as string }

  const parsed = resetPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createSupabaseServerClient()
  // O link PKCE traz `?code=` e precisa passar pelo route handler /auth/confirm
  // (exchangeCodeForSession) antes de chegar à página /nova-senha.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?next=/nova-senha`,
  })

  return { success: true }
}

export async function definirNovaSenha(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  const raw = {
    password: formData.get('password') as string,
    confirmar: formData.get('confirmar') as string,
  }

  const parsed = novaSenhaSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    // Mesmo em falha, não deixamos a sessão de recovery viva (ela daria acesso ao app
    // sem a senha ter sido trocada). O usuário deve solicitar um novo link.
    await supabase.auth.signOut()
    return {
      error: 'Não foi possível redefinir a senha. Solicite um novo link de recuperação.',
    }
  }

  // Encerra a sessão de recovery — o usuário não fica logado por um link de recuperação.
  await supabase.auth.signOut()

  redirect('/login')
}
