'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Shield, AlertTriangle, Lightbulb, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SwotAnalysisProps {
  data: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  onUpdate: (data: any) => void
}

export function SwotAnalysis({ data, onUpdate }: SwotAnalysisProps) {
  const addItem = (category: keyof typeof data) => {
    const newData = { ...data, [category]: [...data[category], ''] }
    onUpdate(newData)
  }

  const updateItem = (category: keyof typeof data, index: number, value: string) => {
    const newCategory = [...data[category]]
    newCategory[index] = value
    onUpdate({ ...data, [category]: newCategory })
  }

  const removeItem = (category: keyof typeof data, index: number) => {
    const newCategory = data[category].filter((_, i) => i !== index)
    onUpdate({ ...data, [category]: newCategory })
  }

  const Quadrant = ({ title, category, icon: Icon, colorClass, placeholder, roundedClass }: any) => (
    <Card className={cn("glass-card border-none overflow-hidden group h-full flex flex-col shadow-2xl", roundedClass)}>
      <div className={cn("p-4 flex items-center gap-3 border-b border-white/5", colorClass)}>
        <Icon className="h-5 w-5" />
        <h3 className="font-black uppercase tracking-widest text-sm">{title}</h3>
      </div>
      <CardContent className="p-4 space-y-3 flex-1 bg-background/20">
        {data[category as keyof typeof data].map((item: string, index: number) => (
          <div key={index} className="flex gap-2 animate-in-slide-up group/item">
            <Input
              value={item}
              onChange={(e) => updateItem(category, index, e.target.value)}
              placeholder={placeholder}
              className="bg-background/20 border-none focus:ring-1 ring-primary/30 h-9 text-xs font-medium"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeItem(category, index)}
              className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          className="w-full border-dashed border-2 border-primary/10 hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all text-[10px] font-black uppercase tracking-widest h-9"
          onClick={() => addItem(category)}
        >
          <Plus className="h-3 w-3 mr-2" />
          Adicionar
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="relative animate-in-fade max-w-5xl mx-auto py-8">
      {/* Central Axis Divider (Visual only) */}
      <div className="absolute top-1/2 left-0 w-full h-[2px] bg-primary/5 -translate-y-1/2 hidden md:block" />
      <div className="absolute top-0 left-1/2 w-[2px] h-full bg-primary/5 -translate-x-1/2 hidden md:block" />
      
      {/* Central SWOT Badge */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex h-16 w-16 items-center justify-center rounded-2xl bg-background border-4 border-primary/10 shadow-2xl overflow-hidden group">
         <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
         <span className="text-[10px] font-black tracking-tighter text-primary z-10">SWOT</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 relative z-10">
        <Quadrant 
          title="Forças" 
          category="strengths" 
          icon={Shield} 
          colorClass="bg-green-500/10 text-green-500"
          placeholder="Vantagem competitiva..."
          roundedClass="md:rounded-br-none"
        />
        <Quadrant 
          title="Fraquezas" 
          category="weaknesses" 
          icon={AlertTriangle} 
          colorClass="bg-red-500/10 text-red-500"
          placeholder="Gargalos internos..."
          roundedClass="md:rounded-bl-none"
        />
        <Quadrant 
          title="Oportunidades" 
          category="opportunities" 
          icon={Lightbulb} 
          colorClass="bg-blue-500/10 text-blue-500"
          placeholder="Mercado, tendências..."
          roundedClass="md:rounded-tr-none"
        />
        <Quadrant 
          title="Ameaças" 
          category="threats" 
          icon={Zap} 
          colorClass="bg-orange-500/10 text-orange-500"
          placeholder="Concorrência..."
          roundedClass="md:rounded-tl-none"
        />
      </div>
    </div>
  )
}
