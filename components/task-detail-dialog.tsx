'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  User as UserIcon, 
  Users, 
  Paperclip, 
  Target, 
  Clock, 
  AlertCircle,
  FileText,
  Link as LinkIcon,
  CheckCircle2
} from 'lucide-react'
import { useProjectStore } from '@/lib/store'
import { TASK_STATUS_INFO, type Task } from '@/lib/types'
import { cn, getFileUrl } from '@/lib/utils'
import { UserAvatar } from './user-avatar'
import { TaskDependenciesManager } from './task-dependencies-manager'

interface TaskDetailDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
  const { users } = useProjectStore()
  
  if (!task) return null

  const statusInfo = TASK_STATUS_INFO[task.status]
  const owner = task.externalOwnerName || users.find(u => u.id === task.ownerId)?.name || 'Nao atribuído'
  
  const stakeholders = [
    ...(task.stakeholderIds || []).map(id => users.find(u => u.id === id)?.name).filter(Boolean),
    ...(task.externalStakeholderNames || [])
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[550px] md:max-w-[650px] max-h-[90vh] overflow-hidden flex flex-col glass border-none shadow-2xl p-0">
        <DialogHeader className="p-4 sm:p-5 pb-2">
          <div className="flex items-center justify-between gap-4 mb-2">
            <Badge className={cn("text-[10px] font-black uppercase px-2.5 py-0.5", statusInfo.color)}>
              {statusInfo.name}
            </Badge>
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              ID: {task.id.substring(0, 8)}
            </div>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground leading-tight">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pt-2">
          <div className="space-y-4 sm:space-y-5">
            {/* Progress Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Target className="h-4 w-4 text-primary" />
                  Progresso Atual
                </div>
                <span className="text-xl font-black text-primary">{Math.round(task.progress)}%</span>
              </div>
              <Progress value={task.progress} className="h-2 rounded-full" />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <FileText className="h-4 w-4" />
                Descrição
              </div>
              <div className="bg-secondary/10 rounded-xl p-3 border border-border/10">
                <p className="text-sm leading-snug text-foreground/80 whitespace-pre-wrap">
                  {task.description || 'Nenhuma descrição fornecida.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ownership */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <UserIcon className="h-4 w-4" />
                    Responsável
                  </div>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={owner} role="Owner" size="sm" />
                    <span className="text-sm font-bold">{owner}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Interessados
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stakeholders.length > 0 ? (
                      stakeholders.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] font-bold bg-background/50">
                          {s}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Nenhum interessado</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates & More */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Prazos
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-muted-foreground/60">Prazo Final:</span>
                      <span className="font-black">
                        {task.deadline ? new Date(task.deadline).toLocaleDateString('pt-BR') : 'Nao definido'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-muted-foreground/60">Início Real:</span>
                      <span className="font-black">
                        {task.actualStartDate ? new Date(task.actualStartDate).toLocaleDateString('pt-BR') : 'Nao iniciado'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-muted-foreground/60">Fim Real:</span>
                      <span className="font-black text-emerald-600">
                        {task.actualEndDate ? new Date(task.actualEndDate).toLocaleDateString('pt-BR') : 'Em andamento'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {task.sprint && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Ciclo / Sprint
                    </div>
                    <Badge className="bg-primary/10 text-primary border-none font-black text-xs">
                      Sprint {task.sprint}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Dependencies */}
            <TaskDependenciesManager taskId={task.id} projectId={task.projectId} />

            {/* Attachments */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <Paperclip className="h-4 w-4" />
                Anexos e Evidências ({task.attachments?.length || 0})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {task.attachments && task.attachments.length > 0 ? (
                  task.attachments.map((at) => (
                    <a
                      key={at.id}
                      href={getFileUrl(at.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={at.name}
                      className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50 hover:border-primary/50 transition-all group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <LinkIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{at.name}</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-black">
                          {new Date(at.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center border-2 border-dashed border-border/30 rounded-2xl opacity-50">
                    <Paperclip className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs font-bold">Nenhum anexo encontrado</p>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-border/10 flex items-center justify-between opacity-40">
              <div className="text-[9px] font-bold uppercase tracking-widest">
                Criado em {new Date(task.createdAt).toLocaleDateString('pt-BR')}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest">
                Atualizado em {new Date(task.updatedAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
