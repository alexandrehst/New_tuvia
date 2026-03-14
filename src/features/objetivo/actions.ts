'use server'

import { prisma } from '@/lib/prisma'
import { createObjetivoSchema, type CreateObjetivoInput } from './schemas'

export async function createObjetivo(data: CreateObjetivoInput) {
  const parsed = createObjetivoSchema.parse(data)

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

export async function deleteObjetivo(id: string) {
  await prisma.objetivo.delete({ where: { id } })
}
