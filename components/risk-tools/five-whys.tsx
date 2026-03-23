'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { HelpCircle, ArrowDown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FiveWhysAnalysisProps {
  data: {
    issue: string
    whys: string[]
    rootCause: string
  }
  onUpdate: (data: any) => void
}

export function FiveWhysAnalysis({ data, onUpdate }: FiveWhysAnalysisProps) {
  const updateWhy = (index: number, value: string) => {
    const newWhys = [...data.whys]
    newWhys[index] = value
    onUpdate({ ...data, whys: newWhys })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-in-fade py-8">
      {/* Problem Definition */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-linear-to-r from-primary/20 to-accent/20 rounded-2xl blur-lg opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
        <Card className="glass-card border-none overflow-hidden relative">
          <div className="p-4 bg-primary/10 flex items-center gap-3 border-b border-white/5">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h3 className="font-black uppercase tracking-widest text-sm text-primary">Problema Principal</h3>
          </div>
          <CardContent className="p-4">
            <Textarea
              value={data.issue}
              onChange={(e) => onUpdate({ ...data, issue: e.target.value })}
              placeholder="Descreva o problema que causou o risco..."
              className="bg-background/30 border-none focus:ring-1 ring-primary/30 min-h-[80px] font-black text-lg text-foreground resize-none"
            />
          </CardContent>
        </Card>
      </div>

      {/* The Funnel (The Whys) */}
      <div className="space-y-6 relative flex flex-col items-center">
        {data.whys.map((why, index) => {
          // Progressively narrower widths for the funnel effect
          const widths = ['w-full', 'w-[95%]', 'w-[90%]', 'w-[85%]', 'w-[80%]']
          return (
            <div key={index} className={cn("flex flex-col items-center gap-4 transition-all duration-500", widths[index])}>
              <div className="w-full flex items-center gap-4 group/why">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary shrink-0 border-2 border-primary/20 shadow-lg group-hover/why:scale-110 transition-transform">
                  {index + 1}
                </div>
                <div className="flex-1 relative">
                  <Input
                    value={why}
                    onChange={(e) => updateWhy(index, e.target.value)}
                    placeholder={`Por que? (${index + 1})`}
                    className="bg-background/20 border-none focus:ring-1 ring-primary/30 h-14 text-sm font-bold shadow-xl rounded-2xl px-6"
                  />
                  <div className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-20 group-hover/why:opacity-100 transition-opacity hidden md:block">
                     <span className="text-[10px] font-black uppercase tracking-widest text-primary">Nível {index + 1}</span>
                  </div>
                </div>
              </div>
              {index < data.whys.length - 1 && (
                <div className="flex flex-col items-center">
                   <div className="w-0.5 h-6 bg-linear-to-b from-primary/30 to-primary/5" />
                   <ArrowDown className="h-4 w-4 text-primary/30" />
                </div>
              )}
            </div>
          )
        })}
        <div className="flex flex-col items-center mt-4">
           <div className="w-0.5 h-10 bg-linear-to-b from-primary/30 to-primary animate-pulse" />
           <ArrowDown className="h-6 w-6 text-primary animate-bounce" />
        </div>
      </div>

      {/* Root Cause Card */}
      <div className="relative group pt-4">
        <div className="absolute -inset-1 bg-primary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000" />
        <Card className="glass-card border-none overflow-hidden relative border-2 border-primary/40 bg-primary/5 shadow-2xl">
          <div className="p-4 bg-primary/20 flex items-center gap-3 border-b border-primary/10">
            <Zap className="h-5 w-5 text-primary animate-pulse" />
            <h3 className="font-black uppercase tracking-widest text-sm text-primary">Causa Raiz Identificada</h3>
          </div>
          <CardContent className="p-4">
            <Textarea
              value={data.rootCause}
              onChange={(e) => onUpdate({ ...data, rootCause: e.target.value })}
              placeholder="A verdadeira causa raiz é..."
              className="bg-background/40 border-none focus:ring-1 ring-primary/30 min-h-[80px] font-black text-xl text-primary placeholder:text-primary/30 resize-none"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

