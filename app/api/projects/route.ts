import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const projects = await prisma.project.findMany()
    return NextResponse.json(projects.map(p => ({
      ...p,
      memberIds: JSON.parse(p.memberIds),
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
        generalKpis: JSON.stringify(data.generalKpis || []),
        yearlyGoals: JSON.stringify(data.yearlyGoals || []),
        deadline: data.deadline ? new Date(data.deadline) : null,
        sprintDuration: data.sprintDuration,
        totalSprints: data.totalSprints
      }
    })
    return NextResponse.json({
      ...project,
      memberIds: JSON.parse(project.memberIds),
      generalKpis: JSON.parse(project.generalKpis),
      yearlyGoals: JSON.parse(project.yearlyGoals)
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { id, ...updates } = data

    const updateData: any = { ...updates }
    if (updates.memberIds) updateData.memberIds = JSON.stringify(updates.memberIds)
    if (updates.generalKpis) updateData.generalKpis = JSON.stringify(updates.generalKpis)
    if (updates.yearlyGoals) updateData.yearlyGoals = JSON.stringify(updates.yearlyGoals)
    if (updates.deadline) updateData.deadline = new Date(updates.deadline)

    const project = await prisma.project.update({
      where: { id },
      data: updateData
    })
    return NextResponse.json({
      ...project,
      memberIds: JSON.parse(project.memberIds),
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

    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
