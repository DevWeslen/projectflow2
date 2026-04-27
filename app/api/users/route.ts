import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany()
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userData = await request.json()
    const user = await prisma.user.create({
      data: {
        id: userData.id,
        name: userData.name,
        username: userData.username,
        role: userData.role,
        password: userData.password || '123'
      }
    })
    return NextResponse.json(user)
  } catch (error: any) {
    console.error('ERROR CREATING USER:', error)
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...userData } = await request.json()
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: userData.name,
        username: userData.username,
        role: userData.role,
        password: userData.password
      }
    })
    return NextResponse.json(user)
  } catch (error: any) {
    console.error('ERROR UPDATING USER:', error)
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.user.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('ERROR DELETING USER:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 })
  }
}
