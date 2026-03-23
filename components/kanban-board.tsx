'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { TASK_STATUS_INFO, type Task, type TaskStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  ChevronRight,
  Target,
  CheckCircle2,
  Circle,
  CalendarDays,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface KanbanCardProps {
  task: Task
  onEdit: (task: Task) => void
  onAddSubtask: (parentId: string) => void
}

function KanbanCard({ task, onEdit, onAddSubtask }: KanbanCardProps) {
  const { calculateTaskProgress, deleteTask, getChildTasks, updateTask } = useProjectStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const progress = calculateTaskProgress(task.id)
  const children = getChildTasks(task.id)
  const isDone = task.status === 'done'

  const handleToggleDone = () => {
    if (isDone) {
      updateTask(task.id, { status: 'todo', progress: 0 })
    } else {
      updateTask(task.id, { status: 'done', progress: 100 })
    }
  }

  return (
    <Card className="group glass-card border-none hover:border-primary/30 transition-all mb-3 animate-in-fade shadow-sm hover:shadow-md overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Card Header & Main Info */}
        <div className="flex items-start justify-between gap-2">
          {/* Toggle Done */}
          <button
            onClick={handleToggleDone}
            className={cn(
              "mt-0.5 h-5 w-5 flex items-center justify-center rounded-full transition-all shrink-0",
              isDone ? "text-green-500 hover:text-green-400" : "text-muted-foreground/30 hover:text-primary"
            )}
            title={isDone ? 'Desmarcar conclusão' : 'Marcar como concluído'}
          >
            {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
          </button>

          <div className="flex-1 min-w-0" onClick={() => children.length > 0 && setIsExpanded(!isExpanded)} style={{ cursor: children.length > 0 ? 'pointer' : 'default' }}>
            <h4 className={cn(
              "font-bold text-sm text-foreground leading-snug line-clamp-2 transition-colors group-hover:text-primary",
              isDone && "line-through opacity-60"
            )}>
              {task.title}
            </h4>
            {task.description && (
              <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1 font-medium">
                {task.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit2 className="h-3.5 w-3.5 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddSubtask(task.id)}>
                <Plus className="h-3.5 w-3.5 mr-2" />
                Add Subtarefa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => deleteTask(task.id)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Deadlines & Sprints */}
        {(task.deadline || task.sprint) && (
          <div className="flex flex-wrap gap-2">
            {task.sprint && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-bold bg-primary/10 text-primary border-primary/20">
                <Zap className="h-2.5 w-2.5 mr-0.5" /> Sprint {task.sprint}
              </Badge>
            )}
            {task.deadline && (
              <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/60 bg-secondary/20 px-1.5 py-0.5 rounded-full">
                <CalendarDays className="h-2.5 w-2.5" />
                {new Date(task.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </div>
            )}
          </div>
        )}

        {/* Global Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
            <div className="flex items-center gap-1">
              <Target className="h-2.5 w-2.5" />
              <span>{Math.round(progress)}%</span>
            </div>
            {children.length > 0 && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 hover:text-primary transition-colors bg-secondary/30 px-1.5 py-0.5 rounded-full"
              >
                <span>{children.length} Micros</span>
                <ChevronRight className={cn("h-2.5 w-2.5 transition-transform", isExpanded && "rotate-90")} />
              </button>
            )}
          </div>
          <Progress value={progress} className="h-1 rounded-full bg-secondary" />
        </div>

        {/* Subtasks (Micros) Area */}
        {isExpanded && children.length > 0 && (
          <div className="pt-3 border-t border-border/20 space-y-3 animate-in-fade">
             {children.map(child => {
               const childDone = child.status === 'done'
               return (
                <div key={child.id} className="group/sub space-y-1.5">
                   <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button
                          onClick={() => {
                            if (childDone) {
                              updateTask(child.id, { status: 'todo', progress: 0 })
                            } else {
                              updateTask(child.id, { status: 'done', progress: 100 })
                            }
                          }}
                          className={cn(
                            "h-4 w-4 flex items-center justify-center rounded-full transition-all shrink-0",
                            childDone ? "text-green-500 hover:text-green-400" : "text-muted-foreground/30 hover:text-primary"
                          )}
                          title={childDone ? 'Desmarcar conclusão' : 'Marcar como concluído'}
                        >
                          {childDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                        </button>
                        <div className="flex flex-col min-w-0">
                          <span className={cn(
                            "text-[11px] font-bold text-foreground/80 truncate",
                            childDone && "line-through opacity-60"
                          )}>{child.title}</span>
                          {child.description && (
                            <span className="text-[9px] text-muted-foreground/60 truncate">{child.description}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black text-primary">{child.progress}%</span>
                        {child.deadline && (
                          <span className="text-[8px] font-bold text-muted-foreground/50 flex items-center gap-0.5">
                            <CalendarDays className="h-2 w-2" />
                            {new Date(child.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                   </div>
                   <Progress value={child.progress} className="h-0.5 rounded-full bg-secondary/50" />
                </div>
               )
             })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface KanbanBoardProps {
  projectId: string
  onAddTask: (parentId: string | null) => void
  onEditTask: (task: Task) => void
}

export function KanbanBoard({ projectId, onAddTask, onEditTask }: KanbanBoardProps) {
  const { getProjectTasks } = useProjectStore()
  const allTasks = getProjectTasks(projectId)
  
  // No Kanban, geralmente mostramos as tarefas de nível superior, 
  // ou todas se quisermos uma visão plana. Para o usuário ver "Macros", 
  // mostramos as root tasks.
  const rootTasks = allTasks.filter(t => t.parentId === null)

  const columns: { status: TaskStatus; title: string; color: string }[] = [
    { status: 'todo', title: 'A Fazer', color: 'bg-muted/50' },
    { status: 'in-progress', title: 'Em Progresso', color: 'bg-primary/5' },
    { status: 'review', title: 'Em Revisão', color: 'bg-accent/5' },
    { status: 'done', title: 'Concluído', color: 'bg-green-500/5' },
  ]

  return (
    <div className="flex gap-4 sm:gap-6 h-full overflow-x-auto pb-6 scrollbar-hide touch-pan-x">
      {columns.map((col) => {
        const tasksInCol = rootTasks.filter(t => t.status === col.status)
        
        return (
          <div key={col.status} className="flex-1 min-w-[260px] xs:min-w-[280px] max-w-[350px] flex flex-col h-full">
            <div className={cn(
              "flex items-center justify-between p-3 rounded-t-2xl border-b border-border/50",
              col.color,
              "glass"
            )}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  col.status === 'todo' && "bg-muted-foreground",
                  col.status === 'in-progress' && "bg-primary",
                  col.status === 'review' && "bg-accent",
                  col.status === 'done' && "bg-green-500"
                )} />
                <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
                  {col.title}
                </h3>
                <span className="ml-1 text-[10px] font-bold bg-secondary px-1.5 py-0.5 rounded-full text-muted-foreground">
                  {tasksInCol.length}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-lg hover:bg-primary/10"
                onClick={() => onAddTask(null)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto pt-4 pr-1 space-y-1 scrollbar-hide">
              {tasksInCol.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border/30 rounded-2xl opacity-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vazio</p>
                </div>
              ) : (
                tasksInCol.map(task => (
                  <KanbanCard 
                    key={task.id} 
                    task={task} 
                    onEdit={onEditTask} 
                    onAddSubtask={onAddTask} 
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
