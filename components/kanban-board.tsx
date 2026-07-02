'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { TASK_STATUS_INFO, type Task, type TaskStatus } from '@/lib/types'
import { cn, getFileUrl } from '@/lib/utils'
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
  Users,
  Paperclip,
  AlertCircle
} from 'lucide-react'
import { UserAvatar } from './user-avatar'
import { AttachmentPromptDialog } from './attachment-prompt-dialog'
import { TaskDetailDialog } from './task-detail-dialog'
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
  onCompleteWithAttachment: (task: Task, update: Partial<Task>) => void
  onViewDetails: (task: Task) => void
}


function KanbanSubtaskNode({
  task,
  level = 1,
  onEdit,
  onAddSubtask,
  onCompleteWithAttachment,
  onViewDetails
}: KanbanCardProps & { level?: number }) {
  const { getChildTasks, updateTask, deleteTask } = useProjectStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const children = getChildTasks(task.id)
  const isDone = task.status === 'done'

  const handleToggleDone = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDone) {
      updateTask(task.id, { status: 'todo', progress: 0 })
    } else {
      onCompleteWithAttachment(task, { status: 'done', progress: 100 })
    }
  }

  return (
    <div className="group/sub space-y-1.5 animate-in-fade" style={{ marginLeft: level > 1 ? '12px' : '0' }}>
      <div
        className={cn(
          "flex items-start justify-between gap-2 p-1.5 rounded-lg transition-colors hover:bg-secondary/30",
          level > 1 && "border-l-2 border-primary/20 pl-2"
        )}
      >
        <div
          className="flex items-start gap-2 flex-1 min-w-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            if (children.length > 0) {
              setIsExpanded(!isExpanded)
            } else {
              onViewDetails(task)
            }
          }}
        >
          <button
            onClick={handleToggleDone}
            className={cn(
              "mt-0.5 h-4 w-4 flex items-center justify-center rounded-full transition-all shrink-0",
              isDone ? "text-green-500 hover:text-green-400" : "text-muted-foreground/30 hover:text-primary"
            )}
            title={isDone ? 'Desmarcar conclusão' : 'Marcar como concluído'}
          >
            {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
          </button>
          <div className="flex flex-col min-w-0 flex-1">
            <span className={cn(
              "text-[11px] font-bold text-foreground/80 leading-tight",
              isDone && "line-through opacity-60"
            )}>
              {task.title}
            </span>
            {task.description && (
              <span className="text-[9px] text-muted-foreground/60 truncate mt-0.5">
                {task.description}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                  <Edit2 className="h-3 w-3 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddSubtask(task.id); }}>
                  <Plus className="h-3 w-3 mr-2" />
                  Add Subtarefa
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black text-primary">{task.progress}%</span>
            {children.length > 0 && (
              <span className={cn(
                "flex items-center text-[9px] font-bold transition-colors cursor-pointer",
                isExpanded ? "text-primary" : "text-muted-foreground/50 hover:text-primary"
              )}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
              >
                {children.length} {children.length === 1 ? 'micro' : 'micros'}
                <ChevronRight className={cn("h-3 w-3 ml-0.5 transition-transform", isExpanded && "rotate-90")} />
              </span>
            )}
          </div>
        </div>
      </div>

      {!isDone && task.progress > 0 && (
        <Progress value={task.progress} className="h-0.5 rounded-full bg-secondary/50 mx-1.5" />
      )}

      {isExpanded && children.length > 0 && (
        <div className="pt-1 space-y-1">
          {children.map(child => (
            <KanbanSubtaskNode
              key={child.id}
              task={child}
              level={level + 1}
              onEdit={onEdit}
              onAddSubtask={onAddSubtask}
              onCompleteWithAttachment={onCompleteWithAttachment}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function KanbanCard({ task, onEdit, onAddSubtask, onCompleteWithAttachment, onViewDetails }: KanbanCardProps) {
  const { calculateTaskProgress, deleteTask, getChildTasks, updateTask, users, tasks, taskDependencies } = useProjectStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const progress = calculateTaskProgress(task.id)
  const children = getChildTasks(task.id)
  const isDone = task.status === 'done'

  const handleToggleDone = () => {
    if (isDone) {
      updateTask(task.id, { status: 'todo', progress: 0 })
    } else {
      onCompleteWithAttachment(task, { status: 'done', progress: 100 })
    }
  }

  return (
    <Card
      className="group glass-card border-none hover:border-primary/30 transition-all mb-3 animate-in-fade shadow-sm hover:shadow-md overflow-hidden cursor-pointer"
      onClick={() => onViewDetails(task)}
    >
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

          <div className="flex-1 min-w-0" onClick={(e) => {
            if (children.length > 0) {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }
          }} style={{ cursor: children.length > 0 ? 'pointer' : 'default' }}>
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
            {hasDelayedPredecessor && (
              <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-red-500 bg-red-500/10 w-fit px-1.5 py-0.5 rounded-sm">
                <AlertCircle className="h-3 w-3" />
                <span>Risco: Bloqueada</span>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                <Edit2 className="h-3.5 w-3.5 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddSubtask(task.id); }}>
                <Plus className="h-3.5 w-3.5 mr-2" />
                Add Subtarefa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
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
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
                className="flex items-center gap-1 hover:text-primary transition-colors bg-secondary/30 px-1.5 py-0.5 rounded-full"
              >
                <span>{children.length} Micros</span>
                <ChevronRight className={cn("h-2.5 w-2.5 transition-transform", isExpanded && "rotate-90")} />
              </button>
            )}
          </div>
          <Progress value={progress} className="h-1 rounded-full bg-secondary" />
        </div>

        {/* Card Footer: Owner & Stakeholders */}
        <div className="flex items-center justify-between pt-2 border-t border-border/10">
          <div className="flex items-center gap-1.5">
            <UserAvatar
              name={task.externalOwnerName || users.find(u => u.id === task.ownerId)?.name || 'Responsável'}
              role={task.externalOwnerName ? 'Externo' : 'Responsável'}
              size="xs"
              className="opacity-80"
            />
            <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[80px]">
              {task.externalOwnerName ? task.externalOwnerName.split(' ')[0] : (users.find(u => u.id === task.ownerId)?.name.split(' ')[0] || 'Dono')}
            </span>
          </div>

          {((task.stakeholderIds?.length || 0) + (task.externalStakeholderNames?.length || 0)) > 0 && (
            <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/40">
              <Users className="h-2.5 w-2.5" />
              <span>{(task.stakeholderIds?.length || 0) + (task.externalStakeholderNames?.length || 0)}</span>
            </div>
          )}

          {Array.isArray(task.attachments) && task.attachments.length > 0 && (
            <div className="flex items-center gap-1 text-[9px] font-bold text-blue-500/60">
              <Paperclip className="h-2.5 w-2.5" />
              <span>{task.attachments.length}</span>
            </div>
          )}
        </div>

        {/* Attachment Links (Inline Visibility) */}
        {Array.isArray(task.attachments) && task.attachments.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-2">
            {task.attachments.map((at: any) => (
              <a
                key={at.id}
                href={getFileUrl(at.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 text-[8px] font-bold text-blue-600 transition-colors"
                title={at.name}
              >
                <Paperclip className="h-2 w-2" />
                <span className="truncate max-w-[60px]">{at.name}</span>
              </a>
            ))}
          </div>
        )}

        {/* Subtasks (Micros) Area */}
        {isExpanded && children.length > 0 && (
          <div className="pt-3 border-t border-border/20 space-y-2 animate-in-fade" onClick={(e) => e.stopPropagation()}>
            {children.map(child => (
              <KanbanSubtaskNode
                key={child.id}
                task={child}
                onEdit={onEdit}
                onAddSubtask={onAddSubtask}
                onCompleteWithAttachment={onCompleteWithAttachment}
                onViewDetails={onViewDetails}
              />
            ))}
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
  const { getProjectTasks, updateTask } = useProjectStore()
  const [completionPromptInfo, setCompletionPromptInfo] = useState<{ task: Task, update: Partial<Task> } | null>(null)
  const [detailTask, setDetailTask] = useState<Task | null>(null)

  const allTasks = getProjectTasks(projectId)

  const handleCompleteWithAttachment = (task: Task, update: Partial<Task>) => {
    setCompletionPromptInfo({ task, update })
  }

  const handleAttachmentConfirm = (attachment?: { name: string; url: string; type: 'link' | 'file' }) => {
    if (completionPromptInfo) {
      const { task, update } = completionPromptInfo
      const finalUpdates = { ...update }

      if (attachment) {
        finalUpdates.attachments = [...(task.attachments || []), {
          id: Math.random().toString(36).substring(2, 11),
          ...attachment,
          createdAt: new Date()
        }]
      }

      updateTask(task.id, finalUpdates)
      setCompletionPromptInfo(null)
    }
  }

  const displayTasks = allTasks.filter(t => t.parentId === null)

  const columns: { status: TaskStatus; title: string; color: string }[] = [
    { status: 'todo', title: 'A Fazer', color: 'bg-muted/50' },
    { status: 'in-progress', title: 'Em Progresso', color: 'bg-primary/5' },
    { status: 'review', title: 'Em Revisão', color: 'bg-accent/5' },
    { status: 'done', title: 'Concluído', color: 'bg-green-500/5' },
  ]

  return (
    <div className="flex gap-4 sm:gap-6 h-full overflow-x-auto pb-6 scrollbar-hide touch-pan-x">
      {columns.map((col) => {
        const tasksInCol = displayTasks.filter(t => t.status === col.status)

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
                    onCompleteWithAttachment={handleCompleteWithAttachment}
                    onViewDetails={setDetailTask}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}

      {completionPromptInfo && (
        <AttachmentPromptDialog
          open={!!completionPromptInfo}
          onOpenChange={(open) => !open && setCompletionPromptInfo(null)}
          taskTitle={completionPromptInfo.task.title}
          onConfirm={handleAttachmentConfirm}
        />
      )}

      <TaskDetailDialog
        task={detailTask}
        open={!!detailTask}
        onOpenChange={(open) => !open && setDetailTask(null)}
      />
    </div>
  )
}
