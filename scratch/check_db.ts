
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const userCount = await prisma.user.count()
  const projectCount = await prisma.project.count()
  const taskCount = await prisma.task.count()
  console.log(`Total users in DB: ${userCount}`)
  console.log(`Total projects in DB: ${projectCount}`)
  console.log(`Total tasks in DB: ${taskCount}`)
  
  if (userCount > 0) {
    const users = await prisma.user.findMany()
    console.log('Users in DB:', users.map(u => ({ id: u.id, username: u.username })))
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
