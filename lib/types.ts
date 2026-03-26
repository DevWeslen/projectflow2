export type Methodology = 'scrum' | 'kanban' | 'xp' | 'lean' | 'waterfall'

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  progress: number // 0-100
  parentId: string | null // null = é uma tarefa raiz (macro)
  projectId: string
  createdAt: Date
  updatedAt: Date
  order: number
  deadline?: Date
  sprint?: number // For Scrum methodology
}

export interface Project {
  id: string
  name: string
  description?: string
  methodology: Methodology
  color: string
  createdAt: Date
  updatedAt: Date
  deadline?: Date
  // Scrum specific settings
  sprintDuration?: number // in weeks
  totalSprints?: number
}

export const METHODOLOGY_INFO: Record<Methodology, { name: string; description: string; longDescription: string; icon: string }> = {
  scrum: {
    name: 'Scrum',
    description: 'Sprints, daily standups, retrospectivas',
    longDescription: 'Framework ágil baseado em ciclos curtos chamados Sprints (1-4 semanas). Inclui papéis definidos (Product Owner, Scrum Master, Dev Team), cerimônias (Daily, Planning, Review, Retro) e artefatos (Product Backlog, Sprint Backlog). Ideal para projetos com requisitos variáveis e entregas incrementais.',
    icon: '🏃'
  },
  kanban: {
    name: 'Kanban',
    description: 'Fluxo contínuo, limites WIP, visualização',
    longDescription: 'Sistema visual de gestão de fluxo contínuo. Utiliza quadros com colunas representando cada estágio do processo. Foco em limitar o trabalho em progresso (WIP), reduzir gargalos e otimizar o tempo de entrega (lead time). O status das tarefas é calculado automaticamente pela porcentagem de progresso.',
    icon: '📊'
  },
  xp: {
    name: 'Extreme Programming',
    description: 'Pair programming, TDD, integração contínua',
    longDescription: 'Metodologia ágil focada em excelência técnica e qualidade de código. Práticas incluem programação em pares, TDD (Test-Driven Development), integração contínua, releases curtos e feedback constante do cliente. Ideal para equipes técnicas que priorizam qualidade.',
    icon: '💻'
  },
  lean: {
    name: 'Lean',
    description: 'Eliminar desperdícios, entrega rápida',
    longDescription: 'Filosofia de gestão focada em maximizar valor eliminando desperdícios. Princípios: eliminar desperdícios, amplificar aprendizado, decidir o mais tarde possível, entregar o mais rápido possível, empoderar a equipe, construir integridade e visualizar o todo.',
    icon: '⚡'
  },
  waterfall: {
    name: 'Cascata',
    description: 'Fases sequenciais, documentação completa',
    longDescription: 'Modelo sequencial clássico onde cada fase deve ser completada antes da próxima iniciar. Fases: Requisitos → Design → Implementação → Verificação → Manutenção. Ideal para projetos com escopo bem definido, requisitos estáveis e necessidade de documentação detalhada.',
    icon: '📋'
  }
}

export const TASK_STATUS_INFO: Record<TaskStatus, { name: string; color: string }> = {
  'todo': { name: 'A Fazer', color: 'bg-muted text-muted-foreground' },
  'in-progress': { name: 'Em Progresso', color: 'bg-primary/20 text-primary' },
  'review': { name: 'Em Revisão', color: 'bg-warning/20 text-warning-foreground' },
  'done': { name: 'Concluído', color: 'bg-accent/20 text-accent' }
}

export const PROJECT_COLORS = [
  '#10b981', // emerald (Princesa primary)
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
]

export function autoStatusFromProgress(progress: number): TaskStatus {
  if (progress === 0) return 'todo'
  if (progress >= 100) return 'done'
  if (progress >= 85) return 'review'
  return 'in-progress'
}

export type RiskAnalysisType = '5w2h' | '5whys' | 'fishbone' | 'pareto' | 'swot'

export interface RiskAnalysis {
  id: string
  projectId: string
  type: RiskAnalysisType
  title: string
  data: any
  createdAt: Date
  updatedAt: Date
}

export const RISK_ANALYSIS_INFO: Record<RiskAnalysisType, { name: string; description: string; icon: string }> = {
  '5w2h': {
    name: '5W2H',
    description: 'What, Why, Where, When, Who, How, How Much',
    icon: '📝'
  },
  '5whys': {
    name: '5 Porquês',
    description: 'Técnica de análise de causa raiz',
    icon: '❓'
  },
  'fishbone': {
    name: 'Espinha de Peixe',
    description: 'Diagrama de Ishikawa (Causa e Efeito)',
    icon: '🐟'
  },
  'pareto': {
    name: 'Análise de Pareto',
    description: 'Regra 80/20 para priorização de problemas',
    icon: '📈'
  },
  'swot': {
    name: 'Análise SWOT',
    description: 'Forças, Fraquezas, Oportunidades e Ameaças',
    icon: '🛡️'
  }
}
