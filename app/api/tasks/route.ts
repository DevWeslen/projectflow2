import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail, getTaskEmailTemplate } from '@/lib/email'

export async function GET() {
  try {
    const tasks = await prisma.task.findMany()
    return NextResponse.json(tasks.map(t => ({
      ...t,
      stakeholderIds: t.stakeholderIds ? JSON.parse(t.stakeholderIds) : [],
      externalStakeholders: t.externalStakeholders ? JSON.parse(t.externalStakeholders) : [],
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
        externalStakeholders: JSON.stringify(data.externalStakeholders || []),
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

    // Disparo síncrono de e-mail para garantir envio em ambientes serverless (Vercel)
    try {
      const userIds = [
        data.ownerId,
        ...(data.stakeholderIds || [])
      ].filter(Boolean)

      const uniqueUserIds = [...new Set(userIds)]

      if (uniqueUserIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: uniqueUserIds } },
          select: { username: true }
        })

        const internalEmails = users
          .map((u: { username: string }) => u.username)
          .filter((email) => email && email.includes('@'))

        // Collect external stakeholder emails
        const externalEmails = (data.externalStakeholders || [])
          .map((es: { email: string }) => es.email)
          .filter((email: string) => email && email.includes('@'))

        const allEmails = [...new Set([...internalEmails, ...externalEmails])]

        if (allEmails.length > 0) {
          const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            select: { name: true }
          })
          const projectName = project ? project.name : 'Sem Projeto'

          await sendEmail({
            to: allEmails,
            subject: `Nova Tarefa Atribuída: ${task.title}`,
            html: getTaskEmailTemplate(task, projectName)
          })
        }
      } else {
        // Still send to external stakeholders even if no internal ones
        const externalEmails = (data.externalStakeholders || [])
          .map((es: { email: string }) => es.email)
          .filter((email: string) => email && email.includes('@'))
        if (externalEmails.length > 0) {
          const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            select: { name: true }
          })
          const projectName = project ? project.name : 'Sem Projeto'
          await sendEmail({
            to: externalEmails,
            subject: `Nova Tarefa Atribuída: ${task.title}`,
            html: getTaskEmailTemplate(task, projectName)
          })
        }
      }
    } catch (emailError) {
      console.error('[Email] Falha ao enviar e-mail de nova tarefa:', emailError)
    }

    return NextResponse.json({
      ...task,
      stakeholderIds: JSON.parse(task.stakeholderIds || '[]'),
      externalStakeholders: JSON.parse(task.externalStakeholders || '[]'),
      externalStakeholderNames: JSON.parse(task.externalStakeholderNames || '[]'),
      attachments: JSON.parse(task.attachments || '[]')
    })
  } catch (error: any) {
    console.error('ERROR CREATING TASK:', error)
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
    if (updates.externalStakeholders) updateData.externalStakeholders = JSON.stringify(updates.externalStakeholders)
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
      externalStakeholders: JSON.parse(task.externalStakeholders || '[]'),
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
