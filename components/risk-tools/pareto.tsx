'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, TrendingUp, Percent, Zap } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ParetoAnalysisProps {
  data: {
    problems: { name: string; occurrence: number }[]
  }
  onUpdate: (data: any) => void
}

export function ParetoAnalysis({ data, onUpdate }: ParetoAnalysisProps) {
  const totalOccurrences = data.problems.reduce((sum, p) => sum + (Number(p.occurrence) || 0), 0)
  
  const sortedProblems = [...data.problems].sort((a, b) => (b.occurrence || 0) - (a.occurrence || 0))
  
  let cumulativeProgress = 0
  const analyzingData = sortedProblems.map((p) => {
    const percentage = totalOccurrences > 0 ? (p.occurrence / totalOccurrences) * 100 : 0
    cumulativeProgress += percentage
    return { ...p, percentage, cumulativeProgress }
  })

  const addProblem = () => {
    onUpdate({ ...data, problems: [...data.problems, { name: '', occurrence: 0 }] })
  }

  const updateProblem = (index: number, field: string, value: any) => {
    const newProblems = [...data.problems]
    newProblems[index] = { ...newProblems[index], [field]: value }
    onUpdate({ ...data, problems: newProblems })
  }

  const removeProblem = (index: number) => {
    const newProblems = data.problems.filter((_, i) => i !== index)
    onUpdate({ ...data, problems: newProblems })
  }

  return (
    <div className="space-y-6 animate-in-fade">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-1 border-none bg-primary/5">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-black uppercase tracking-widest text-xs text-primary mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Entrada de Dados
            </h3>
            <div className="space-y-3">
              {data.problems.map((p, index) => (
                <div key={index} className="flex gap-2 items-center animate-in-slide-right">
                  <Input
                    value={p.name}
                    onChange={(e) => updateProblem(index, 'name', e.target.value)}
                    placeholder="Problema/Causa"
                    className="bg-background/30 border-none h-9 text-xs"
                  />
                  <Input
                    type="number"
                    value={p.occurrence}
                    onChange={(e) => updateProblem(index, 'occurrence', Number(e.target.value))}
                    placeholder="Qtd"
                    className="bg-background/30 border-none h-9 w-20 text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProblem(index)}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full border-dashed border-2 border-primary/20 hover:bg-primary/5 text-primary text-xs font-bold"
                onClick={addProblem}
              >
                Nova Ocorrência
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-2 border-none">
          <CardContent className="p-6">
            <h3 className="font-black uppercase tracking-widest text-xs text-muted-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Análise de Impacto (Priorização)
            </h3>
            
            <div className="space-y-6">
              {analyzingData.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground text-sm font-medium">Insira os dados para visualizar a análise</p>
              ) : (
                analyzingData.map((p, index) => {
                  const isVitalFew = p.cumulativeProgress <= 80
                  return (
                    <div key={index} className={cn(
                      "p-4 rounded-2xl transition-all duration-300 border-2",
                      isVitalFew 
                        ? "bg-green-500/5 border-green-500/20 ring-1 ring-green-500/10 shadow-lg shadow-green-500/5" 
                        : "bg-background/20 border-transparent"
                    )}>
                      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest mb-3">
                        <div className="flex items-center gap-2 max-w-[60%]">
                           <span className={cn(
                             "h-6 w-6 rounded-lg flex items-center justify-center text-[10px] shadow-inner",
                             isVitalFew ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
                           )}>
                             {index + 1}
                           </span>
                           <span className="text-foreground truncate">{p.name || 'Sem nome'}</span>
                        </div>
                        <div className="flex gap-4 items-center">
                          <div className="flex flex-col items-end">
                             <span className="text-[9px] text-muted-foreground/60 uppercase">Ocorrências</span>
                             <span className="text-primary">{p.occurrence}</span>
                          </div>
                          <div className="flex flex-col items-end">
                             <span className="text-[9px] text-muted-foreground/60 uppercase">Acúmulo</span>
                             <span className={cn("font-black", isVitalFew ? "text-green-500" : "text-amber-500")}>
                               {Math.round(p.cumulativeProgress)}%
                             </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative h-2.5 w-full bg-secondary/30 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={cn(
                            "absolute left-0 top-0 h-full transition-all duration-1000 ease-out rounded-full",
                            isVitalFew ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "bg-primary/60"
                          )}
                          style={{ width: `${p.percentage}%` }}
                        />
                      </div>
                      
                      {isVitalFew && (
                        <div className="flex items-center gap-1.5 mt-3">
                           <Zap className="h-3 w-3 text-green-500 animate-pulse" />
                           <p className="text-[9px] font-black text-green-500 uppercase tracking-tighter">Poucos Vitais (Foco Prioritário 80/20)</p>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
