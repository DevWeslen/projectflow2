'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { METHODOLOGY_INFO } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { FolderKanban, ListTodo, CheckCircle2, Clock, TrendingUp, Sparkles } from 'lucide-react'

interface DashboardProps {
  onNewProject: () => void
}

export function Dashboard({ onNewProject }: DashboardProps) {
  const { 
    projects, 
    tasks, 
    calculateProjectProgress, 
    selectProject, 
    seedExamples,
    user
  } = useProjectStore()

  const filteredProjects = projects.filter(project => {
    if (!user) return false
    if (['admin', 'conselho', 'diretoria'].includes(user.role)) return true
    if (project.ownerId === user.id) return true
    if (project.memberIds?.includes(user.id)) return true
    return false
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
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight uppercase">
              Olá, {user?.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md">
              Aqui está a visão geral dos seus projetos e progresso.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => seedExamples()}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-primary/20 text-primary rounded-full hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-medium glass"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="truncate">Gerar Demos</span>
            </button>
            <button
              onClick={onNewProject}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
            >
              <FolderKanban className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="truncate">Novo Projeto</span>
            </button>
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
                Média de progresso baseada na mediana de todos os macros
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
                    onClick={() => seedExamples()}
                    className="inline-flex items-center gap-2 px-8 py-3 border border-primary/20 text-primary rounded-full hover:bg-primary/5 transition-all font-bold glass"
                  >
                    <Sparkles className="h-5 w-5" />
                    Gerar Exemplos
                  </button>
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
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Progresso</span>
                          <span className="font-bold text-foreground">{Math.round(progress)}%</span>
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
