'use server'

import { prisma } from '@/lib/prisma'
import { requireUser, assertPodeMutarPlano } from '@/features/auth/guards'
import { createObjetivoSchema, updateObjetivoSchema, type CreateObjetivoInput, type UpdateObjetivoInput } from './schemas'

export async function createObjetivo(data: CreateObjetivoInput) {
  const parsed = createObjetivoSchema.parse(data)

  const user = await requireUser()
  // Criar objetivo = edição estrutural (editor + somente estado `edicao`); guard faz tenant→papel→estado.
  await assertPodeMutarPlano(parsed.planoId, user, 'editarEstrutura')

  const objetivo = await prisma.objetivo.create({
    data: {
      planoId: parsed.planoId,
      titulo: parsed.titulo,
      descricao: parsed.descricao,
      numero: parsed.numero,
      objetivoVinculadoId: parsed.objetivoVinculadoId,
    },
  })

  if (parsed.responsaveisIds && parsed.responsaveisIds.length > 0) {
    await prisma.objetivoResponsavel.createMany({
      data: parsed.responsaveisIds.map((userId) => ({
        objetivoId: objetivo.id,
        userId,
      })),
    })
  }

  return objetivo
}

export async function updateObjetivo(id: string, data: UpdateObjetivoInput) {
  const parsed = updateObjetivoSchema.parse(data)

  const atual = await prisma.objetivo.findUniqueOrThrow({
    where: { id },
    select: { planoId: true },
  })
  const user = await requireUser()
  await assertPodeMutarPlano(atual.planoId, user, 'editarEstrutura')

  const objetivo = await prisma.objetivo.update({
    where: { id },
    data: {
      titulo: parsed.titulo,
      descricao: parsed.descricao,
      numero: parsed.numero,
    },
  })

  // Reconcilia responsáveis: remove os atuais e recria a partir de responsaveisIds
  await prisma.objetivoResponsavel.deleteMany({ where: { objetivoId: id } })
  if (parsed.responsaveisIds && parsed.responsaveisIds.length > 0) {
    await prisma.objetivoResponsavel.createMany({
      data: parsed.responsaveisIds.map((userId) => ({ objetivoId: id, userId })),
    })
  }

  return objetivo
}

export async function deleteObjetivo(id: string) {
  const atual = await prisma.objetivo.findUniqueOrThrow({
    where: { id },
    select: { planoId: true },
  })
  const user = await requireUser()
  await assertPodeMutarPlano(atual.planoId, user, 'editarEstrutura')

  await prisma.objetivo.delete({ where: { id } })
}
