
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Testing project creation...')
  try {
    const project = await prisma.project.create({
      data: {
        id: 'test-project-' + Math.random().toString(36).substring(7),
        name: 'Test Project',
        methodology: 'kanban',
        color: '#ff0000',
        category: 'test',
        ownerId: '1', // Admin
        memberIds: JSON.stringify(['1']),
        generalKpis: JSON.stringify([]),
        yearlyGoals: JSON.stringify([]),
      }
    })
    console.log('Project created successfully:', project.id)
    
    console.log('Testing task creation...')
    const task = await prisma.task.create({
      data: {
        id: 'test-task-' + Math.random().toString(36).substring(7),
        projectId: project.id,
        title: 'Test Task',
        status: 'todo',
        progress: 0,
        order: 0,
        stakeholderIds: JSON.stringify([]),
        attachments: JSON.stringify([]),
      }
    })
    console.log('Task created successfully:', task.id)
    
    // Clean up
    await prisma.task.delete({ where: { id: task.id } })
    await prisma.project.delete({ where: { id: project.id } })
    console.log('Cleanup successful')
    
  } catch (error) {
    console.error('Error during creation test:')
    console.error(error)
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
