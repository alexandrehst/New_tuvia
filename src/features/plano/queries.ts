import { prisma } from '@/lib/prisma'

export async function getPlanos(clienteId: string) {
  return prisma.plano.findMany({
    where: { clienteId },
    include: {
      _count: { select: { objetivos: true } },
      planosFilhos: {
        include: {
          _count: { select: { objetivos: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getPlanoWithObjetivos(planoId: string) {
  return prisma.plano.findUnique({
    where: { id: planoId },
    include: {
      objetivos: {
        include: {
          resultadosChave: {
            include: {
              linhaTendencia: true,
            },
          },
          responsaveis: {
            include: { user: true },
          },
        },
        orderBy: { numero: 'asc' },
      },
      planosFilhos: {
        include: {
          objetivos: {
            include: {
              resultadosChave: {
                include: { linhaTendencia: true },
              },
            },
            orderBy: { numero: 'asc' },
          },
        },
      },
    },
  })
}
