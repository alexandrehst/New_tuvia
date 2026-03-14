import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const cliente = await prisma.cliente.upsert({
    where: { id: 'seed-cliente-1' },
    update: {},
    create: {
      id: 'seed-cliente-1',
      nome: 'Empresa Demo',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      clienteId: cliente.id,
      email: 'admin@demo.com',
      nome: 'Admin Demo',
      tipoUser: 'admin',
      statusUser: 'ativo',
    },
  })

  console.log({ cliente, user })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
