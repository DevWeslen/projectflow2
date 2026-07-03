'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Link as LinkIcon, Trash2 } from 'lucide-react'
import { TASK_STATUS_INFO } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TaskDependenciesManagerProps {
  taskId: string
  projectId: string
}

export function TaskDependenciesManager({ taskId, projectId }: TaskDependenciesManagerProps) {
  const { tasks, taskDependencies, addTaskDependency, removeTaskDependency } = useProjectStore()
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [isAdding, setIsAdding] = useState(false)

  // As tarefas possíveis para vincular são todas as do mesmo projeto, exceto ela mesma
  const availableTasks = tasks.filter(t => t.projectId === projectId && t.id !== taskId)

  // Dependências onde esta tarefa é sucessora (espera as outras)
  const predecessorsDeps = taskDependencies.filter(d => d.successorId === taskId)
  // Dependências onde esta tarefa é predecessora (bloqueia as outras)
  const successorsDeps = taskDependencies.filter(d => d.predecessorId === taskId)

  const handleAdd = async () => {
    if (!selectedTaskId) return
    setIsAdding(true)
    await addTaskDependency(selectedTaskId, taskId, 'finish_to_start')
    setSelectedTaskId('')
    setIsAdding(false)
  }

  const handleRemove = async (predId: string, succId: string) => {
    await removeTaskDependency(predId, succId)
  }

  // Riscos: Se uma tarefa predecessora está atrasada (ou se alguma dependência dela está atrasada)
  const isDelayed = (taskId: string, visited: Set<string> = new Set()): boolean => {
    if (visited.has(taskId)) return false // Previne loops infinitos
    visited.add(taskId)

    const task = tasks.find(t => t.id === taskId)
    if (!task) return false

    // Se a tarefa atual não está concluída e já passou do prazo
    if (task.status !== 'done' && task.deadline && new Date() > new Date(task.deadline)) {
      return true
    }

    // Verifica recursivamente as predecessoras desta tarefa
    const predecessorsDepsForTask = taskDependencies.filter(d => d.successorId === taskId)
    for (const dep of predecessorsDepsForTask) {
      if (isDelayed(dep.predecessorId, visited)) {
        return true
      }
    }

    return false
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        <LinkIcon className="h-4 w-4" />
        Vínculos & Dependências
      </div>

      <div className="bg-secondary/10 rounded-2xl p-4 border border-border/10 space-y-4">
        
        {/* Adicionar Dependência */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
            <SelectTrigger className="flex-1 min-w-0 bg-background text-xs font-bold h-9">
              <div className="truncate text-left w-[90%]"><SelectValue placeholder="Selecione uma tarefa para vincular..." /></div>
            </SelectTrigger>
            <SelectContent>
              {availableTasks.map(t => (
                <SelectItem key={t.id} value={t.id} className="text-xs font-bold">
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            size="sm" 
            variant="secondary" 
            className="text-xs font-black uppercase"
            onClick={handleAdd}
            disabled={!selectedTaskId || isAdding}
          >
            Vincular
          </Button>
        </div>

        {/* Lista de Predecessoras (Depende de) */}
        {predecessorsDeps.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="text-[10px] font-black uppercase text-muted-foreground">Depende de (Bloqueantes):</h4>
            <div className="space-y-2">
              {predecessorsDeps.map(dep => {
                const pTask = tasks.find(t => t.id === dep.predecessorId)
                if (!pTask) return null
                const delayed = isDelayed(pTask.id)
                const statusInfo = TASK_STATUS_INFO[pTask.status]

                return (
                  <div key={dep.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/50">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">{pTask.title}</span>
                        <Badge className={cn("text-[9px] font-black uppercase px-1.5 py-0", statusInfo.color)}>
                          {statusInfo.name}
                        </Badge>
                      </div>
                      {delayed && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          <span>Risco: Tarefa bloqueante em atraso!</span>
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground hover:text-red-500"
                      onClick={() => handleRemove(dep.predecessorId, taskId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Lista de Sucessoras (Bloqueia) */}
        {successorsDeps.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="text-[10px] font-black uppercase text-muted-foreground">Bloqueia (Sucessoras):</h4>
            <div className="space-y-2">
              {successorsDeps.map(dep => {
                const sTask = tasks.find(t => t.id === dep.successorId)
                if (!sTask) return null
                const statusInfo = TASK_STATUS_INFO[sTask.status]

                return (
                  <div key={dep.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/50">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">{sTask.title}</span>
                        <Badge className={cn("text-[9px] font-black uppercase px-1.5 py-0", statusInfo.color)}>
                          {statusInfo.name}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground hover:text-red-500"
                      onClick={() => handleRemove(taskId, dep.successorId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
