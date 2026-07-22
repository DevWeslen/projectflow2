import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail, getProjectEmailTemplate } from '@/lib/email'

export async function GET() {
  try {
    const projects = await prisma.project.findMany()
    return NextResponse.json(projects.map(p => ({
      ...p,
      memberIds: JSON.parse(p.memberIds),
      stakeholderIds: p.stakeholderIds ? JSON.parse(p.stakeholderIds) : [],
      externalStakeholders: p.externalStakeholders ? JSON.parse(p.externalStakeholders) : [],
      attachments: p.attachments ? JSON.parse(p.attachments) : [],
      generalKpis: JSON.parse(p.generalKpis),
      yearlyGoals: JSON.parse(p.yearlyGoals)
    })))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const project = await prisma.project.create({
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        methodology: data.methodology,
        color: data.color,
        category: data.category,
        ownerId: data.ownerId,
        memberIds: JSON.stringify(data.memberIds || []),
        stakeholderIds: JSON.stringify(data.stakeholderIds || []),
        externalStakeholders: JSON.stringify(data.externalStakeholders || []),
        attachments: JSON.stringify(data.attachments || []),
        generalKpis: JSON.stringify(data.generalKpis || []),
        yearlyGoals: JSON.stringify(data.yearlyGoals || []),
        deadline: data.deadline ? new Date(data.deadline) : null,
        actualStartDate: data.actualStartDate ? new Date(data.actualStartDate) : null,
        actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : null,
        sprintDuration: data.sprintDuration,
        totalSprints: data.totalSprints,
        status: data.status || 'active'
      }
    })

    // Disparo síncrono de e-mail para garantir envio em ambientes serverless (Vercel)
    try {
      const userIds = [
        data.ownerId,
        ...(data.memberIds || []),
        ...(data.stakeholderIds || [])
      ].filter(Boolean); // remove nulls/undefined

      const uniqueUserIds = [...new Set(userIds)];

      if (uniqueUserIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: uniqueUserIds } },
          select: { username: true } // username atua como e-mail
        });

        const internalEmails = users
          .map((u: { username: string }) => u.username)
          .filter((email) => email && email.includes('@'));

        // Collect external stakeholder emails
        const externalEmails = (data.externalStakeholders || [])
          .map((es: { email: string }) => es.email)
          .filter((email: string) => email && email.includes('@'));

        const allEmails = [...new Set([...internalEmails, ...externalEmails])];

        if (allEmails.length > 0) {
          await sendEmail({
            to: allEmails,
            subject: `Novo Projeto Criado: ${project.name}`,
            html: getProjectEmailTemplate(project)
          });
        }
      } else {
        // Still send to external stakeholders even if no internal ones
        const externalEmails = (data.externalStakeholders || [])
          .map((es: { email: string }) => es.email)
          .filter((email: string) => email && email.includes('@'));
        if (externalEmails.length > 0) {
          await sendEmail({
            to: externalEmails,
            subject: `Novo Projeto Criado: ${project.name}`,
            html: getProjectEmailTemplate(project)
          });
        }
      }
    } catch (emailError) {
      console.error('[Email] Falha ao enviar e-mail de novo projeto:', emailError);
    }

    return NextResponse.json({
      ...project,
      memberIds: JSON.parse(project.memberIds),
      stakeholderIds: JSON.parse(project.stakeholderIds || '[]'),
      externalStakeholders: JSON.parse(project.externalStakeholders || '[]'),
      attachments: JSON.parse(project.attachments || '[]'),
      generalKpis: JSON.parse(project.generalKpis),
      yearlyGoals: JSON.parse(project.yearlyGoals)
    })
  } catch (error: any) {
    console.error('ERROR CREATING PROJECT:', error)
    const errorMessage = error.message || 'Failed to create project'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { id, ...updates } = data

    const updateData: any = { ...updates }
    if (updates.memberIds) updateData.memberIds = JSON.stringify(updates.memberIds)
    if (updates.stakeholderIds) updateData.stakeholderIds = JSON.stringify(updates.stakeholderIds)
    if (updates.externalStakeholders) updateData.externalStakeholders = JSON.stringify(updates.externalStakeholders)
    if (updates.attachments) updateData.attachments = JSON.stringify(updates.attachments)
    if (updates.generalKpis) updateData.generalKpis = JSON.stringify(updates.generalKpis)
    if (updates.yearlyGoals) updateData.yearlyGoals = JSON.stringify(updates.yearlyGoals)
    if (updates.deadline) updateData.deadline = new Date(updates.deadline)
    if (updates.actualStartDate) updateData.actualStartDate = new Date(updates.actualStartDate)
    if (updates.actualEndDate) updateData.actualEndDate = new Date(updates.actualEndDate)

    const project = await prisma.project.update({
      where: { id },
      data: updateData
    })
    return NextResponse.json({
      ...project,
      memberIds: JSON.parse(project.memberIds),
      stakeholderIds: JSON.parse(project.stakeholderIds || '[]'),
      externalStakeholders: JSON.parse(project.externalStakeholders || '[]'),
      attachments: JSON.parse(project.attachments || '[]'),
      generalKpis: JSON.parse(project.generalKpis),
      yearlyGoals: JSON.parse(project.yearlyGoals)
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    // Use deleteMany to avoid throwing if the record doesn't exist
    await prisma.project.deleteMany({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('ERROR DELETING PROJECT:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
