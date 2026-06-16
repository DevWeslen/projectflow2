import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const tasks = await prisma.task.findMany()
    return NextResponse.json(tasks.map(t => ({
      ...t,
      stakeholderIds: t.stakeholderIds ? JSON.parse(t.stakeholderIds) : [],
      externalStakeholderNames: t.externalStakeholderNames ? JSON.parse(t.externalStakeholderNames) : [],
      attachments: t.attachments ? JSON.parse(t.attachments) : []
    })))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const task = await prisma.task.create({
      data: {
        id: data.id,
        projectId: data.projectId,
        parentId: data.parentId,
        ownerId: data.ownerId,
        stakeholderIds: JSON.stringify(data.stakeholderIds || []),
        externalStakeholderNames: JSON.stringify(data.externalStakeholderNames || []),
        attachments: JSON.stringify(data.attachments || []),
        title: data.title,
        description: data.description,
        status: data.status,
        progress: data.progress,
        order: data.order,
        deadline: data.deadline ? new Date(data.deadline) : null,
        actualStartDate: data.actualStartDate ? new Date(data.actualStartDate) : null,
        actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : null,
        sprint: data.sprint
      }
    })
    return NextResponse.json({
      ...task,
      stakeholderIds: JSON.parse(task.stakeholderIds || '[]'),
      externalStakeholderNames: JSON.parse(task.externalStakeholderNames || '[]'),
      attachments: JSON.parse(task.attachments || '[]')
    })
  } catch (error: any) {
    console.error('ERROR CREATING TASK:', error)
    // Return more specific error if possible
    const errorMessage = error.message || 'Failed to create task'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { id, ...updates } = data

    const updateData: any = { ...updates }
    if (updates.stakeholderIds) updateData.stakeholderIds = JSON.stringify(updates.stakeholderIds)
    if (updates.externalStakeholderNames) updateData.externalStakeholderNames = JSON.stringify(updates.externalStakeholderNames)
    if (updates.attachments) updateData.attachments = JSON.stringify(updates.attachments)
    if (updates.deadline) updateData.deadline = new Date(updates.deadline)
    if (updates.actualStartDate) updateData.actualStartDate = new Date(updates.actualStartDate)
    if (updates.actualEndDate) updateData.actualEndDate = new Date(updates.actualEndDate)

    const task = await prisma.task.update({
      where: { id },
      data: updateData
    })
    return NextResponse.json({
      ...task,
      stakeholderIds: JSON.parse(task.stakeholderIds || '[]'),
      externalStakeholderNames: JSON.parse(task.externalStakeholderNames || '[]'),
      attachments: JSON.parse(task.attachments || '[]')
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    await prisma.task.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
