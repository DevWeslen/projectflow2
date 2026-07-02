'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Task, Methodology, TaskStatus, RiskAnalysis, User, UserRole } from './types'
import { autoStatusFromProgress } from './types'

interface ProjectStore {
  projects: Project[]
  tasks: Task[]
  riskAnalyses: RiskAnalysis[]
  selectedProjectId: string | null

  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>
  updateProject: (id: string, updates: Partial<Project>) => Promise<boolean>
  deleteProject: (id: string) => void
  selectProject: (id: string | null) => void

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<string | null>
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>
  deleteTask: (id: string) => void

  addRiskAnalysis: (analysis: Omit<RiskAnalysis, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateRiskAnalysis: (id: string, updates: Partial<RiskAnalysis>) => void
  deleteRiskAnalysis: (id: string) => void

  getProjectTasks: (projectId: string) => Task[]
  getChildTasks: (parentId: string) => Task[]
  getRootTasks: (projectId: string) => Task[]
  calculateTaskProgress: (taskId: string) => number
  calculateProjectProgress: (projectId: string) => number
  seedExamples: () => void

  activeView: 'main' | 'consolidated' | 'users'
  setActiveView: (view: 'main' | 'consolidated' | 'users') => void

  user: User | null
  users: User[]
  login: (username: string, password: string) => boolean
  logout: () => void
  addUser: (userData: Omit<User, 'id'>) => Promise<boolean>
  updateUser: (id: string, updates: Partial<User>) => Promise<boolean>
  deleteUser: (id: string) => Promise<boolean>
  initStore: () => Promise<void>
}

const backgroundSync = async (url: string, method: string, data?: any) => {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error(`Sync error (${method} ${url}):`, errorData.error || res.statusText)
      return false
    }
    return true
  } catch (err) {
    console.error(`Sync network error (${method} ${url}):`, err)
    return false
  }
}

const generateId = () => Math.random().toString(36).substring(2, 15)

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      tasks: [],
      riskAnalyses: [],
      selectedProjectId: null,
      activeView: 'main',
      user: null,
      initStore: async () => {
        try {
          const res = await fetch('/api/sync')
          if (res.ok) {
            const data = await res.json()
            set((state) => ({
              ...state,
              projects: (data.projects && data.projects.length > 0) ? data.projects : state.projects,
              tasks: (data.tasks && data.tasks.length > 0) ? data.tasks : state.tasks,
              users: data.users && data.users.length > 0 ? data.users : state.users,
              riskAnalyses: (data.riskAnalyses && data.riskAnalyses.length > 0) ? data.riskAnalyses : state.riskAnalyses
            }))
          }
        } catch (error) {
          console.error("Failed to sync store with backend", error)
        }
      },

      users: [
        { id: '1', name: 'Admin TI', username: 'admin', role: 'admin' },
        { id: '2', name: 'Diretoria Princesa', username: 'diretor', role: 'conselho' },
        { id: '3', name: 'Gerente Operacional', username: 'gerente', role: 'gerencia' },
      ],

      login: (username, password) => {
        const user = get().users.find((u) => u.username === username)
        if (user && (user.password === password || (!user.password && password === '123'))) {
          set({ user })
          return true
        }
        return false
      },

      logout: () => {
        set({ user: null, selectedProjectId: null })
      },

      addUser: async (userData) => {
        const id = generateId()
        const user = { ...userData, id }
        set((state) => ({
          users: [...state.users, user]
        }))
        const success = await backgroundSync('/api/users', 'POST', user)
        if (!success) {
          set((state) => ({ users: state.users.filter(u => u.id !== id) }))
        }
        return success
      },

      updateUser: async (id, updates) => {
        const oldUsers = [...get().users]
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u))
        }))
        const success = await backgroundSync('/api/users', 'PUT', { id, ...updates })
        if (!success) {
          set({ users: oldUsers })
        }
        return success
      },

      deleteUser: async (id) => {
        const oldUsers = [...get().users]
        set((state) => ({
          users: state.users.filter((u) => u.id !== id)
        }))
        const success = await backgroundSync(`/api/users?id=${id}`, 'DELETE')
        if (!success) {
          set({ users: oldUsers })
        }
        return success
      },

      setActiveView: (view) => {
        set({ activeView: view })
      },

      selectProject: (id) => {
        set({ selectedProjectId: id, activeView: id ? 'main' : get().activeView })
      },

      addProject: async (projectData) => {
        const id = generateId()
        const now = new Date()

        const startYear = now.getFullYear()
        const endYear = projectData.deadline
          ? new Date(projectData.deadline).getFullYear()
          : startYear

        const baseKpis = projectData.generalKpis || []
        const numYears = Math.max(1, endYear - startYear + 1)

        const autoYearlyGoals = Array.from({ length: numYears }, (_, i) => {
          const year = startYear + i
          const isFirst = i === 0
          const isLast = i === numYears - 1
          const startDate = isFirst ? new Date(now) : new Date(year, 0, 1)
          const endDate = isLast && projectData.deadline
            ? new Date(projectData.deadline)
            : new Date(year, 11, 31)

          const yearKpis = baseKpis.map(k => ({
            ...k,
            current: 0,
            target: k.aggregation === 'sum'
              ? Math.round((k.target / numYears) * 100) / 100
              : k.target
          }))

          return { id: generateId(), year, startDate, endDate, kpis: yearKpis }
        })

        const project: Project = {
          ...projectData,
          id,
          createdAt: now,
          updatedAt: now,
          category: projectData.category || 'geral',
          generalKpis: baseKpis,
          yearlyGoals: projectData.yearlyGoals || autoYearlyGoals,
          ownerId: projectData.ownerId || get().user?.id || 'system',
          memberIds: projectData.memberIds || [get().user?.id || 'system'],
          stakeholderIds: projectData.stakeholderIds || [],
          attachments: projectData.attachments || [],
          status: 'active'
        }

        set((state) => ({
          projects: [...state.projects, project],
          selectedProjectId: id
        }))
        
        const success = await backgroundSync('/api/projects', 'POST', project)
        if (!success) {
          // Rollback on failure? For now just return null
          set((state) => ({
            projects: state.projects.filter(p => p.id !== id),
            selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId
          }))
          return null
        }
        return id
      },

      updateProject: async (id, updates) => {
        const oldProject = get().projects.find(p => p.id === id)
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          )
        }))
        const success = await backgroundSync('/api/projects', 'PUT', { id, ...updates })
        if (!success && oldProject) {
          set((state) => ({
            projects: state.projects.map(p => p.id === id ? oldProject : p)
          }))
        }
        return success
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          tasks: state.tasks.filter((t) => t.projectId !== id),
          riskAnalyses: state.riskAnalyses.filter((r) => r.projectId !== id),
          selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId
        }))
        backgroundSync(`/api/projects?id=${id}`, 'DELETE')
      },

      addTask: async (taskData) => {
        const id = generateId()
        const now = new Date()
        const state = get()
        const siblingTasks = taskData.parentId
          ? state.tasks.filter(t => t.parentId === taskData.parentId)
          : state.tasks.filter(t => t.projectId === taskData.projectId && t.parentId === null)

        const task: Task = {
          stakeholderIds: [],
          attachments: [],
          ...taskData,
          id,
          createdAt: now,
          updatedAt: now,
          order: siblingTasks.length
        }
        set((state) => ({ tasks: [...state.tasks, task] }))
        const success = await backgroundSync('/api/tasks', 'POST', task)
        if (!success) {
          set((state) => ({ tasks: state.tasks.filter(t => t.id !== id) }))
          return null
        }
        return id
      },

      updateTask: async (id, updates) => {
        const oldTasks = [...get().tasks]
        set((state) => {
          const tasks = [...state.tasks]
          const taskIndex = tasks.findIndex(t => t.id === id)
          if (taskIndex === -1) return { tasks }

          const task = tasks[taskIndex]
          const project = state.projects.find(p => p.id === task.projectId)
          const isKanban = project?.methodology === 'kanban'

          const updatedTask = { ...task, ...updates, updatedAt: new Date() }

          // Auto-mark actual end date if progress becomes 100
          if (updates.progress === 100 && !task.actualEndDate) {
            updatedTask.actualEndDate = new Date()
          }
          if (updates.progress !== undefined && updates.progress > 0 && !task.actualStartDate) {
            updatedTask.actualStartDate = new Date()
          }

          if (updates.progress !== undefined && !updates.status && isKanban) {
            updatedTask.status = autoStatusFromProgress(updatedTask.progress)
          }

          tasks[taskIndex] = updatedTask

          let currentParentId = updatedTask.parentId
          while (currentParentId) {
            const parentIndex = tasks.findIndex(t => t.id === currentParentId)
            if (parentIndex === -1) break

            const parent = tasks[parentIndex]
            const children = tasks.filter(t => t.parentId === currentParentId)

            const latestChildProgresses = children.map(c => {
              const found = tasks.find(t => t.id === c.id)
              return found ? found.progress : c.progress
            })

            const totalProgress = latestChildProgresses.reduce((acc, p) => acc + p, 0)
            const newProgress = latestChildProgresses.length > 0
              ? totalProgress / latestChildProgresses.length
              : 0

            const parentUpdate: Partial<Task> = { progress: newProgress, updatedAt: new Date() }
            if (isKanban) {
              parentUpdate.status = autoStatusFromProgress(newProgress)
            }

            tasks[parentIndex] = { ...parent, ...parentUpdate }
            currentParentId = parent.parentId
          }

          return { tasks }
        })
        const success = await backgroundSync('/api/tasks', 'PUT', { id, ...updates })
        if (!success) {
          set({ tasks: oldTasks })
        }
        return success
      },

      deleteTask: (id) => {
        const state = get()
        const deleteRecursively = (taskId: string): string[] => {
          const children = state.tasks.filter(t => t.parentId === taskId)
          const childIds = children.flatMap(c => deleteRecursively(c.id))
          return [taskId, ...childIds]
        }
        const idsToDelete = deleteRecursively(id)
        set((state) => ({
          tasks: state.tasks.filter((t) => !idsToDelete.includes(t.id))
        }))
        idsToDelete.forEach(toDelete => backgroundSync(`/api/tasks?id=${toDelete}`, 'DELETE'))
      },

      addRiskAnalysis: (analysisData) => {
        const id = generateId()
        const now = new Date()
        const analysis: RiskAnalysis = {
          ...analysisData,
          id,
          createdAt: now,
          updatedAt: now
        }
        set((state) => ({ riskAnalyses: [...state.riskAnalyses, analysis] }))
        backgroundSync('/api/risk-analyses', 'POST', analysis)
        return id
      },

      updateRiskAnalysis: (id, updates) => {
        set((state) => ({
          riskAnalyses: state.riskAnalyses.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
          )
        }))
        backgroundSync('/api/risk-analyses', 'PUT', { id, ...updates })
      },

      deleteRiskAnalysis: (id) => {
        set((state) => ({
          riskAnalyses: state.riskAnalyses.filter((r) => r.id !== id)
        }))
        backgroundSync(`/api/risk-analyses?id=${id}`, 'DELETE')
      },

      getProjectTasks: (projectId) => {
        return get().tasks.filter((t) => t.projectId === projectId)
      },

      getChildTasks: (parentId) => {
        return get().tasks
          .filter((t) => t.parentId === parentId)
          .sort((a, b) => a.order - b.order)
      },

      getRootTasks: (projectId) => {
        return get().tasks
          .filter((t) => t.projectId === projectId && t.parentId === null)
          .sort((a, b) => a.order - b.order)
      },

      calculateTaskProgress: (taskId) => {
        const state = get()
        const children = state.tasks.filter(t => t.parentId === taskId)

        if (children.length === 0) {
          const task = state.tasks.find(t => t.id === taskId)
          return task?.progress ?? 0
        }

        const childProgresses = children.map(c => get().calculateTaskProgress(c.id))
        const totalProgress = childProgresses.reduce((acc, p) => acc + p, 0)
        return childProgresses.length > 0 ? totalProgress / childProgresses.length : 0
      },

      calculateProjectProgress: (projectId) => {
        const state = get()
        const rootTasks = state.tasks.filter(t => t.projectId === projectId && t.parentId === null)

        if (rootTasks.length === 0) return 0

        const progresses = rootTasks.map(t => get().calculateTaskProgress(t.id))
        const totalProgress = progresses.reduce((acc, p) => acc + p, 0)
        return progresses.length > 0 ? totalProgress / progresses.length : 0
      },

      seedExamples: () => {
        const now = new Date()
        const gid = generateId

        // Helper: build yearly goals for given KPIs and years, with optional realized ratios
        const mkGoals = (
          kpis: { id: string; name: string; target: number; current: number; unit: string; aggregation: 'sum' | 'average' }[],
          years: number[],
          realizedRatios: number[]
        ) => years.map((year, i) => ({
          id: gid(),
          year,
          startDate: new Date(year, 0, 1),
          endDate: new Date(year, 11, 31),
          kpis: kpis.map(k => ({
            ...k,
            target: k.aggregation === 'sum' ? Math.round(k.target / years.length) : k.target,
            current: i < realizedRatios.length
              ? Math.round((k.aggregation === 'sum' ? k.target / years.length : k.target) * realizedRatios[i])
              : 0
          }))
        }))

        // ── PROJECT 1: Renovação de Frota (2026-2028) ─────────────
        const p1Id = gid()
        const p1Kpis = [
          { id: 'p1k1', name: 'Ônibus Renovados', target: 120, current: 28, unit: 'un', aggregation: 'sum' as const },
          { id: 'p1k2', name: 'Redução de Consumo', target: 18, current: 6, unit: '%', aggregation: 'average' as const },
          { id: 'p1k3', name: 'Investimento Total', target: 24000000, current: 5600000, unit: 'R$', aggregation: 'sum' as const },
          { id: 'p1k4', name: 'CO₂ Evitado', target: 900, current: 210, unit: 't', aggregation: 'sum' as const },
        ]
        const p1: Project = {
          id: p1Id,
          name: 'Renovação de Frota 2026–2028',
          description: 'Substituição progressiva dos veículos com mais de 10 anos por modelos Euro 6 e elétricos, reduzindo emissões e custos operacionais.',
          methodology: 'waterfall',
          color: '#006838',
          createdAt: now,
          updatedAt: now,
          deadline: new Date(2028, 11, 31),
          category: 'Frota',
          generalKpis: p1Kpis,
          yearlyGoals: mkGoals(p1Kpis, [2026, 2027, 2028], [0.23, 0, 0]),
          ownerId: '3',
          memberIds: ['1', '2', '3'],
          status: 'active'
        }
        const p1Tasks: Task[] = []
        const p1t1 = gid(), p1t2 = gid(), p1t3 = gid()
        p1Tasks.push({ id: p1t1, projectId: p1Id, parentId: null, title: 'Fase 1 – Diagnóstico e Licitação', status: 'done', progress: 100, order: 0, createdAt: now, updatedAt: now })
        p1Tasks.push({ id: gid(), projectId: p1Id, parentId: p1t1, title: 'Levantamento da frota atual', status: 'done', progress: 100, order: 0, createdAt: now, updatedAt: now })
        p1Tasks.push({ id: gid(), projectId: p1Id, parentId: p1t1, title: 'Edital de licitação', status: 'done', progress: 100, order: 1, createdAt: now, updatedAt: now })
        p1Tasks.push({ id: gid(), projectId: p1Id, parentId: p1t1, title: 'Contrato com fabricante', status: 'done', progress: 100, order: 2, createdAt: now, updatedAt: now })
        p1Tasks.push({ id: p1t2, projectId: p1Id, parentId: null, title: 'Fase 2 – Aquisição 1ª Leva (40 ônibus)', status: 'in-progress', progress: 0, order: 1, createdAt: now, updatedAt: now })
        p1Tasks.push({ id: gid(), projectId: p1Id, parentId: p1t2, title: 'Pagamento entrada fabricante', status: 'done', progress: 100, order: 0, createdAt: now, updatedAt: now })
        p1Tasks.push({ id: gid(), projectId: p1Id, parentId: p1t2, title: 'Entrega e vistoria dos 40 veículos', status: 'in-progress', progress: 70, order: 1, createdAt: now, updatedAt: now })
        p1Tasks.push({ id: gid(), projectId: p1Id, parentId: p1t2, title: 'Treinamento de motoristas (Nova Tecnologia)', status: 'in-progress', progress: 40, order: 2, createdAt: now, updatedAt: now })
        p1Tasks.push({ id: p1t3, projectId: p1Id, parentId: null, title: 'Fase 3 – Aquisição 2ª e 3ª Levas (80 ônibus)', status: 'todo', progress: 0, order: 2, createdAt: now, updatedAt: now })

        // ── PROJECT 2: Excelência Operacional (2026) ──────────────
        const p2Id = gid()
        const p2Kpis = [
          { id: 'p2k1', name: 'Pontualidade', target: 95, current: 88, unit: '%', aggregation: 'average' as const },
          { id: 'p2k2', name: 'NPS Passageiros', target: 75, current: 62, unit: 'pts', aggregation: 'average' as const },
          { id: 'p2k3', name: 'Ocorrências Resolvidas', target: 480, current: 312, unit: 'un', aggregation: 'sum' as const },
          { id: 'p2k4', name: 'Passageiros / Mês', target: 2400000, current: 2180000, unit: 'pax', aggregation: 'average' as const },
        ]
        const p2: Project = {
          id: p2Id,
          name: 'Excelência Operacional 2026',
          description: 'Programa estruturado de melhoria de pontualidade, satisfação e redução de ocorrências em toda a malha viária.',
          methodology: 'kanban',
          color: '#F9A825',
          createdAt: now,
          updatedAt: now,
          deadline: new Date(2026, 11, 31),
          category: 'Operações',
          generalKpis: p2Kpis,
          yearlyGoals: mkGoals(p2Kpis, [2026], [0.84]),
          ownerId: '3',
          memberIds: ['1', '2', '3'],
          status: 'active'
        }
        const p2Tasks: Task[] = []
        const p2t1 = gid(), p2t2 = gid()
        p2Tasks.push({ id: gid(), projectId: p2Id, parentId: null, title: 'Implantação de Painéis de Controle em Tempo Real', status: 'done', progress: 100, order: 0, createdAt: now, updatedAt: now })
        p2Tasks.push({ id: p2t1, projectId: p2Id, parentId: null, title: 'Reestruturação de Itinerários Críticos', status: 'in-progress', progress: 0, order: 1, createdAt: now, updatedAt: now })
        p2Tasks.push({ id: gid(), projectId: p2Id, parentId: p2t1, title: 'Mapeamento de linhas com atraso > 5min', status: 'done', progress: 100, order: 0, createdAt: now, updatedAt: now })
        p2Tasks.push({ id: gid(), projectId: p2Id, parentId: p2t1, title: 'Ajuste de horários no sistema', status: 'in-progress', progress: 60, order: 1, createdAt: now, updatedAt: now })
        p2Tasks.push({ id: gid(), projectId: p2Id, parentId: p2t1, title: 'Comunicação ao público', status: 'todo', progress: 0, order: 2, createdAt: now, updatedAt: now })
        p2Tasks.push({ id: p2t2, projectId: p2Id, parentId: null, title: 'Campanha Satisfação & NPS Trimestral', status: 'in-progress', progress: 0, order: 2, createdAt: now, updatedAt: now })
        p2Tasks.push({ id: gid(), projectId: p2Id, parentId: p2t2, title: 'Pesquisa Q1 (Jan-Mar)', status: 'done', progress: 100, order: 0, createdAt: now, updatedAt: now })
        p2Tasks.push({ id: gid(), projectId: p2Id, parentId: p2t2, title: 'Pesquisa Q2 (Abr-Jun)', status: 'in-progress', progress: 50, order: 1, createdAt: now, updatedAt: now })
        p2Tasks.push({ id: gid(), projectId: p2Id, parentId: p2t2, title: 'Pesquisa Q3 e Q4', status: 'todo', progress: 0, order: 2, createdAt: now, updatedAt: now })

        // ── PROJECT 3: Digitalização & App (2026-2027) ────────────
        const p3Id = gid()
        const p3Kpis = [
          { id: 'p3k1', name: 'Usuários Ativos App', target: 350000, current: 42000, unit: 'usr', aggregation: 'sum' as const },
          { id: 'p3k2', name: 'Bilhetagem Digital', target: 60, current: 18, unit: '%', aggregation: 'average' as const },
          { id: 'p3k3', name: 'Redução Tickets Suporte', target: 40, current: 12, unit: '%', aggregation: 'average' as const },
          { id: 'p3k4', name: 'Investimento TI', target: 3800000, current: 890000, unit: 'R$', aggregation: 'sum' as const },
        ]
        const p3: Project = {
          id: p3Id,
          name: 'Digitalização & App Princesa',
          description: 'Desenvolvimento e lançamento do super aplicativo de mobilidade com compra de passagens, rastreamento em tempo real e programa de fidelidade.',
          methodology: 'scrum',
          color: '#3b82f6',
          createdAt: now,
          updatedAt: now,
          deadline: new Date(2027, 5, 30),
          sprintDuration: 2,
          totalSprints: 12,
          category: 'TI',
          generalKpis: p3Kpis,
          yearlyGoals: mkGoals(p3Kpis, [2026, 2027], [0.22, 0]),
          ownerId: '1',
          memberIds: ['1', '2'],
          status: 'active'
        }
        const p3Tasks: Task[] = []
        const p3t1 = gid(), p3t2 = gid(), p3t3 = gid()
        p3Tasks.push({ id: p3t1, projectId: p3Id, parentId: null, title: 'Épico 1 – App MVP (Login, Linhas, Mapa)', status: 'done', progress: 100, order: 0, createdAt: now, updatedAt: now, sprint: 1 })
        p3Tasks.push({ id: gid(), projectId: p3Id, parentId: p3t1, title: 'Autenticação e Perfil do Usuário', status: 'done', progress: 100, order: 0, createdAt: now, updatedAt: now, sprint: 1 })
        p3Tasks.push({ id: gid(), projectId: p3Id, parentId: p3t1, title: 'Rastreamento GPS em tempo real', status: 'done', progress: 100, order: 1, createdAt: now, updatedAt: now, sprint: 2 })
        p3Tasks.push({ id: gid(), projectId: p3Id, parentId: p3t1, title: 'Busca de linhas e horários', status: 'done', progress: 100, order: 2, createdAt: now, updatedAt: now, sprint: 2 })
        p3Tasks.push({ id: p3t2, projectId: p3Id, parentId: null, title: 'Épico 2 – Bilhetagem Digital & Pagamentos', status: 'in-progress', progress: 0, order: 1, createdAt: now, updatedAt: now, sprint: 3 })
        p3Tasks.push({ id: gid(), projectId: p3Id, parentId: p3t2, title: 'Integração Gateway Pix/Cartão', status: 'done', progress: 100, order: 0, createdAt: now, updatedAt: now, sprint: 3 })
        p3Tasks.push({ id: gid(), projectId: p3Id, parentId: p3t2, title: 'Vale-Transporte Digital', status: 'in-progress', progress: 55, order: 1, createdAt: now, updatedAt: now, sprint: 4 })
        p3Tasks.push({ id: gid(), projectId: p3Id, parentId: p3t2, title: 'QR Code na catraca', status: 'in-progress', progress: 30, order: 2, createdAt: now, updatedAt: now, sprint: 4 })
        p3Tasks.push({ id: p3t3, projectId: p3Id, parentId: null, title: 'Épico 3 – Programa de Fidelidade e Notificações', status: 'todo', progress: 0, order: 2, createdAt: now, updatedAt: now, sprint: 7 })

        // ── PROJECT 4: Expansão Intermunicipal (2026-2030) ─────────
        const p4Id = gid()
        const p4Kpis = [
          { id: 'p4k1', name: 'Novas Linhas', target: 25, current: 4, unit: 'un', aggregation: 'sum' as const },
          { id: 'p4k2', name: 'Novos Municípios', target: 18, current: 3, unit: 'mun', aggregation: 'sum' as const },
          { id: 'p4k3', name: 'Receita Incremental', target: 15000000, current: 1200000, unit: 'R$', aggregation: 'sum' as const },
          { id: 'p4k4', name: 'Ocupação Novas Linhas', target: 70, current: 58, unit: '%', aggregation: 'average' as const },
        ]
        const p4: Project = {
          id: p4Id,
          name: 'Expansão Intermunicipal 2026–2030',
          description: 'Abertura de novas linhas e concessões para ampliar a cobertura regional, capturando mercados no Paraná não atendidos pela concorrência.',
          methodology: 'lean',
          color: '#8b5cf6',
          createdAt: now,
          updatedAt: now,
          deadline: new Date(2030, 11, 31),
          category: 'Expansão',
          generalKpis: p4Kpis,
          yearlyGoals: mkGoals(p4Kpis, [2026, 2027, 2028, 2029, 2030], [0.16, 0, 0, 0, 0]),
          ownerId: '3',
          memberIds: ['1', '2', '3'],
          status: 'active'
        }
        const p4Tasks: Task[] = []
        const p4t1 = gid(), p4t2 = gid()
        p4Tasks.push({ id: p4t1, projectId: p4Id, parentId: null, title: 'Fase 1 – Estudo de Mercado e Aprovações ANTT', status: 'in-progress', progress: 0, order: 0, createdAt: now, updatedAt: now })
        p4Tasks.push({ id: gid(), projectId: p4Id, parentId: p4t1, title: 'Pesquisa O/D (Origem-Destino) Regional', status: 'done', progress: 100, order: 0, createdAt: now, updatedAt: now })
        p4Tasks.push({ id: gid(), projectId: p4Id, parentId: p4t1, title: 'Protocolo de pedidos de autorização ANTT (12 linhas)', status: 'in-progress', progress: 45, order: 1, createdAt: now, updatedAt: now })
        p4Tasks.push({ id: gid(), projectId: p4Id, parentId: p4t1, title: 'Aprovação e publicação no DOU (4 linhas piloto)', status: 'in-progress', progress: 20, order: 2, createdAt: now, updatedAt: now })
        p4Tasks.push({ id: p4t2, projectId: p4Id, parentId: null, title: 'Fase 2 – Implantação das Linhas Piloto (4 linhas)', status: 'todo', progress: 0, order: 1, createdAt: now, updatedAt: now })
        p4Tasks.push({ id: gid(), projectId: p4Id, parentId: p4t2, title: 'Definição de terminais e pontos de parada', status: 'todo', progress: 0, order: 0, createdAt: now, updatedAt: now })
        p4Tasks.push({ id: gid(), projectId: p4Id, parentId: p4t2, title: 'Escala de motoristas e veículos', status: 'todo', progress: 0, order: 1, createdAt: now, updatedAt: now })
        p4Tasks.push({ id: gid(), projectId: p4Id, parentId: p4t2, title: 'Campanha de divulgação regional', status: 'todo', progress: 0, order: 2, createdAt: now, updatedAt: now })

        set((state) => ({
          projects: [...state.projects, p1, p2, p3, p4],
          tasks: [...state.tasks, ...p1Tasks, ...p2Tasks, ...p3Tasks, ...p4Tasks]
        }))
      }
    }),
    {
      name: 'project-flow-storage',
      partialize: (state) => ({
        projects: state.projects,
        tasks: state.tasks,
        riskAnalyses: state.riskAnalyses,
        selectedProjectId: state.selectedProjectId,
        user: state.user,
        users: state.users
      })
    }
  )
)
