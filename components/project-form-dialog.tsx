'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { METHODOLOGY_INFO, PROJECT_COLORS, type Methodology } from '@/lib/types'
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
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectFormDialog({ open, onOpenChange }: ProjectFormDialogProps) {
  const { addProject } = useProjectStore()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [methodology, setMethodology] = useState<Methodology>('kanban')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [sprintDuration, setSprintDuration] = useState('2') // Default 2 weeks
  const [totalSprints, setTotalSprints] = useState('4') // Default 4 sprints

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) return

    addProject({
      name: name.trim(),
      description: description.trim() || undefined,
      methodology,
      color,
      deadline: deadline ? new Date(deadline) : undefined,
      sprintDuration: methodology === 'scrum' ? Number(sprintDuration) : undefined,
      totalSprints: methodology === 'scrum' ? Number(totalSprints) : undefined
    })

    // Reset form
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setDeadline('')
    setMethodology('kanban')
    setColor(PROJECT_COLORS[0])
    setSprintDuration('2')
    setTotalSprints('4')
  }

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm()
      onOpenChange(value)
    }}>
      <DialogContent className="w-[95vw] sm:max-w-xl glass border-none shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-black text-gradient">Novo Projeto</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm font-medium text-muted-foreground/80">
            Crie um novo projeto e escolha a metodologia ágil ideal para seu time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mt-2 sm:mt-4">
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="name" className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">Nome do Projeto</label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Redesign do App"
                  className="bg-background/50 border-border/50 focus:border-primary transition-all h-10 sm:h-12 text-sm sm:text-base font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="deadline" className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">Data Final (Prazo)</label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary transition-all h-10 sm:h-12 text-sm sm:text-base font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="description" className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">Descrição (opcional)</label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o objetivo do projeto..."
                className="bg-background/50 border-border/50 focus:border-primary transition-all text-sm font-medium"
                rows={2}
              />
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">Identidade Visual</label>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center shadow-lg",
                    color === c ? "scale-110 ring-4 ring-primary/20" : "hover:scale-105 opacity-80 hover:opacity-100"
                  )}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow-md" />}
                </button>
              ))}
            </div>
          </div>

          {/* Methodology Selection */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">Metodologia Ágil</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {(Object.entries(METHODOLOGY_INFO) as [Methodology, typeof METHODOLOGY_INFO[Methodology]][]).map(
                ([key, info]) => (
                  <TooltipProvider key={key} delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setMethodology(key)}
                          className={cn(
                            "group flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 text-left w-full",
                            methodology === key
                              ? "border-primary bg-primary/10 shadow-lg shadow-primary/5"
                              : "border-border/50 bg-secondary/20 hover:border-primary/30 hover:bg-secondary/40"
                          )}
                        >
                          <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform shrink-0">{info.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-bold text-xs sm:text-sm transition-colors",
                              methodology === key ? "text-primary" : "text-foreground"
                            )}>
                              {info.name}
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-tight line-clamp-1 mt-0.5">
                              {info.description}
                            </p>
                          </div>
                          {methodology === key && (
                            <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary flex items-center justify-center animate-in-fade shrink-0">
                              <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                            </div>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs p-4 glass border-none shadow-2xl hidden sm:block">
                        <p className="font-bold text-sm text-foreground mb-1">{info.icon} {info.name}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {info.longDescription}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              )}
            </div>
          </div>

          {/* Scrum Specific Settings */}
          {methodology === 'scrum' && (
            <div className="p-3 sm:p-4 rounded-2xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary mb-3">Configurações de Sprint</p>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="sprintDuration" className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase">Duração (Semanas)</label>
                  <Input
                    id="sprintDuration"
                    type="number"
                    min="1"
                    max="8"
                    value={sprintDuration}
                    onChange={(e) => setSprintDuration(e.target.value)}
                    className="bg-background/50 border-border/50 focus:border-primary transition-all h-9 sm:h-10 text-xs sm:text-sm font-semibold"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="totalSprints" className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase">Total de Sprints</label>
                  <Input
                    id="totalSprints"
                    type="number"
                    min="1"
                    max="52"
                    value={totalSprints}
                    onChange={(e) => setTotalSprints(e.target.value)}
                    className="bg-background/50 border-border/50 focus:border-primary transition-all h-9 sm:h-10 text-xs sm:text-sm font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-row gap-2 sm:gap-0 pt-2 border-t border-border/20 mt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none font-bold text-muted-foreground h-10 sm:h-11"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim()}
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground font-black px-4 sm:px-8 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 h-10 sm:h-11"
            >
              Criar Projeto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

  )
}
