import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    let users = await prisma.user.findMany()
    
    // Seed default users if empty
    if (users.length === 0) {
      await prisma.user.createMany({
        data: [
          { id: '1', name: 'Admin TI', username: 'admin', role: 'admin', password: '123' },
          { id: '2', name: 'Diretoria Princesa', username: 'diretor', role: 'conselho', password: '123' },
          { id: '3', name: 'Gerente Operacional', username: 'gerente', role: 'gerencia', password: '123' },
        ]
      })
      users = await prisma.user.findMany()
    }

    const projects = await prisma.project.findMany()
    const tasks = await prisma.task.findMany()
    const riskAnalyses = await prisma.riskAnalysis.findMany()

    return NextResponse.json({
      users,
      projects: projects.map(p => ({
        ...p,
        memberIds: JSON.parse(p.memberIds),
        generalKpis: JSON.parse(p.generalKpis),
        yearlyGoals: JSON.parse(p.yearlyGoals)
      })),
      tasks,
      riskAnalyses: riskAnalyses.map(r => ({
        ...r,
        data: JSON.parse(r.data)
      }))
    })
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json({ error: 'Failed to sync data' }, { status: 500 })
  }
}
