import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const items = await prisma.riskAnalysis.findMany()
    return NextResponse.json(items.map(i => ({
      ...i,
      data: JSON.parse(i.data)
    })))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch risk analyses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const reqData = await request.json()
    const item = await prisma.riskAnalysis.create({
      data: {
        id: reqData.id,
        projectId: reqData.projectId,
        type: reqData.type,
        title: reqData.title,
        data: JSON.stringify(reqData.data || {}),
      }
    })
    return NextResponse.json({
      ...item,
      data: JSON.parse(item.data)
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create risk analysis' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const reqData = await request.json()
    const { id, ...updates } = reqData

    const updateData: any = { ...updates }
    if (updates.data) updateData.data = JSON.stringify(updates.data)

    const item = await prisma.riskAnalysis.update({
      where: { id },
      data: updateData
    })
    return NextResponse.json({
      ...item,
      data: JSON.parse(item.data)
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update risk analysis' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    await prisma.riskAnalysis.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete risk analysis' }, { status: 500 })
  }
}
