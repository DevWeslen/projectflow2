'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { METHODOLOGY_INFO, type Task } from '@/lib/types'
import { cn, getFileUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskTree } from './task-tree'
import { TaskFormDialog } from './task-form-dialog'
import { KanbanBoard } from './kanban-board'
import { ProjectDiagram } from './project-diagram'
import { RiskAnalysisView } from './risk-analysis-view'
import { KpiManagement } from './kpi-management'
import { ProjectTimeline } from './project-timeline'
import { UserAvatar, UserAvatarGroup } from './user-avatar'
import { LogoPrincesa } from './logo-princesa'
import {
  ArrowLeft,
  Plus,
  Settings,
  Trash2,
  MoreHorizontal,
  ListTree,
  Target,
  Calendar,
  TrendingUp,
  LayoutDashboard,
  Network,
  ShieldAlert,
  Maximize2,
  Minimize2,
  Download,
  FileText,
  Layers,
  History,
  Users,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { exportProjectToCSV, exportRiskToCSV, exportFullProjectToCSV } from '@/lib/export-utils'
import { ProjectReport } from './project-report'
import dynamic from 'next/dynamic'
const StatusReport = dynamic(() => import('./status-report').then(mod => mod.StatusReport), { ssr: false })
const StatusReportKpi = dynamic(() => import('./status-report-kpi').then(mod => mod.StatusReportKpi), { ssr: false })
import { ProjectSettingsDialog } from './project-settings-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ProjectViewProps {
  projectId: string
}

type ViewMode = 'tree' | 'board' | 'diagram' | 'risk' | 'kpi' | 'timeline' | 'status-report' | 'status-report-kpi'

export function ProjectView({ projectId }: ProjectViewProps) {
  const { projects, tasks, riskAnalyses, calculateProjectProgress, deleteProject, selectProject, user, updateProject } = useProjectStore()

  const project = projects.find(p => p.id === projectId)
  const projectAnalyses = riskAnalyses.filter(r => r.projectId === projectId)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskParentId, setTaskParentId] = useState<string | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 100)
  }

  // Default view based on methodology
  const [view, setView] = useState<ViewMode>(() => {
    if (!project) return 'tree'
    if (project.methodology === 'kanban' || project.methodology === 'scrum') return 'board'
    if (project.methodology === 'waterfall') return 'diagram'
    return 'tree'
  })

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Projeto nao encontrado</p>
      </div>
    )
  }

  const progress = calculateProjectProgress(projectId)
  const methodology = METHODOLOGY_INFO[project.methodology]
  const projectTasks = tasks.filter(t => t.projectId === projectId)
  const rootTasks = projectTasks.filter(t => t.parentId === null)
  const completedTasks = projectTasks.filter(t => t.status === 'done').length

  const handleAddTask = (parentId: string | null) => {
    setTaskParentId(parentId)
    setEditTask(null)
    setTaskDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditTask(task)
    setTaskParentId(task.parentId)
    setTaskDialogOpen(true)
  }

  const handleDeleteProject = () => {
    deleteProject(projectId)
    setDeleteDialogOpen(false)
  }

  const isOwnerOrAdmin = user?.role === 'admin' || user?.role === 'conselho' || user?.role === 'diretoria' || project.ownerId === user?.id

  return (
    <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:bg-white premium-gradient">
      {/* Header */}
      {!isExpanded && (
        <header className="border-b border-border/50 glass p-4 sm:p-5 relative z-10 animate-in slide-in-from-top duration-500">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => selectProject(null)}
                className="lg:hidden rounded-full hover:bg-primary/10 shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-3 overflow-hidden">
                <LogoPrincesa className="h-10 w-20 shrink-0 rounded-none bg-transparent hidden md:block mr-2" />
                <div
                  className="h-5 w-5 sm:h-6 sm:w-6 rounded-full shadow-lg shadow-black/20 shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight text-primary truncate">
                      {project.name}
                    </h1>
                    {project.status === 'completed' && (
                      <Badge className="bg-[#1D9E75]/10 text-[#1D9E75] border-[#1D9E75]/20 text-[9px] font-black uppercase">
                        Concluído
                      </Badge>
                    )}
                  </div>
                  {project.description && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate max-w-[200px] sm:max-w-sm">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="hidden xs:flex items-center gap-4 border-l border-border/50 pl-4">
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Responsável</span>
                   <UserAvatar 
                     name={useProjectStore.getState().users.find(u => u.id === project.ownerId)?.name || 'Owner'} 
                     role="Project Owner"
                     size="sm"
                   />
                </div>

                {Array.isArray(project.stakeholderIds) && project.stakeholderIds.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Interessados</span>
                    <UserAvatarGroup 
                      users={project.stakeholderIds.map(id => {
                        const u = useProjectStore.getState().users.find(user => user.id === id)
                        return { name: u?.name || 'User', role: 'Stakeholder' }
                      })} 
                      size="sm"
                    />
                  </div>
                )}

                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="bg-secondary/80 backdrop-blur-sm border-none px-2 sm:px-3 py-1 font-bold text-[9px] sm:text-[10px] uppercase cursor-help shrink-0 h-fit">
                        {methodology.icon} <span className="hidden sm:inline ml-1">{methodology.name}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs p-4 glass border-none shadow-2xl">
                      <p className="font-bold text-sm text-foreground mb-1">{methodology.icon} {methodology.name}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{methodology.longDescription}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                onClick={() => handleAddTask(null)}
                className="flex-1 sm:flex-none bg-primary text-primary-foreground rounded-full px-4 sm:px-6 hover:scale-105 transition-all shadow-lg font-bold h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span>Nova Tarefa</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full glass border-none">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass min-w-[180px]">
                  <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Exportar Dados</div>
                  <DropdownMenuItem onClick={() => exportProjectToCSV(project, projectTasks)}>
                    <Download className="h-4 w-4 mr-2 text-primary" />
                    Exportar Tarefas (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportFullProjectToCSV(project, projectTasks, projectAnalyses)}>
                    <Layers className="h-4 w-4 mr-2 text-orange-500" />
                    Relatório Completo (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView('status-report')}>
                    <FileText className="h-4 w-4 mr-2 text-primary" />
                    Gerar Status Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView('status-report-kpi')}>
                    <Target className="h-4 w-4 mr-2 text-green-500" />
                    Gerar Status Report (Indicadores)
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Gerenciar</div>
                  {isOwnerOrAdmin && (
                    <>
                      {project.status === 'active' ? (
                        <DropdownMenuItem onClick={() => updateProject(project.id, { status: 'completed' })}>
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                          Concluir Projeto
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => updateProject(project.id, { status: 'active' })}>
                          <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                          Reativar Projeto
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Configuracoes
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive font-semibold"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Projeto
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
      )}

      <div className={cn("flex-1 overflow-auto print:overflow-visible p-6 print:p-0 scrollbar-hide transition-all duration-500", isExpanded ? "pt-2" : "pt-6")}>
        <div className={cn("max-w-7xl mx-auto space-y-6 animate-in-fade", isExpanded && "space-y-0")}>
          {/* Stats */}
          {!isExpanded && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top duration-500 print:hidden">
              <Card className="glass-card group hover:border-primary/50 transition-all">
                <CardContent className="py-6 pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Progresso</p>
                      <p className="text-2xl font-black text-foreground">{Math.round(progress)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card group hover:border-accent/50 transition-all">
                <CardContent className="py-6 pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                      <ListTree className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Tarefas</p>
                      <p className="text-2xl font-black text-foreground">{projectTasks.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card group hover:border-green-500/50 transition-all">
                <CardContent className="py-6 pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                      <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-[10px] text-white font-black">{completedTasks}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Concluídas</p>
                      <p className="text-2xl font-black text-foreground">
                        {projectTasks.length > 0
                          ? Math.round((completedTasks / projectTasks.length) * 100)
                          : 0
                        }%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card group hover:border-muted-foreground/50 transition-all">
                <CardContent className="py-6 pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-muted/10 group-hover:bg-muted/20 transition-colors">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Prazo Final</p>
                      <p className="text-lg font-black text-foreground">
                        {project.deadline
                          ? new Date(project.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Sem prazo'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Progress Bar & View Switcher */}
          {!isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top duration-700 print:hidden">
              <Card className="glass-card overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Progresso Médio</span>
                      </div>
                      <span className="text-2xl font-black text-primary">{Math.round(progress)}%</span>
                    </div>
                    <div className="relative">
                      <Progress value={progress} className="h-3 rounded-full" />
                      <div
                        className="absolute inset-0 blur-lg opacity-20 -z-10 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card flex items-center p-2 mt-4 md:mt-0">
                <div className="grid grid-cols-5 w-full bg-secondary/20 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setView('tree')}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 rounded-lg transition-all",
                      view === 'tree' ? "bg-background shadow-lg text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <ListTree className="h-4 w-4 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Estrutura</span>
                  </button>
                  <button
                    onClick={() => setView('board')}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 rounded-lg transition-all",
                      view === 'board' ? "bg-background shadow-lg text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Kanban</span>
                  </button>
                  <button
                    onClick={() => setView('diagram')}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 rounded-lg transition-all",
                      view === 'diagram' ? "bg-background shadow-lg text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Network className="h-4 w-4 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Diagrama</span>
                  </button>
                  <button
                    onClick={() => setView('risk')}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 rounded-lg transition-all",
                      view === 'risk' ? "bg-background shadow-lg text-orange-500" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <ShieldAlert className="h-4 w-4 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Riscos</span>
                  </button>
                  <button
                    onClick={() => setView('kpi')}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 rounded-lg transition-all",
                      view === 'kpi' ? "bg-background shadow-lg text-green-500" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Target className="h-4 w-4 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Metas</span>
                  </button>
                  <button
                    onClick={() => setView('timeline')}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 rounded-lg transition-all",
                      view === 'timeline' ? "bg-background shadow-lg text-blue-500" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <History className="h-4 w-4 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Timeline</span>
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* Content Area */}
          <div className={cn("flex-1 min-h-0 pb-10 transition-all duration-500", isExpanded && "pb-0")}>
            {view === 'risk' ? (
              <RiskAnalysisView
                projectId={projectId}
                isExpanded={isExpanded}
                onToggleExpand={() => setIsExpanded(!isExpanded)}
              />
            ) : view === 'kpi' ? (
              <KpiManagement projectId={projectId} />
            ) : (
              <Card className={cn("glass-card border-none shadow-xl transition-all duration-500 print:shadow-none print:border-none print:overflow-visible print:block", isExpanded && "shadow-2xl ring-1 ring-white/10")}>
                <CardHeader className="pb-4 border-b border-white/5 print:hidden">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      {view === 'tree' && <><ListTree className="h-5 w-5 text-primary" /> Estrutura do Projeto</>}
                      {view === 'board' && <><LayoutDashboard className="h-5 w-5 text-primary" /> Kanban Board</>}
                      {view === 'diagram' && <><Network className="h-5 w-5 text-primary" /> Fluxo do Projeto</>}
                      {view === 'timeline' && <><History className="h-5 w-5 text-primary" /> Cronograma Real</>}
                      {view === 'status-report' && <><FileText className="h-5 w-5 text-primary" /> Status Report Avançado</>}
                      {view === 'status-report-kpi' && <><Target className="h-5 w-5 text-green-500" /> Status Report de Indicadores</>}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-black tracking-tighter uppercase px-2 py-0">
                        {projectTasks.length} TAREFAS
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-8 w-8 rounded-full hover:bg-white/10"
                      >
                        {isExpanded ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 print:overflow-visible print:block">
                  {view === 'tree' && (
                    <div className="p-4 sm:p-6">
                      <TaskTree
                        projectId={projectId}
                        onAddTask={handleAddTask}
                        onEditTask={handleEditTask}
                      />
                    </div>
                  )}
                  {view === 'board' && (
                    <KanbanBoard
                      projectId={projectId}
                      onAddTask={handleAddTask}
                      onEditTask={handleEditTask}
                    />
                  )}
                  {view === 'diagram' && (
                    <div className="p-4 sm:p-6">
                      <ProjectDiagram projectId={projectId} />
                    </div>
                  )}
                  {view === 'timeline' && (
                    <ProjectTimeline projectId={projectId} />
                  )}
                  {view === 'status-report' && (
                    <div className="relative">
                      <div id="status-report-content">
                        <StatusReport projectId={projectId} />
                      </div>
                    </div>
                  )}
                  {view === 'status-report-kpi' && (
                    <div className="relative">
                      <div id="status-report-kpi-content">
                        <StatusReportKpi projectId={projectId} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        projectId={projectId}
        parentId={taskParentId}
        editTask={editTask}
        methodology={project.methodology}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto &quot;{project.name}&quot;?
              Esta acao nao pode ser desfeita e todas as tarefas serao perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Old Report View (Print Only) - Retained for compatibility if needed */}
      <div className="hidden print:hidden">
        <ProjectReport projectId={projectId} />
      </div>

      {/* Settings Dialog */}
      <ProjectSettingsDialog 
        project={project} 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
    </div>
  )

}
