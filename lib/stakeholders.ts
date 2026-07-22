import type { ExternalStakeholder, Project, Task } from './types'

export const parseExternalStakeholders = (data: unknown): ExternalStakeholder[] => {
  if (Array.isArray(data)) return data
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export const normalizeStakeholderEmail = (email: string) => email.toLowerCase().trim()

export const getAllExternalStakeholders = (
  projects: Project[],
  tasks: Task[],
  options?: { projectId?: string }
): ExternalStakeholder[] => {
  const map = new Map<string, ExternalStakeholder>()

  const add = (items: ExternalStakeholder[]) => {
    for (const es of items) {
      if (!es?.email?.trim()) continue
      const key = normalizeStakeholderEmail(es.email)
      if (!map.has(key)) {
        map.set(key, {
          id: es.id || key,
          name: es.name,
          email: es.email,
        })
      }
    }
  }

  if (options?.projectId) {
    const project = projects.find(p => p.id === options.projectId)
    if (project) add(parseExternalStakeholders(project.externalStakeholders))
    tasks
      .filter(t => t.projectId === options.projectId)
      .forEach(t => add(parseExternalStakeholders(t.externalStakeholders)))
  } else {
    projects.forEach(p => add(parseExternalStakeholders(p.externalStakeholders)))
    tasks.forEach(t => add(parseExternalStakeholders(t.externalStakeholders)))
  }

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR')
  )
}
