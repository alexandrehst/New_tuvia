import { prisma } from '@/lib/prisma'

export async function getSidebarData(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      nome: true,
      email: true,
      clienteId: true,
      cliente: { select: { nome: true } },
    },
  })
  if (!user) return null

  const planos = await prisma.plano.findMany({
    where: { clienteId: user.clienteId, planoPaiId: null },
    select: { id: true, titulo: true },
    orderBy: { createdAt: 'desc' },
  })

  return { user, planos }
}

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

export async function getPlanoWithObjetivos(planoId: string, clienteId: string) {
  return prisma.plano.findFirst({
    where: { id: planoId, clienteId },
    include: {
      planoPai: { select: { id: true, titulo: true } },
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
