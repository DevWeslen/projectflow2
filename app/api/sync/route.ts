import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    let users = await prisma.user.findMany()

    // Seed default users if empty
    if (users.length === 0) {
      await prisma.user.createMany({
        data: [
          { id: 'system', name: 'Sistema', username: 'system', role: 'admin', password: '123' },
          { id: '1', name: 'Admin TI', username: 'admin', role: 'admin', password: '123' },
          { id: '2', name: 'Diretoria', username: 'diretor', role: 'conselho', password: '123' },
          { id: '3', name: 'Gerente Operacional', username: 'gerente', role: 'gerencia', password: '123' },
        ]
      })
      users = await prisma.user.findMany()
    }

    const projects = await prisma.project.findMany()
    const tasks = await prisma.task.findMany()
    const taskDependencies = await prisma.taskDependency.findMany()
    const riskAnalyses = await prisma.riskAnalysis.findMany()

    const safeParse = (str: string | null, fallback: any) => {
      if (!str) return fallback
      try {
        return JSON.parse(str)
      } catch (e) {
        console.error("JSON parse error for:", str, e)
        return fallback
      }
    }

    return NextResponse.json({
      users,
      projects: projects.map(p => ({
        ...p,
        memberIds: safeParse(p.memberIds, []),
        stakeholderIds: safeParse(p.stakeholderIds, []),
        externalStakeholders: safeParse(p.externalStakeholders, []),
        externalStakeholderNames: safeParse(p.externalStakeholderNames, []),
        attachments: safeParse(p.attachments, []),
        generalKpis: safeParse(p.generalKpis, []),
        yearlyGoals: safeParse(p.yearlyGoals, [])
      })),
      tasks: tasks.map(t => ({
        ...t,
        stakeholderIds: safeParse(t.stakeholderIds, []),
        externalStakeholders: safeParse(t.externalStakeholders, []),
        externalStakeholderNames: safeParse(t.externalStakeholderNames, []),
        attachments: safeParse(t.attachments, [])
      })),
      taskDependencies,
      riskAnalyses: riskAnalyses.map(r => ({
        ...r,
        data: safeParse(r.data, {})
      }))
    })
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json({ error: 'Failed to sync data' }, { status: 500 })
  }
}
