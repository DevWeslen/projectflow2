'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/lib/store'
import { TASK_STATUS_INFO, METHODOLOGY_INFO, autoStatusFromProgress, type Task, type TaskStatus, type Methodology } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Zap } from 'lucide-react'

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  parentId: string | null
  editTask?: Task | null
  methodology?: Methodology
}

export function TaskFormDialog({
  open,
  onOpenChange,
  projectId,
  parentId,
  editTask,
  methodology = 'kanban',
}: TaskFormDialogProps) {
  const { addTask, updateTask, tasks } = useProjectStore()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [progress, setProgress] = useState(0)
  const [deadline, setDeadline] = useState('')
  const [sprint, setSprint] = useState<number | undefined>(undefined)

  // Get parent task name for context
  const parentTask = parentId ? tasks.find(t => t.id === parentId) : null
  const isKanban = methodology === 'kanban'
  const isScrum = methodology === 'scrum'
  const methodologyInfo = METHODOLOGY_INFO[methodology]

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title)
      setDescription(editTask.description || '')
      setStatus(editTask.status)
      setProgress(editTask.progress)
      setDeadline(editTask.deadline ? new Date(editTask.deadline).toISOString().split('T')[0] : '')
      setSprint(editTask.sprint)
    } else {
      setTitle('')
      setDescription('')
      setStatus('todo')
      setProgress(0)
      setDeadline('')
      setSprint(undefined)
    }
  }, [editTask, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) return

    const taskData: any = {
      title: title.trim(),
      description: description.trim() || undefined,
      status: isKanban ? autoStatusFromProgress(progress) : status,
      progress,
      deadline: deadline ? new Date(deadline) : undefined,
    }

    if (isScrum && sprint !== undefined) {
      taskData.sprint = sprint
    }

    if (editTask) {
      updateTask(editTask.id, taskData)
    } else {
      addTask({
        ...taskData,
        parentId,
        projectId
      })
    }

    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setStatus('todo')
    setProgress(0)
    setDeadline('')
    setSprint(undefined)
  }

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus)
    if (newStatus === 'done') {
      setProgress(100)
    } else if (newStatus === 'todo') {
      setProgress(0)
    }
  }

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0]
    setProgress(newProgress)
    
    if (isKanban) {
      // Auto-calculate status for Kanban
      setStatus(autoStatusFromProgress(newProgress))
    } else {
      if (newProgress === 100) {
        setStatus('done')
      } else if (newProgress === 0) {
        setStatus('todo')
      } else if (status === 'todo' || status === 'done') {
        setStatus('in-progress')
      }
    }
  }

  // Kanban auto-status label
  const kanbanStatusLabel = autoStatusFromProgress(progress)
  const kanbanStatusInfo = TASK_STATUS_INFO[kanbanStatusLabel]

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm()
      onOpenChange(value)
    }}>
      <DialogContent className="sm:max-w-lg glass border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-gradient">
            {editTask ? 'Editar Tarefa' : parentId ? 'Nova Subtarefa' : 'Nova Tarefa Macro'}
          </DialogTitle>
          <DialogDescription className="font-medium text-muted-foreground/80">
            {parentTask && (
              <span>Organize a execução de: <strong className="text-foreground">{parentTask.title}</strong></span>
            )}
            {!parentTask && !editTask && (
              <span>Defina uma nova etapa principal para a estrutura do seu projeto.</span>
            )}
            {editTask && <span>Ajuste os detalhes e acompanhe a evolução desta tarefa.</span>}
          </DialogDescription>
          <Badge variant="outline" className="w-fit mt-1 text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider">
            {methodologyInfo.icon} {methodologyInfo.name}
          </Badge>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Título da Tarefa</label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Desenvolver API de Autenticação"
                className="bg-background/50 border-border/50 focus:border-primary transition-all h-12 text-base font-semibold"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Descrição (opcional)</label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes sobre o que precisa ser feito..."
                className="bg-background/50 border-border/50 focus:border-primary transition-all text-sm font-medium"
                rows={2}
              />
            </div>
          </div>

          {/* Methodology-specific fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sprint field for Scrum */}
            {isScrum && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Sprint
                </label>
                <Input
                  type="number"
                  min={1}
                  value={sprint || ''}
                  onChange={(e) => setSprint(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Nº do Sprint"
                  className="bg-background/50 border-border/50 font-bold"
                />
              </div>
            )}

            {/* Deadline field for all */}
            <div className={`space-y-2 ${isScrum ? '' : 'sm:col-span-2'}`}>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> Prazo Final
              </label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-background/50 border-border/50 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-secondary/20 border border-border/50">
            {/* Status field — hidden for Kanban (auto-calculated) */}
            {isKanban ? (
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status (Automático)</label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-md bg-background/50 border border-border/50">
                  <div className={`h-2 w-2 rounded-full ${
                    kanbanStatusLabel === 'done' ? 'bg-green-500' :
                    kanbanStatusLabel === 'review' ? 'bg-yellow-500' :
                    kanbanStatusLabel === 'in-progress' ? 'bg-primary' : 'bg-muted-foreground'
                  }`} />
                  <span className="text-sm font-bold">{kanbanStatusInfo.name}</span>
                </div>
                <p className="text-[9px] text-muted-foreground/60 font-medium">
                  0% = A Fazer • 1-84% = Em Progresso • 85-99% = Em Revisão • 100% = Concluído
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status Atual</label>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="bg-background/50 border-border/50 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    {(Object.entries(TASK_STATUS_INFO) as [TaskStatus, typeof TASK_STATUS_INFO[TaskStatus]][]).map(
                      ([key, info]) => (
                        <SelectItem key={key} value={key} className="font-medium">
                          {info.name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Progresso</label>
                <span className="text-sm font-black text-primary">{progress}%</span>
              </div>
              <Slider
                value={[progress]}
                onValueChange={handleProgressChange}
                max={100}
                step={5}
                className="py-4"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="font-bold text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!title.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-8 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105"
            >
              {editTask ? 'Salvar Alterações' : 'Criar Tarefa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
