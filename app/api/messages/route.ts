import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    
    const message = await prisma.projectMessage.create({
      data: {
        id: data.id,
        projectId: data.projectId,
        userId: data.userId,
        userName: data.userName,
        content: data.content,
        attachments: data.attachments ? JSON.stringify(data.attachments) : null,
        createdAt: new Date(data.createdAt),
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Failed to create message:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
