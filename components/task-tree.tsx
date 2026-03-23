'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { TASK_STATUS_INFO, type Task, type TaskStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit2,
  GripVertical,
  CheckCircle2,
  Circle,
  CalendarDays,
  Zap,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

interface TaskNodeProps {
  task: Task
  level: number
  onAddSubtask: (parentId: string) => void
  onEditTask: (task: Task) => void
}

function TaskNode({ task, level, onAddSubtask, onEditTask }: TaskNodeProps) {
  const { getChildTasks, updateTask, deleteTask, calculateTaskProgress } = useProjectStore()
  const [isExpanded, setIsExpanded] = useState(true)
  
  const children = getChildTasks(task.id)
  const hasChildren = children.length > 0
  const calculatedProgress = calculateTaskProgress(task.id)
  const statusInfo = TASK_STATUS_INFO[task.status]
  const isDone = task.status === 'done'

  const handleToggleDone = () => {
    if (isDone) {
      updateTask(task.id, { status: 'todo', progress: 0 })
    } else {
      updateTask(task.id, { status: 'done', progress: 100 })
    }
  }

  const handleStatusChange = (status: TaskStatus) => {
    updateTask(task.id, { 
      status,
      progress: status === 'done' ? 100 : status === 'todo' ? 0 : task.progress
    })
  }

  const handleProgressChange = (value: number[]) => {
    const progress = value[0]
    let status: TaskStatus = task.status
    
    if (progress === 100) {
      status = 'done'
    } else if (progress === 0) {
      status = 'todo'
    } else if (task.status === 'todo' || task.status === 'done') {
      status = 'in-progress'
    }
    
    updateTask(task.id, { progress, status })
  }

  return (
    <div className="select-none mb-1 animate-in-fade" style={{ animationDelay: `${level * 50}ms` }}>
      <div
        className={cn(
          "group flex items-center gap-2 sm:gap-3 py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all duration-300",
          level === 0 ? "bg-card/40 border border-border/50 shadow-sm" : "hover:bg-secondary/40",
          "hover:border-primary/30"
        )}
        style={{ marginLeft: `${level * (typeof window !== 'undefined' && window.innerWidth < 640 ? 12 : 24)}px` }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "h-6 w-6 flex items-center justify-center rounded-lg transition-all",
            hasChildren ? "hover:bg-primary/10 text-primary" : "opacity-0 cursor-default"
          )}
        >
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          )}
        </button>

        {/* Toggle Done */}
        <button
          onClick={handleToggleDone}
          className={cn(
            "h-6 w-6 flex items-center justify-center rounded-full transition-all shrink-0",
            isDone ? "text-green-500 hover:text-green-400" : "text-muted-foreground/40 hover:text-primary"
          )}
          title={isDone ? 'Desmarcar conclusão' : 'Marcar como concluído'}
        >
          {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col min-w-0">
            <span className={cn(
              "font-semibold truncate",
              level === 0 ? "text-sm sm:text-base text-foreground" : "text-[11px] sm:text-sm text-foreground/80",
              isDone && "line-through opacity-60"
            )}>
              {task.title}
            </span>
            {task.description && (
              <span className="text-[10px] sm:text-[11px] text-muted-foreground/70 truncate max-w-[120px] xs:max-w-xs font-medium">
                {task.description}
              </span>
            )}
            {level === 0 && (
              <span className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                Macro
              </span>
            )}
          </div>
          
          <div className="hidden xs:flex items-center gap-2">
            {hasChildren && (
              <Badge variant="outline" className="text-[9px] h-4 px-1 font-bold bg-primary/5 text-primary border-primary/20">
                {children.length} {children.length === 1 ? 'MICRO' : 'MICROS'}
              </Badge>
            )}

            {task.sprint && (
              <Badge variant="outline" className="text-[9px] h-4 px-1 font-bold bg-primary/10 text-primary border-primary/20">
                <Zap className="h-2.5 w-2.5 mr-0.5" /> S{task.sprint}
              </Badge>
            )}
          </div>

          {task.deadline && (
            <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground/60 flex items-center gap-0.5 shrink-0">
              <CalendarDays className="h-2.5 w-2.5" />
              <span className="hidden sm:inline">{new Date(task.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
              <span className="sm:hidden">{new Date(task.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div className="hidden sm:block">
          <Select value={task.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-32 h-8 text-[11px] font-medium bg-background/50 border-none shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(TASK_STATUS_INFO) as [TaskStatus, typeof statusInfo][]).map(
                ([key, info]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {info.name}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Progress */}
        <div className="w-32 flex items-center gap-3">
          {!hasChildren ? (
            <Slider
              value={[task.progress]}
              onValueChange={handleProgressChange}
              max={100}
              step={5}
              className="w-full h-1.5"
            />
          ) : (
            <Progress value={calculatedProgress} className="h-1.5 w-full bg-secondary" />
          )}
          <span className="text-xs font-bold text-foreground tabular-nums min-w-[32px] text-right">
            {Math.round(hasChildren ? calculatedProgress : task.progress)}%
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
            onClick={() => onAddSubtask(task.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass">
              <DropdownMenuItem onClick={() => onEditTask(task)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => deleteTask(task.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="relative mt-1">
          <div 
            className="absolute left-0 top-0 bottom-3 w-px bg-border/40"
            style={{ marginLeft: `${level * 24 + 11}px` }}
          />
          {children.map((child) => (
            <TaskNode
              key={child.id}
              task={child}
              level={level + 1}
              onAddSubtask={onAddSubtask}
              onEditTask={onEditTask}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface TaskTreeProps {
  projectId: string
  onAddTask: (parentId: string | null) => void
  onEditTask: (task: Task) => void
}

export function TaskTree({ projectId, onAddTask, onEditTask }: TaskTreeProps) {
  const { getRootTasks } = useProjectStore()
  const rootTasks = getRootTasks(projectId)

  if (rootTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
          <Plus className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Nenhuma tarefa ainda
        </h3>
        <p className="text-muted-foreground mb-4">
          Adicione tarefas macro para comecar a organizar seu projeto
        </p>
        <Button onClick={() => onAddTask(null)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Tarefa Macro
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {rootTasks.map((task) => (
        <TaskNode
          key={task.id}
          task={task}
          level={0}
          onAddSubtask={onAddTask}
          onEditTask={onEditTask}
        />
      ))}
    </div>
  )
}
