'use client'

import { useProjectStore } from '@/lib/store'
import { TASK_STATUS_INFO, type Task } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Target, Layers, CalendarDays } from 'lucide-react'

interface DiagramNodeProps {
  task: Task
  level: number
}

function DiagramNode({ task, level }: DiagramNodeProps) {
  const { calculateTaskProgress, getChildTasks } = useProjectStore()
  const progress = calculateTaskProgress(task.id)
  const children = getChildTasks(task.id)
  const statusInfo = TASK_STATUS_INFO[task.status]

  return (
    <div className="flex flex-col items-center">
      {/* Task Card (The "Class") */}
      <div className={cn(
        "relative w-64 glass shadow-2xl rounded-xl border-2 transition-all hover:scale-105 duration-300",
        task.status === 'done' ? "border-green-500/50" : task.status === 'in-progress' ? "border-primary/50" : "border-border/50"
      )}>
        {/* Header - Class Name */}
        <div className={cn(
          "px-4 py-2 border-b-2 rounded-t-xl font-black text-xs uppercase tracking-widest text-center",
          task.status === 'done' ? "bg-green-500/10 border-green-500/20 text-green-500" : 
          task.status === 'in-progress' ? "bg-primary/10 border-primary/20 text-primary" : 
          "bg-secondary/40 border-border/20 text-muted-foreground"
        )}>
           {level === 0 ? "<<Macro>>" : "<<Micro>>"}
           <h3 className="text-foreground truncate mt-0.5">{task.title}</h3>
        </div>

        {/* Real Data Section */}
        <div className="p-3 space-y-2.5">
          {/* Status with real label */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground/60">Status</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-[9px] px-2 py-0.5 h-auto font-black border-none",
                task.status === 'done' ? "bg-green-500/15 text-green-500" :
                task.status === 'in-progress' ? "bg-primary/15 text-primary" :
                task.status === 'review' ? "bg-yellow-500/15 text-yellow-600" :
                "bg-muted text-muted-foreground"
              )}
            >
              {statusInfo.name}
            </Badge>
          </div>

          {/* Progress bar with value */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground/60">Progresso</span>
              <span className="text-[11px] font-black text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5 rounded-full" />
          </div>

          {/* Deadline if set */}
          {task.deadline && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground/60 flex items-center gap-1">
                <CalendarDays className="h-2.5 w-2.5" /> Prazo
              </span>
              <span className="text-[10px] font-bold text-foreground">
                {new Date(task.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          )}

          {/* Sprint if set */}
          {task.sprint && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground/60">Sprint</span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-black bg-primary/10 text-primary border-primary/20">
                Sprint {task.sprint}
              </Badge>
            </div>
          )}
        </div>

        {/* Subtask Association Section */}
        {children.length > 0 && (
          <div className="px-3 py-2 border-t border-border/20 bg-secondary/10 rounded-b-xl">
             <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-muted-foreground/60">
                <Layers className="h-2.5 w-2.5" />
                <span>composition {children.length} items</span>
             </div>
          </div>
        )}
      </div>

      {/* Connection Lines and Children */}
      {children.length > 0 && (
        <div className="flex flex-col items-center mt-8 w-full">
           {/* Vertical line from parent */}
           <div className="w-0.5 h-8 bg-border/50" />
           
           {/* Horizontal bridge and children */}
           <div className="relative flex gap-12 pt-8">
              {/* Horizontal bridge line */}
              {children.length > 1 && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-border/50 mx-auto w-[calc(100%-16rem)]" />
              )}
              
              {children.map((child, idx) => (
                <div key={child.id} className="relative flex flex-col items-center">
                   {/* Vertical line to child */}
                   <div className="absolute -top-8 w-0.5 h-8 bg-border/50" />
                   
                   <DiagramNode task={child} level={level + 1} />
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  )
}

interface ProjectDiagramProps {
  projectId: string
}

export function ProjectDiagram({ projectId }: ProjectDiagramProps) {
  const { getRootTasks } = useProjectStore()
  const rootTasks = getRootTasks(projectId)

  return (
    <div className="w-full h-full overflow-auto p-12 bg-dot-grid">
      <div className="flex flex-row items-start justify-center min-w-max gap-16">
        {rootTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-border/30 rounded-3xl opacity-50 glass">
             <Target className="h-12 w-12 text-muted-foreground mb-4" />
             <p className="font-black uppercase tracking-widest text-muted-foreground">O Diagrama está vazio</p>
             <p className="text-sm font-medium text-muted-foreground/60 mt-2">Adicione tarefas macro para visualizar a estrutura.</p>
          </div>
        ) : (
          rootTasks.map(task => (
            <div key={task.id} className="flex-shrink-0 py-4">
               <DiagramNode task={task} level={0} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
