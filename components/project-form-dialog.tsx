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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) return

    addProject({
      name: name.trim(),
      description: description.trim() || undefined,
      methodology,
      color,
      deadline: deadline ? new Date(deadline) : undefined
    })

    // Reset form
    setName('')
    setDescription('')
    setDeadline('')
    setMethodology('kanban')
    setColor(PROJECT_COLORS[0])
    onOpenChange(false)
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setDeadline('')
    setMethodology('kanban')
    setColor(PROJECT_COLORS[0])
  }

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm()
      onOpenChange(value)
    }}>
      <DialogContent className="sm:max-w-xl glass border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-gradient">Novo Projeto</DialogTitle>
          <DialogDescription className="font-medium text-muted-foreground/80">
            Crie um novo projeto e escolha a metodologia agil ideal para seu time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nome do Projeto</label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Redesign do App"
                  className="bg-background/50 border-border/50 focus:border-primary transition-all h-12 text-base font-semibold"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="deadline" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Data Final (Prazo)</label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary transition-all h-12 text-base font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Descrição (opcional)</label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o objetivo do projeto..."
                className="bg-background/50 border-border/50 focus:border-primary transition-all text-sm font-medium"
                rows={3}
              />
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Identidade Visual</label>
            <div className="flex flex-wrap gap-3">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-10 w-10 rounded-2xl transition-all flex items-center justify-center shadow-lg",
                    color === c ? "scale-110 ring-4 ring-primary/20" : "hover:scale-105 opacity-80 hover:opacity-100"
                  )}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="h-5 w-5 text-white drop-shadow-md" />}
                </button>
              ))}
            </div>
          </div>

          {/* Methodology Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Metodologia Ágil</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.entries(METHODOLOGY_INFO) as [Methodology, typeof METHODOLOGY_INFO[Methodology]][]).map(
                ([key, info]) => (
                  <TooltipProvider key={key} delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setMethodology(key)}
                          className={cn(
                            "group flex items-start gap-3 p-4 rounded-2xl border transition-all duration-300 text-left w-full",
                            methodology === key
                              ? "border-primary bg-primary/10 shadow-lg shadow-primary/5"
                              : "border-border/50 bg-secondary/20 hover:border-primary/30 hover:bg-secondary/40"
                          )}
                        >
                          <span className="text-2xl group-hover:scale-110 transition-transform shrink-0">{info.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-bold text-sm transition-colors",
                              methodology === key ? "text-primary" : "text-foreground"
                            )}>
                              {info.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight line-clamp-1 mt-0.5">
                              {info.description}
                            </p>
                          </div>
                          {methodology === key && (
                            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center animate-in-fade shrink-0">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs p-4 glass border-none shadow-2xl">
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
              disabled={!name.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-8 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105"
            >
              Criar Projeto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
