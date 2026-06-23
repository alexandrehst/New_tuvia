'use server'

import { prisma } from '@/lib/prisma'
import { sendEmail, TEMPLATES } from '@/lib/brevo'
import { requireUser, requireAdmin, assertMesmoTenant, assertPodeMutarPlano } from '@/features/auth/guards'
import { papelSchema, notificacaoCampoSchema, inviteUserSchema, type Papel, type NotificacaoCampo, type InviteUserInput } from './schemas'

const CAMPO_NOTIFICACAO: Record<NotificacaoCampo, 'atualizacaoEmailPlano' | 'atualizacaoEmailObjetivo' | 'atualizacaoEmailResultado'> = {
  plano: 'atualizacaoEmailPlano',
  objetivo: 'atualizacaoEmailObjetivo',
  resultado: 'atualizacaoEmailResultado',
}

/** Atualiza o papel de um vínculo plano-usuário (gerir plano = owner; admin = owner implícito). */
export async function updatePapel(planoUsuarioId: string, papel: Papel) {
  const parsed = papelSchema.parse(papel)

  const vinculo = await prisma.planoUsuario.findUnique({
    where: { id: planoUsuarioId },
    select: { planoId: true },
  })
  if (!vinculo) throw new Error('Recurso não encontrado')
  const user = await requireUser()
  await assertPodeMutarPlano(vinculo.planoId, user, 'gerirPlano')

  await prisma.planoUsuario.update({
    where: { id: planoUsuarioId },
    data: { papel: parsed },
  })
}

/** Atualiza uma preferência de notificação por e-mail de um membro (admin do mesmo tenant). */
export async function updateNotificacao(userId: string, campo: NotificacaoCampo, valor: boolean) {
  const admin = await requireAdmin()
  const parsed = notificacaoCampoSchema.parse(campo)

  const alvo = await prisma.user.findUnique({ where: { id: userId }, select: { clienteId: true } })
  assertMesmoTenant(alvo?.clienteId, admin.clienteId)

  await prisma.user.update({
    where: { id: userId },
    data: { [CAMPO_NOTIFICACAO[parsed]]: valor },
  })
}

/** Remove um usuário de um plano (deleta o vínculo, não o usuário) — gerir plano = owner. */
export async function removerMembroDoPlano(planoUsuarioId: string) {
  const vinculo = await prisma.planoUsuario.findUnique({
    where: { id: planoUsuarioId },
    select: { planoId: true },
  })
  if (!vinculo) throw new Error('Recurso não encontrado')
  const user = await requireUser()
  await assertPodeMutarPlano(vinculo.planoId, user, 'gerirPlano')

  await prisma.planoUsuario.delete({ where: { id: planoUsuarioId } })
}

type InviteResult = { ok: true; emailEnviado: boolean } | { ok: false; erro: string }

/** Convida um novo membro: cria o usuário (pendente) e dispara o e-mail de convite (não-fatal).
 *  O tenant vem da sessão do admin — não confia em clienteId vindo do cliente. */
export async function inviteUser(data: InviteUserInput): Promise<InviteResult> {
  const admin = await requireAdmin()

  const parsed = inviteUserSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false, erro: 'E-mail inválido' }
  }

  const { email } = parsed.data
  const nome = parsed.data.nome?.trim() || email.split('@')[0]

  const existente = await prisma.user.findUnique({ where: { email } })
  if (existente) {
    return { ok: false, erro: 'Este e-mail já é membro' }
  }

  await prisma.user.create({
    data: { clienteId: admin.clienteId, email, nome, statusUser: 'pendente', temConvite: true },
  })

  let emailEnviado = true
  try {
    await sendEmail({
      to: [{ email, name: nome }],
      templateId: TEMPLATES.CONVITE,
      params: { nome },
    })
  } catch {
    emailEnviado = false
  }

  return { ok: true, emailEnviado }
}
