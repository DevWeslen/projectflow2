'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { RISK_ANALYSIS_INFO, type RiskAnalysisType } from '@/lib/types'
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
import { cn } from '@/lib/utils'
import { Check, ShieldAlert } from 'lucide-react'

interface RiskAnalysisDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RiskAnalysisDialog({ projectId, open, onOpenChange }: RiskAnalysisDialogProps) {
  const { addRiskAnalysis } = useProjectStore()
  
  const [title, setTitle] = useState('')
  const [type, setType] = useState<RiskAnalysisType>('swot')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    // Initialize data based on type
    let initialData = {}
    switch (type) {
      case 'swot':
        initialData = { strengths: [], weaknesses: [], opportunities: [], threats: [] }
        break
      case '5whys':
        initialData = { issue: '', whys: ['', '', '', '', ''], rootCause: '' }
        break
      case '5w2h':
        initialData = { 
          what: '', why: '', where: '', when: '', who: '', how: '', howMuch: '' 
        }
        break
      case 'fishbone':
        initialData = { problem: '', categories: { 
          method: [], machine: [], material: [], measurement: [], motherNature: [], manpower: [] 
        }}
        break
      case 'pareto':
        initialData = { problems: [{ name: '', occurrence: 0 }] }
        break
    }

    addRiskAnalysis({
      projectId,
      title: title.trim(),
      type,
      data: initialData
    })

    setTitle('')
    setType('swot')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl glass border-none shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-500">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <DialogTitle className="text-2xl font-black text-primary">Nova Análise de Risco</DialogTitle>
          </div>
          <DialogDescription className="font-medium text-muted-foreground/80">
            Escolha uma ferramenta para identificar e gerenciar os riscos do seu projeto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Título da Análise</label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Análise de Riscos Operacionais"
                className="bg-background/50 border-border/50 focus:border-primary transition-all h-12 text-base font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {(Object.entries(RISK_ANALYSIS_INFO) as [RiskAnalysisType, typeof RISK_ANALYSIS_INFO[RiskAnalysisType]][]).map(
                ([key, info]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setType(key)}
                    className={cn(
                      "group flex items-start gap-3 p-4 rounded-2xl border transition-all duration-300 text-left",
                      type === key
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/5"
                        : "border-border/50 bg-secondary/20 hover:border-primary/30 hover:bg-secondary/40"
                    )}
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform shrink-0">{info.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-bold text-sm transition-colors",
                        type === key ? "text-primary" : "text-foreground"
                      )}>
                        {info.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium line-clamp-2 mt-0.5 leading-tight">
                        {info.description}
                      </p>
                    </div>
                    {type === key && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center animate-in-fade shrink-0">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                )
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
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
              Iniciar Análise
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
