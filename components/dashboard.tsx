'use client'

import { useState, useMemo } from 'react'
import { useProjectStore } from '@/lib/store'
import { METHODOLOGY_INFO, ProjectStatus } from '@/lib/types'
import { parseExternalStakeholders } from '@/lib/stakeholders'
import { LogoPrincesa } from '@/components/logo-princesa'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FolderKanban, ListTodo, CheckCircle2, Clock, TrendingUp, Users } from 'lucide-react'
import { UserAvatar } from './user-avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardProps {
  onNewProject: () => void
}

export function Dashboard({ onNewProject }: DashboardProps) {
  const { 
    projects, 
    tasks, 
    calculateProjectProgress, 
    selectProject, 
    user,
    users
  } = useProjectStore()

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedOwners, setSelectedOwners] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>(['active'])

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const toggleOwner = (ownerId: string) => {
    setSelectedOwners(prev =>
      prev.includes(ownerId) ? prev.filter(id => id !== ownerId) : [...prev, ownerId]
    )
  }

  const toggleStatus = (status: ProjectStatus) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }

  const availableYears = useMemo(() => {
    const years = new Set<number>()
    projects.forEach((p) => {
      p.yearlyGoals?.forEach((g: any) => years.add(g.year))
      if (p.createdAt) years.add(new Date(p.createdAt).getFullYear())
    })
    if (years.size === 0) years.add(new Date().getFullYear())
    return Array.from(years).sort((a, b) => b - a)
  }, [projects])

  const filteredProjects = projects.filter(project => {
    if (!user) return false

    let hasAccess = false
    if (['admin', 'conselho', 'diretoria'].includes(user.role)) hasAccess = true
    else if (project.ownerId === user.id) hasAccess = true
    else if (project.memberIds?.includes(user.id)) hasAccess = true
    
    if (!hasAccess) return false

    if (selectedStatuses.length > 0 && !selectedStatuses.includes(project.status as ProjectStatus)) return false

    const hasGoalInYear = project.yearlyGoals?.some((g: any) => g.year === selectedYear)
    const wasCreatedInOrBefore = project.createdAt && new Date(project.createdAt).getFullYear() <= selectedYear
    if (!hasGoalInYear && !wasCreatedInOrBefore) return false

    if (selectedCategories.length > 0 && !selectedCategories.includes(project.category || 'geral')) return false
    if (selectedOwners.length > 0 && !selectedOwners.includes(project.ownerId)) return false

    return true
  })

  // Filter tasks based on accessible projects
  const accessibleProjectIds = new Set(filteredProjects.map(p => p.id))
  const filteredTasks = tasks.filter(t => accessibleProjectIds.has(t.projectId))

  const totalProjects = filteredProjects.length
  const totalTasks = filteredTasks.length
  const completedTasks = filteredTasks.filter(t => t.status === 'done').length
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress').length

  const avgProgress = totalProjects > 0
    ? filteredProjects.reduce((acc, p) => acc + calculateProjectProgress(p.id), 0) / totalProjects
    : 0

  return (
    <div className="flex-1 p-6 overflow-auto premium-gradient">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-in-fade pb-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-end">
          <div className="flex items-center gap-4">
            <LogoPrincesa className="h-14 w-28 shrink-0 rounded-none bg-transparent hidden md:block" />
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight uppercase">
                Olá, {user?.name.split(' ')[0]}! 👋
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg max-w-md">
                Aqui está a visão geral dos seus projetos e progresso.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onNewProject}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
            >
              <FolderKanban className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="truncate">Novo Projeto</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 bg-background/50 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-sm">
          {/* Year Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden sm:block">Ano:</span>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[100px] h-9 text-xs font-bold border-border bg-background">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()} className="text-xs font-bold">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden sm:block">Cat:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 text-xs font-bold border-border bg-background flex items-center justify-between gap-2 px-3 min-w-[140px]">
                  <span>
                    {selectedCategories.length === 0
                      ? "Todas Categorias"
                      : selectedCategories.length === 1
                        ? selectedCategories[0]
                        : `${selectedCategories.length} Selecionadas`}
                  </span>
                  <span className="text-[10px] opacity-50">▼</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[180px] bg-background border border-border">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground">Categorias</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Array.from(new Set(projects.map(p => p.category || 'geral'))).map(cat => (
                  <DropdownMenuCheckboxItem
                    key={cat}
                    checked={selectedCategories.includes(cat)}
                    onCheckedChange={() => toggleCategory(cat)}
                    onSelect={(e) => e.preventDefault()}
                    className="text-xs font-bold"
                  >
                    {cat}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Owner Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden sm:block">Dono:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 text-xs font-bold border-border bg-background flex items-center justify-between gap-2 px-3 min-w-[160px]">
                  <span>
                    {selectedOwners.length === 0
                      ? "Todos Responsáveis"
                      : selectedOwners.length === 1
                        ? users.find(u => u.id === selectedOwners[0])?.name.split(' ')[0] || "1 Selecionado"
                        : `${selectedOwners.length} Selecionados`}
                  </span>
                  <span className="text-[10px] opacity-50">▼</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[180px] bg-background border border-border">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground">Responsáveis</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {users.map(u => (
                  <DropdownMenuCheckboxItem
                    key={u.id}
                    checked={selectedOwners.includes(u.id)}
                    onCheckedChange={() => toggleOwner(u.id)}
                    onSelect={(e) => e.preventDefault()}
                    className="text-xs font-bold"
                  >
                    {u.name.split(' ')[0]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden sm:block">Status:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 text-xs font-bold border-border bg-background flex items-center justify-between gap-2 px-3 min-w-[120px]">
                  <span>
                    {selectedStatuses.length === 0
                      ? "Todos Status"
                      : selectedStatuses.length === 1
                        ? selectedStatuses[0] === 'active' ? 'Ativos' : selectedStatuses[0] === 'completed' ? 'Concluídos' : 'Arquivados'
                        : `${selectedStatuses.length} Selecionados`}
                  </span>
                  <span className="text-[10px] opacity-50">▼</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[180px] bg-background border border-border">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground">Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(['active', 'completed', 'archived'] as const).map(s => (
                  <DropdownMenuCheckboxItem
                    key={s}
                    checked={selectedStatuses.includes(s)}
                    onCheckedChange={() => toggleStatus(s)}
                    onSelect={(e) => e.preventDefault()}
                    className="text-xs font-bold"
                  >
                    {s === 'active' ? 'Ativos' : s === 'completed' ? 'Concluídos' : 'Arquivados'}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card hover:border-primary/50 transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <FolderKanban className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Projetos Ativos</p>
                  <p className="text-3xl font-bold text-foreground">{totalProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover:border-accent/50 transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <ListTodo className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Tarefas</p>
                  <p className="text-3xl font-bold text-foreground">{totalTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover:border-green-500/50 transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                  <p className="text-3xl font-bold text-foreground">{completedTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover:border-amber-500/50 transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                  <p className="text-3xl font-bold text-foreground">{inProgressTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        {totalProjects > 0 && (
          <Card className="glass-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="h-5 w-5 text-primary" />
                Progresso Consolidado
              </CardTitle>
              <CardDescription className="text-base">
                Média de progresso baseada no avanço de todos os macros
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Status Geral</span>
                  <span className="text-4xl font-black text-primary">{Math.round(avgProgress)}%</span>
                </div>
                <div className="relative">
                  <Progress value={avgProgress} className="h-4 rounded-full" />
                  <div className="absolute inset-0 bg-primary/10 blur-xl -z-10" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects List */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-foreground">Projetos Recentes</h2>
            <div className="h-px flex-1 bg-border/50 shadow-sm" />
          </div>

          {filteredProjects.length === 0 ? (
            <Card className="glass-card border-dashed">
              <CardContent className="py-20 text-center">
                <div className="bg-primary/5 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FolderKanban className="h-10 w-10 text-primary/40" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Nenhum projeto encontrado</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8 text-lg">
                  Organize seus fluxos de trabalho criando seu primeiro projeto agora mesmo.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={onNewProject}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all hover:scale-105 shadow-xl font-bold"
                  >
                    Começar agora
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
                const progress = calculateProjectProgress(project.id)
                const projectTasks = tasks.filter(t => t.projectId === project.id)
                const methodology = METHODOLOGY_INFO[project.methodology]

                return (
                  <Card
                    key={project.id}
                    className="glass-card cursor-pointer hover:border-primary transition-all group hover:-translate-y-1 relative overflow-hidden"
                    onClick={() => selectProject(project.id)}
                  >
                    <div
                      className="absolute top-0 left-0 w-1 h-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary" className="bg-secondary/80 backdrop-blur-sm text-[10px] uppercase tracking-tighter font-bold">
                          {methodology.name}
                        </Badge>
                        <div
                          className="h-3 w-3 rounded-full shadow-sm shadow-black/20"
                          style={{ backgroundColor: project.color }}
                        />
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">{project.name}</CardTitle>
                      {project.description && (
                        <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                          {project.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-3 text-sm">
                        <div className="flex justify-between items-center text-muted-foreground font-medium">
                          <span className="flex items-center gap-1.5">
                            <ListTodo className="h-3.5 w-3.5" />
                            {projectTasks.length} tarefas
                          </span>
                          {project.deadline && (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight">
                              <Clock className="h-3 w-3" />
                              {new Date(project.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </div>
                        
                        <div className="relative">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Progresso</span>
                            <span className="font-bold text-foreground">{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-1" />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/10">
                           <div className="flex items-center gap-2">
                             <UserAvatar 
                               name={useProjectStore.getState().users.find(u => u.id === project.ownerId)?.name || 'Owner'} 
                               role="Project Owner"
                               size="xs"
                             />
                             <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[80px]">
                               {useProjectStore.getState().users.find(u => u.id === project.ownerId)?.name.split(' ')[0] || 'Dono'}
                             </span>
                           </div>
                           
                           {((Array.isArray(project.stakeholderIds) && project.stakeholderIds.length > 0) ||
                             parseExternalStakeholders(project.externalStakeholders).length > 0) && (
                             <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60">
                               <Users className="h-2.5 w-2.5" />
                               <span>{(project.stakeholderIds?.length || 0) + parseExternalStakeholders(project.externalStakeholders).length}</span>
                             </div>
                           )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
