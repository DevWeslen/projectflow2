'use client'

import { useProjectStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CalendarDays, CheckCircle2, AlertCircle, Clock, Paperclip } from 'lucide-react'
import { format, differenceInDays, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProjectTimelineProps {
  projectId: string
}

export function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const { tasks } = useProjectStore()
  const projectTasks = tasks.filter(t => t.projectId === projectId)

  // Sort tasks by deadline or actual start date
  const sortedTasks = [...projectTasks].sort((a, b) => {
    const dateA = a.actualStartDate || a.deadline || new Date(0)
    const dateB = b.actualStartDate || b.deadline || new Date(0)
    return new Date(dateA).getTime() - new Date(dateB).getTime()
  })

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in-fade">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-black text-foreground tracking-tight">Linha do Tempo</h3>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Acompanhamento: Previsto vs. Realizado</p>
      </div>

      <div className="relative border-l-2 border-border/50 ml-4 pl-8 space-y-10 pb-10">
        {sortedTasks.map((task, idx) => {
          const deadline = task.deadline ? new Date(task.deadline) : null
          const actualEnd = task.actualEndDate ? new Date(task.actualEndDate) : null
          const isOverdue = deadline && !actualEnd && isAfter(new Date(), deadline) && task.status !== 'done'
          const finishedLate = deadline && actualEnd && isAfter(actualEnd, deadline)
          const daysDiff = deadline && actualEnd ? differenceInDays(actualEnd, deadline) : 
                           deadline && !actualEnd && isAfter(new Date(), deadline) ? differenceInDays(new Date(), deadline) : 0

          return (
            <div key={task.id} className="relative group animate-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
              {/* Timeline dot */}
              <div className={cn(
                "absolute -left-[41px] top-0 h-6 w-6 rounded-full border-4 border-background shadow-lg transition-transform group-hover:scale-125 z-10",
                task.status === 'done' ? "bg-green-500" : 
                isOverdue ? "bg-destructive animate-pulse" : "bg-primary"
              )} />

              <Card className="glass-card border-none overflow-hidden hover:ring-1 hover:ring-primary/20 transition-all">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <h4 className="font-bold text-foreground text-sm sm:text-base">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[9px] uppercase font-black tracking-tighter h-4">
                          {task.status}
                        </Badge>
                        {task.progress > 0 && (
                           <span className="text-[10px] font-black text-primary">{task.progress}%</span>
                        )}
                      </div>
                    </div>
                    {task.status === 'done' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    ) : isOverdue ? (
                      <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                    ) : (
                      <Clock className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-secondary/20 border border-border/50 space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> Previsto (Prazo)
                      </p>
                      <p className="text-sm font-black text-foreground">
                        {deadline ? format(deadline, "dd 'de' MMM, yyyy", { locale: ptBR }) : 'Nenhum definido'}
                      </p>
                    </div>

                    <div className={cn(
                      "p-3 rounded-xl border space-y-1 transition-colors",
                      finishedLate || isOverdue ? "bg-destructive/10 border-destructive/20" : "bg-secondary/20 border-border/50"
                    )}>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Realizado (Entrega)
                      </p>
                      <p className="text-sm font-black text-foreground">
                        {actualEnd ? format(actualEnd, "dd 'de' MMM, yyyy", { locale: ptBR }) : 
                         task.status === 'done' ? 'Concluído (Data não registrada)' : 'Aguardando...'}
                      </p>
                    </div>
                  </div>

                  {(finishedLate || isOverdue) && (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-[11px] font-bold uppercase tracking-tight">
                        {finishedLate ? `Finalizado com ${daysDiff} dias de atraso` : `Atrasado em ${daysDiff} dias`}
                      </p>
                    </div>
                  )}

                  {!finishedLate && !isOverdue && actualEnd && deadline && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <p className="text-[11px] font-bold uppercase tracking-tight">Entregue no prazo</p>
                    </div>
                  )}

                  {Array.isArray(task.attachments) && task.attachments.length > 0 && (
                    <div className="pt-4 border-t border-border/30">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1 mb-2">
                        <Paperclip className="h-2.5 w-2.5" /> Evidências do Projeto
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {task.attachments.map((at: any) => (
                           <a 
                             key={at.id}
                             href={at.url}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 text-[10px] font-black text-blue-600 transition-all hover:scale-105"
                           >
                              <Paperclip className="h-2.5 w-2.5" />
                              {at.name}
                           </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}

        {sortedTasks.length === 0 && (
          <div className="text-center py-10 opacity-50">
            <p className="text-sm font-medium italic">Nenhuma tarefa encontrada para exibir na linha do tempo.</p>
          </div>
        )}
      </div>
    </div>
  )
}
