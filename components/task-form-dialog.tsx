'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/lib/store'
import { TASK_STATUS_INFO, METHODOLOGY_INFO, autoStatusFromProgress, type Task, type TaskStatus, type Methodology } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { CalendarDays, Zap, Plus, Trash2, Check, User, Users, Link as LinkIcon, FileUp } from 'lucide-react'
import { cn, getFileUrl } from '@/lib/utils'
import { AttachmentPromptDialog } from './attachment-prompt-dialog'

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
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [progress, setProgress] = useState(0)
  const [deadline, setDeadline] = useState('')
  const [sprint, setSprint] = useState<number | undefined>(undefined)
  const [ownerId, setOwnerId] = useState<string>('')
  const [externalOwnerName, setExternalOwnerName] = useState('')
  const [stakeholderIds, setStakeholderIds] = useState<string[]>([])
  const [externalStakeholderNames, setExternalStakeholderNames] = useState<string[]>([])
  const [newExternalStakeholderName, setNewExternalStakeholderName] = useState('')
  const [attachments, setAttachments] = useState<any[]>([])
  const [newAttachmentName, setNewAttachmentName] = useState('')
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('')
  const [showAttachmentInput, setShowAttachmentInput] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false)
  const [pendingTaskData, setPendingTaskData] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { addTask, updateTask, tasks, users, user: currentUser } = useProjectStore()

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
      const deadlineDate = editTask.deadline ? new Date(editTask.deadline) : null
      setDeadline(deadlineDate && !isNaN(deadlineDate.getTime()) ? deadlineDate.toISOString().split('T')[0] : '')
      setSprint(editTask.sprint)
      setOwnerId(editTask.ownerId || (editTask.externalOwnerName ? 'external' : ''))
      setExternalOwnerName(editTask.externalOwnerName || '')
      const safeArray = (data: any) => {
        if (Array.isArray(data)) return data
        if (typeof data === 'string') {
          try {
            const parsed = JSON.parse(data)
            return Array.isArray(parsed) ? parsed : []
          } catch (e) {
            return []
          }
        }
        return []
      }

      setStakeholderIds(safeArray(editTask.stakeholderIds))
      setExternalStakeholderNames(safeArray(editTask.externalStakeholderNames))
      setAttachments(safeArray(editTask.attachments))
    } else {
      setTitle('')
      setDescription('')
      setStatus('todo')
      setProgress(0)
      setDeadline('')
      setSprint(undefined)
      setOwnerId(currentUser?.id || '')
      setExternalOwnerName('')
      setStakeholderIds([])
      setExternalStakeholderNames([])
      setAttachments([])
    }
  }, [editTask, open, currentUser])

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

    taskData.ownerId = ownerId === 'external' ? undefined : ownerId
    taskData.externalOwnerName = ownerId === 'external' ? externalOwnerName.trim() : undefined
    taskData.stakeholderIds = stakeholderIds
    taskData.externalStakeholderNames = externalStakeholderNames
    taskData.attachments = attachments

    const isCompleting = taskData.status === 'done' || taskData.progress === 100
    if (isCompleting && attachments.length === 0) {
      setPendingTaskData(taskData)
      setShowCompletionPrompt(true)
      return
    }

    finalizeSave(taskData)
  }

  const finalizeSave = async (taskData: any) => {
    setIsSubmitting(true)
    try {
      if (editTask) {
        const success = await updateTask(editTask.id, taskData)
        if (success) {
          toast.success('Tarefa atualizada com sucesso!')
          onOpenChange(false)
        } else {
          toast.error('Erro ao atualizar tarefa no servidor. Verifique sua conexão.')
        }
      } else {
        const id = await addTask({
          ...taskData,
          parentId,
          projectId
        })
        if (id) {
          toast.success('Tarefa criada com sucesso!')
          onOpenChange(false)
        } else {
          toast.error('Erro ao criar tarefa no servidor. Verifique sua conexão.')
        }
      }
    } catch (err) {
      toast.error('Ocorreu um erro inesperado ao salvar a tarefa.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePromptConfirm = (attachment?: { name: string; url: string; type: 'link' | 'file' }) => {
    if (pendingTaskData) {
      const finalData = { ...pendingTaskData }
      if (attachment) {
        finalData.attachments = [...(finalData.attachments || []), {
          id: generateId(),
          ...attachment,
          createdAt: new Date()
        }]
      }
      finalizeSave(finalData)
      setShowCompletionPrompt(false)
      setPendingTaskData(null)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setStatus('todo')
    setProgress(0)
    setDeadline('')
    setSprint(undefined)
    setOwnerId('')
    setExternalOwnerName('')
    setStakeholderIds([])
    setExternalStakeholderNames([])
    setNewExternalStakeholderName('')
    setAttachments([])
    setNewAttachmentName('')
    setNewAttachmentUrl('')
    setShowAttachmentInput(false)
  }

  const generateId = () => Math.random().toString(36).substring(2, 11)

  const handleAddAttachment = () => {
    if (!newAttachmentName.trim() || !newAttachmentUrl.trim()) return
    setAttachments(prev => [...prev, { 
      id: generateId(),
      name: newAttachmentName.trim(), 
      url: newAttachmentUrl.trim(),
      type: 'link',
      createdAt: new Date()
    }])
    setNewAttachmentName('')
    setNewAttachmentUrl('')
    setShowAttachmentInput(false)
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(at => at.id !== id))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setAttachments(prev => [...prev, {
          id: generateId(),
          name: data.name,
          url: data.url,
          type: 'file',
          createdAt: new Date()
        }])
        setShowAttachmentInput(false)
      } else {
        alert('Erro ao fazer upload do arquivo')
      }
    } catch (error) {
      console.error('Error uploading:', error)
      alert('Erro de conexão ao fazer upload')
    } finally {
      setIsUploading(false)
    }
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
      <DialogContent className="sm:max-w-lg glass border-none shadow-2xl p-0 overflow-hidden">
        <div className="p-6 pb-2">
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
        </div>

        <ScrollArea className="max-h-[70vh] px-6">
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/20 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> Responsável
              </label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger className="bg-background/50 border-border/50 font-bold">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent className="glass">
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id} className="font-medium">
                      {u.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="external" className="font-bold text-primary italic">
                    Outro / Externo...
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {ownerId === 'external' && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary">Nome do Responsável Externo</label>
                <Input
                  value={externalOwnerName}
                  onChange={(e) => setExternalOwnerName(e.target.value)}
                  placeholder="Digite o nome..."
                  className="bg-primary/5 border-primary/20 h-10 font-bold"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> Stakeholders
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-md bg-background/50 border border-border/50 min-h-[40px]">
                {users.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setStakeholderIds(prev => 
                        prev.includes(u.id) 
                          ? prev.filter(id => id !== u.id) 
                          : [...prev, u.id]
                      )
                    }}
                    className={cn(
                      "group flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all",
                      stakeholderIds.includes(u.id)
                        ? "bg-[#006838] text-white border-[#006838]"
                        : "bg-secondary/50 border-border text-muted-foreground hover:border-[#006838]/50"
                    )}
                  >
                    {u.name}
                    {stakeholderIds.includes(u.id) && <Check className="h-2 w-2" />}
                  </button>
                ))}

                {/* External Stakeholders Badges */}
                {Array.isArray(externalStakeholderNames) && externalStakeholderNames.map((name, idx) => (
                  <div
                    key={`ext-${idx}`}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-primary/10 border-primary/30 text-primary-foreground"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => setExternalStakeholderNames(prev => prev.filter((_, i) => i !== idx))}
                      className="hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add External Stakeholder Input */}
              <div className="flex gap-2">
                <Input
                  value={newExternalStakeholderName}
                  onChange={(e) => setNewExternalStakeholderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (newExternalStakeholderName.trim()) {
                        setExternalStakeholderNames(prev => [...prev, newExternalStakeholderName.trim()])
                        setNewExternalStakeholderName('')
                      }
                    }
                  }}
                  placeholder="Novo Stakeholder Externo..."
                  className="h-8 text-xs bg-background/30"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 px-3 text-[10px] font-bold"
                  variant="outline"
                  onClick={() => {
                    if (newExternalStakeholderName.trim()) {
                      setExternalStakeholderNames(prev => [...prev, newExternalStakeholderName.trim()])
                      setNewExternalStakeholderName('')
                    }
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-border/20 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <LinkIcon className="h-3 w-3" /> Anexos / Evidências
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] gap-1 text-primary hover:bg-primary/10"
                onClick={() => setShowAttachmentInput(!showAttachmentInput)}
              >
                <Plus className="h-3 w-3" /> Adicionar
              </Button>
            </div>

            {showAttachmentInput && (
              <div className="p-3 rounded-lg bg-secondary/20 border border-border/50 space-y-3">
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Anexar Via Link</label>
                   <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Nome (ex: Comprovante)" value={newAttachmentName} onChange={e => setNewAttachmentName(e.target.value)} className="h-8 text-xs font-bold" />
                    <Input placeholder="URL do arquivo" value={newAttachmentUrl} onChange={e => setNewAttachmentUrl(e.target.value)} className="h-8 text-xs font-bold" />
                  </div>
                  <Button type="button" size="sm" onClick={handleAddAttachment} disabled={!newAttachmentName.trim() || !newAttachmentUrl.trim()} className="h-7 text-xs bg-primary w-full">
                    Adicionar Link
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-[8px] uppercase">
                    <span className="bg-background px-2 text-muted-foreground font-bold italic">ou clique abaixo para upload</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                   <div 
                    className={cn(
                      "group border-2 border-dashed border-primary/20 rounded-lg p-3 py-4 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all",
                      isUploading && "opacity-50 pointer-events-none"
                    )}
                    onClick={() => document.getElementById('task-file-upload')?.click()}
                   >
                     <FileUp className="h-5 w-5 text-primary" />
                     <span className="text-[10px] font-bold text-primary">
                       {isUploading ? 'Enviando...' : 'Selecionar Arquivo do PC'}
                     </span>
                     <input 
                       id="task-file-upload" 
                       type="file" 
                       className="hidden" 
                       onChange={handleFileUpload} 
                     />
                   </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAttachmentInput(false)} className="h-7 text-xs text-muted-foreground">Fechar</Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {Array.isArray(attachments) && attachments.map((at) => (
                <div key={at.id} className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-md px-2 py-1 text-[10px] font-bold">
                  <a href={getFileUrl(at.url)} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                    <LinkIcon className="h-2.5 w-2.5" /> {at.name}
                  </a>
                  <button type="button" onClick={() => handleRemoveAttachment(at.id)} className="text-destructive/70 hover:text-destructive ml-1">
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
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

            <DialogFooter className="gap-2 sm:gap-0 pt-6 pb-6 border-t border-border/10 bg-background/50 sticky bottom-0">
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
                disabled={isSubmitting || !title.trim() || (ownerId === 'external' && !externalOwnerName.trim())}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-8 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105"
              >
                {isSubmitting ? 'Salvando...' : editTask ? 'Salvar Alterações' : 'Criar Tarefa'}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>

      <AttachmentPromptDialog 
        open={showCompletionPrompt}
        onOpenChange={setShowCompletionPrompt}
        taskTitle={title}
        onConfirm={handlePromptConfirm}
      />
    </Dialog>
  )
}
