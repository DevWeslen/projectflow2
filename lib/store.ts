'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Task, Methodology, TaskStatus, RiskAnalysis } from './types'
import { autoStatusFromProgress } from './types'

interface ProjectStore {
  projects: Project[]
  tasks: Task[]
  riskAnalyses: RiskAnalysis[]
  selectedProjectId: string | null
  
  // Project actions
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  selectProject: (id: string | null) => void
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => string
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  
  // Risk Analysis actions
  addRiskAnalysis: (analysis: Omit<RiskAnalysis, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateRiskAnalysis: (id: string, updates: Partial<RiskAnalysis>) => void
  deleteRiskAnalysis: (id: string) => void
  
  // Computed
  getProjectTasks: (projectId: string) => Task[]
  getChildTasks: (parentId: string) => Task[]
  getRootTasks: (projectId: string) => Task[]
  calculateTaskProgress: (taskId: string) => number
  calculateProjectProgress: (projectId: string) => number
  seedExamples: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 15)

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      tasks: [],
      riskAnalyses: [],
      selectedProjectId: null,
      
      addProject: (projectData) => {
        const id = generateId()
        const now = new Date()
        const project: Project = {
          ...projectData,
          id,
          createdAt: now,
          updatedAt: now
        }
        set((state) => ({ 
          projects: [...state.projects, project],
          selectedProjectId: id
        }))
        return id
      },
      
      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          )
        }))
      },
      
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          tasks: state.tasks.filter((t) => t.projectId !== id),
          riskAnalyses: state.riskAnalyses.filter((r) => r.projectId !== id),
          selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId
        }))
      },
      
      selectProject: (id) => {
        set({ selectedProjectId: id })
      },
      
      addTask: (taskData) => {
        const id = generateId()
        const now = new Date()
        const state = get()
        const siblingTasks = taskData.parentId 
          ? state.tasks.filter(t => t.parentId === taskData.parentId)
          : state.tasks.filter(t => t.projectId === taskData.projectId && t.parentId === null)
        
        const task: Task = {
          ...taskData,
          id,
          createdAt: now,
          updatedAt: now,
          order: siblingTasks.length
        }
        set((state) => ({ tasks: [...state.tasks, task] }))
        return id
      },
      
      updateTask: (id, updates) => {
        set((state) => {
          const tasks = [...state.tasks]
          const taskIndex = tasks.findIndex(t => t.id === id)
          if (taskIndex === -1) return { tasks }

          const task = tasks[taskIndex]
          const project = state.projects.find(p => p.id === task.projectId)
          const isKanban = project?.methodology === 'kanban'

          // 1. Update the target task
          const updatedTask = { ...task, ...updates, updatedAt: new Date() }
          
          // If progress changed, handle Kanban status
          if (updates.progress !== undefined && !updates.status && isKanban) {
            updatedTask.status = autoStatusFromProgress(updatedTask.progress)
          }
          
          tasks[taskIndex] = updatedTask

          // 2. Recursively update ancestors
          let currentParentId = updatedTask.parentId
          while (currentParentId) {
            const parentIndex = tasks.findIndex(t => t.id === currentParentId)
            if (parentIndex === -1) break

            const parent = tasks[parentIndex]
            const children = tasks.filter(t => t.parentId === currentParentId)
            
            // Calculate new progress for parent (median of children)
            const childProgresses = children.map(c => {
               // If it's the child we just updated, use the new value
               return c.id === (currentParentId === updatedTask.parentId ? updatedTask.id : '') 
                 ? updatedTask.progress 
                 : c.progress
            })
            
            // Wait, I need to use the actual latest values in the tasks array
            const latestChildProgresses = children.map(c => {
                const found = tasks.find(t => t.id === c.id)
                return found ? found.progress : c.progress
            })

            const sorted = [...latestChildProgresses].sort((a, b) => a - b)
            const mid = Math.floor(sorted.length / 2)
            let newProgress = 0
            if (sorted.length > 0) {
              newProgress = sorted.length % 2 === 0 
                ? (sorted[mid - 1] + sorted[mid]) / 2 
                : sorted[mid]
            }

            const parentUpdate: Partial<Task> = { progress: newProgress, updatedAt: new Date() }
            if (isKanban) {
              parentUpdate.status = autoStatusFromProgress(newProgress)
            }

            tasks[parentIndex] = { ...parent, ...parentUpdate }
            currentParentId = parent.parentId
          }

          return { tasks }
        })
      },
      
      deleteTask: (id) => {
        const state = get()
        // Recursivamente deletar todas as subtarefas
        const deleteRecursively = (taskId: string): string[] => {
          const children = state.tasks.filter(t => t.parentId === taskId)
          const childIds = children.flatMap(c => deleteRecursively(c.id))
          return [taskId, ...childIds]
        }
        const idsToDelete = deleteRecursively(id)
        set((state) => ({
          tasks: state.tasks.filter((t) => !idsToDelete.includes(t.id))
        }))
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
        return id
      },

      updateRiskAnalysis: (id, updates) => {
        set((state) => ({
          riskAnalyses: state.riskAnalyses.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
          )
        }))
      },

      deleteRiskAnalysis: (id) => {
        set((state) => ({
          riskAnalyses: state.riskAnalyses.filter((r) => r.id !== id)
        }))
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
          // Tarefa folha - retorna seu próprio progresso
          const task = state.tasks.find(t => t.id === taskId)
          return task?.progress ?? 0
        }
        
        // Calcula a mediana dos progressos das subtarefas
        const childProgresses = children.map(c => get().calculateTaskProgress(c.id))
        const sorted = [...childProgresses].sort((a, b) => a - b)
        const mid = Math.floor(sorted.length / 2)
        
        if (sorted.length % 2 === 0) {
          return (sorted[mid - 1] + sorted[mid]) / 2
        }
        return sorted[mid]
      },
      
      calculateProjectProgress: (projectId) => {
        const state = get()
        const rootTasks = state.tasks.filter(t => t.projectId === projectId && t.parentId === null)
        
        if (rootTasks.length === 0) return 0
        
        // Calcula a mediana dos progressos das tarefas raiz
        const progresses = rootTasks.map(t => get().calculateTaskProgress(t.id))
        const sorted = [...progresses].sort((a, b) => a - b)
        const mid = Math.floor(sorted.length / 2)
        
        if (sorted.length % 2 === 0) {
          return (sorted[mid - 1] + sorted[mid]) / 2
        }
        return sorted[mid]
      },
      
      seedExamples: () => {
        const now = new Date()
        const in2Weeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
        const in1Month = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        const in3Months = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
        
        // 1. Projeto Scrum (E-commerce)
        const project1Id = generateId()
        const project1: Project = {
          id: project1Id,
          name: 'Plataforma E-commerce V2',
          description: 'Desenvolvimento da nova versão da plataforma com foco em mobile e performance.',
          methodology: 'scrum',
          color: '#3b82f6',
          createdAt: now,
          updatedAt: now,
          deadline: in3Months,
          sprintDuration: 2,
          totalSprints: 6
        }

        const p1Tasks: Task[] = []
        const t1Id = generateId()
        p1Tasks.push({ id: t1Id, projectId: project1Id, parentId: null, title: 'Desenvolvimento Frontend', status: 'in-progress', progress: 0, order: 0, createdAt: now, updatedAt: now, sprint: 1, deadline: in1Month })
        p1Tasks.push({ id: generateId(), projectId: project1Id, parentId: t1Id, title: 'Home Page Responsiva', status: 'done', progress: 100, order: 0, createdAt: now, updatedAt: now, sprint: 1 })
        p1Tasks.push({ id: generateId(), projectId: project1Id, parentId: t1Id, title: 'Checkout Flow', status: 'in-progress', progress: 45, order: 1, createdAt: now, updatedAt: now, sprint: 2, deadline: in2Weeks })
        p1Tasks.push({ id: generateId(), projectId: project1Id, parentId: t1Id, title: 'Busca e Filtros', status: 'todo', progress: 0, order: 2, createdAt: now, updatedAt: now, sprint: 3 })

        const t2Id = generateId()
        p1Tasks.push({ id: t2Id, projectId: project1Id, parentId: null, title: 'Core Backend API', status: 'in-progress', progress: 0, order: 1, createdAt: now, updatedAt: now, sprint: 1, deadline: in1Month })
        p1Tasks.push({ id: generateId(), projectId: project1Id, parentId: t2Id, title: 'Integração de Pagamentos', status: 'in-progress', progress: 80, order: 0, createdAt: now, updatedAt: now, sprint: 2 })
        p1Tasks.push({ id: generateId(), projectId: project1Id, parentId: t2Id, title: 'Autenticação JWT', status: 'done', progress: 100, order: 1, createdAt: now, updatedAt: now, sprint: 1 })

        // 2. Projeto Kanban (Marketing Digital)
        const project2Id = generateId()
        const project2: Project = {
          id: project2Id,
          name: 'Campanha Lançamento Verão',
          description: 'Gestão de ativos e tráfego para a campanha principal de vendas.',
          methodology: 'kanban',
          color: '#10b981',
          createdAt: now,
          updatedAt: now,
          deadline: in1Month
        }

        const p2Tasks: Task[] = []
        p2Tasks.push({ id: generateId(), projectId: project2Id, parentId: null, title: 'Design de Landing Pages', status: 'done', progress: 100, order: 0, createdAt: now, updatedAt: now })
        
        const t3Id = generateId()
        p2Tasks.push({ id: t3Id, projectId: project2Id, parentId: null, title: 'Anúncios Social Media', status: 'in-progress', progress: 0, order: 1, createdAt: now, updatedAt: now, deadline: in2Weeks })
        p2Tasks.push({ id: generateId(), projectId: project2Id, parentId: t3Id, title: 'Criativos para Instagram', status: 'done', progress: 100, order: 0, createdAt: now, updatedAt: now })
        p2Tasks.push({ id: generateId(), projectId: project2Id, parentId: t3Id, title: 'Copywriting para Facebook', status: 'review', progress: 90, order: 1, createdAt: now, updatedAt: now })
        
        p2Tasks.push({ id: generateId(), projectId: project2Id, parentId: null, title: 'E-mail Marketing Blast', status: 'todo', progress: 0, order: 2, createdAt: now, updatedAt: now })

        // 3. Projeto Waterfall (Obra Civil Sede)
        const project3Id = generateId()
        const project3: Project = {
          id: project3Id,
          name: 'Reforma Sede Administrativa',
          description: 'Projeto estrutural e estético de modernização do escritório central.',
          methodology: 'waterfall',
          color: '#8b5cf6',
          createdAt: now,
          updatedAt: now,
          deadline: in3Months
        }

        const p3Tasks: Task[] = []
        const t4Id = generateId()
        p3Tasks.push({ id: t4Id, projectId: project3Id, parentId: null, title: 'Fase 1: Fundações', status: 'done', progress: 100, order: 0, createdAt: now, updatedAt: now })
        const t5Id = generateId()
        p3Tasks.push({ id: t5Id, projectId: project3Id, parentId: null, title: 'Fase 2: Alvenaria', status: 'in-progress', progress: 0, order: 1, createdAt: now, updatedAt: now, deadline: in1Month })
        p3Tasks.push({ id: generateId(), projectId: project3Id, parentId: t5Id, title: 'Paredes Internas', status: 'done', progress: 100, order: 0, createdAt: now, updatedAt: now })
        p3Tasks.push({ id: generateId(), projectId: project3Id, parentId: t5Id, title: 'Revestimento Externo', status: 'in-progress', progress: 30, order: 1, createdAt: now, updatedAt: now })
        
        p3Tasks.push({ id: generateId(), projectId: project3Id, parentId: null, title: 'Fase 3: Acabamento', status: 'todo', progress: 0, order: 2, createdAt: now, updatedAt: now })

        set((state) => ({
          projects: [...state.projects, project1, project2, project3],
          tasks: [...state.tasks, ...p1Tasks, ...p2Tasks, ...p3Tasks]
        }))
      }
    }),
    {
      name: 'project-store',
      partialize: (state) => ({ 
        projects: state.projects, 
        tasks: state.tasks,
        riskAnalyses: state.riskAnalyses,
        selectedProjectId: state.selectedProjectId 
      })
    }
  )
)
