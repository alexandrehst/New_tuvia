import { prisma } from '@/lib/prisma'

/** Lista os usuários de um Cliente (para seletor de responsáveis, gestão de membros). */
export async function getClienteUsuarios(clienteId: string) {
  return prisma.user.findMany({
    where: { clienteId },
    select: { id: true, nome: true, email: true },
    orderBy: { nome: 'asc' },
  })
}

/** Lista os membros do Cliente com papéis por plano e preferências de notificação (gestão de membros). */
export async function getMembros(clienteId: string) {
  return prisma.user.findMany({
    where: { clienteId },
    select: {
      id: true,
      nome: true,
      email: true,
      tipoUser: true,
      statusUser: true,
      atualizacaoEmailPlano: true,
      atualizacaoEmailObjetivo: true,
      atualizacaoEmailResultado: true,
      planosUsuario: {
        select: {
          id: true,
          papel: true,
          plano: { select: { id: true, titulo: true } },
        },
      },
    },
    orderBy: { nome: 'asc' },
  })
}
