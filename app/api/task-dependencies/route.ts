import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const dependency = await prisma.taskDependency.create({
      data: {
        id: data.id,
        predecessorId: data.predecessorId,
        successorId: data.successorId,
        type: data.type,
      }
    })
    return NextResponse.json(dependency)
  } catch (error: any) {
    console.error('Task dependency POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const predecessorId = searchParams.get('predecessorId')
    const successorId = searchParams.get('successorId')
    
    if (!predecessorId || !successorId) {
      return NextResponse.json({ error: 'Missing IDs' }, { status: 400 })
    }

    await prisma.taskDependency.delete({
      where: {
        predecessorId_successorId: {
          predecessorId,
          successorId
        }
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Task dependency DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
