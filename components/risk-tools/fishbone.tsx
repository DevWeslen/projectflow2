'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Fish } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FishboneAnalysisProps {
  data: {
    problem: string
    categories: {
      method: string[]
      machine: string[]
      material: string[]
      measurement: string[]
      motherNature: string[]
      manpower: string[]
    }
  }
  onUpdate: (data: any) => void
}

export function FishboneAnalysis({ data, onUpdate }: FishboneAnalysisProps) {
  const categories = [
    { id: 'manpower', name: 'Mão de Obra', icon: '👥', position: 'top' },
    { id: 'method', name: 'Método', icon: '📋', position: 'top' },
    { id: 'machine', name: 'Máquina', icon: '⚙️', position: 'top' },
    { id: 'material', name: 'Material', icon: '📦', position: 'bottom' },
    { id: 'measurement', name: 'Medida', icon: '📏', position: 'bottom' },
    { id: 'motherNature', name: 'Meio Ambiente', icon: '🌍', position: 'bottom' },
  ]

  const addItem = (category: string) => {
    const newData = { ...data, categories: { ...data.categories, [category]: [...data.categories[category as keyof typeof data.categories], ''] } }
    onUpdate(newData)
  }

  const updateItem = (category: string, index: number, value: string) => {
    const newCategory = [...data.categories[category as keyof typeof data.categories]]
    newCategory[index] = value
    onUpdate({ ...data, categories: { ...data.categories, [category]: newCategory } })
  }

  const removeItem = (category: string, index: number) => {
    const newCategory = data.categories[category as keyof typeof data.categories].filter((_, i) => i !== index)
    onUpdate({ ...data, categories: { ...data.categories, [category]: newCategory } })
  }

  return (
    <div className="space-y-12 animate-in-fade p-4 min-w-[800px] overflow-x-auto">
      {/* Visual Fishbone Structure */}
      <div className="relative pt-8 pb-12">
        {/* Main Spinal Cord */}
        <div className="absolute top-1/2 left-0 w-[calc(100%-140px)] h-1 bg-primary/40 -translate-y-1/2 rounded-full hidden lg:block" />
        
        <div className="grid grid-cols-3 gap-x-8 gap-y-24 relative">
          {/* Top Row Categories */}
          {categories.filter(c => c.position === 'top').map((cat) => (
            <div key={cat.id} className="relative flex flex-col items-center">
              <Card className="glass-card border-none bg-background/40 w-full group hover:bg-background/60 transition-all z-10 shadow-2xl ring-1 ring-white/5">
                <div className="p-3 border-b border-white/5 flex items-center justify-between bg-primary/5 rounded-t-xl">
                  <h3 className="font-black text-[10px] uppercase tracking-tighter text-primary flex items-center gap-2">
                    <span className="text-sm">{cat.icon}</span>
                    {cat.name}
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => addItem(cat.id)}
                    className="h-6 w-6 text-primary hover:bg-primary/10 rounded-full"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <CardContent className="p-3 space-y-2 min-h-[100px]">
                  {data.categories[cat.id as keyof typeof data.categories].map((item, index) => (
                    <div key={index} className="flex gap-1 animate-in-slide-up relative group/item">
                      <div className="absolute -left-3 top-1/2 w-2 h-[1px] bg-primary/20" />
                      <Input 
                        value={item}
                        onChange={(e) => updateItem(cat.id, index, e.target.value)}
                        placeholder="..."
                        className="bg-background/20 border-none h-7 text-[11px] focus:ring-1 ring-primary/20 rounded-md"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeItem(cat.id, index)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover/item:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
              {/* Connector Line to Spine */}
              <div className="absolute -bottom-12 left-1/2 w-0.5 h-12 bg-primary/20 -translate-x-1/2 hidden lg:block" />
            </div>
          ))}

          {/* Bottom Row Categories */}
          {categories.filter(c => c.position === 'bottom').map((cat) => (
            <div key={cat.id} className="relative flex flex-col items-center pt-8">
               {/* Connector Line to Spine */}
               <div className="absolute -top-12 left-1/2 w-0.5 h-20 bg-primary/20 -translate-x-1/2 hidden lg:block" />
              
              <Card className="glass-card border-none bg-background/40 w-full group hover:bg-background/60 transition-all z-10 shadow-2xl ring-1 ring-white/5">
                <div className="p-3 border-b border-white/5 flex items-center justify-between bg-primary/5 rounded-t-xl">
                  <h3 className="font-black text-[10px] uppercase tracking-tighter text-primary flex items-center gap-2">
                    <span className="text-sm">{cat.icon}</span>
                    {cat.name}
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => addItem(cat.id)}
                    className="h-6 w-6 text-primary hover:bg-primary/10 rounded-full"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <CardContent className="p-3 space-y-2 min-h-[100px]">
                  {data.categories[cat.id as keyof typeof data.categories].map((item, index) => (
                    <div key={index} className="flex gap-1 animate-in-slide-up relative group/item">
                      <div className="absolute -left-3 top-1/2 w-2 h-[1px] bg-primary/20" />
                      <Input 
                        value={item}
                        onChange={(e) => updateItem(cat.id, index, e.target.value)}
                        placeholder="..."
                        className="bg-background/20 border-none h-7 text-[11px] focus:ring-1 ring-primary/20 rounded-md"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeItem(cat.id, index)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover/item:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* The Head (Effect/Problem) */}
        <div className="absolute top-1/2 right-0 w-[160px] -translate-y-1/2 z-20 hidden lg:flex items-center">
            <div className="w-8 h-1 bg-primary/40" />
            <Card className="flex-1 glass-card border-none bg-primary/20 border-2 border-primary/30 p-4 shadow-xl ring-2 ring-primary/10">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                        <Fish className="h-3 w-3" /> Problema
                    </label>
                    <Textarea 
                        value={data.problem}
                        onChange={(e) => onUpdate({ ...data, problem: e.target.value })}
                        placeholder="Efeito..."
                        className="bg-transparent border-none p-0 min-h-[60px] text-xs font-black text-foreground focus-visible:ring-0 resize-none h-auto"
                        rows={2}
                    />
                </div>
            </Card>
        </div>
      </div>

      {/* Mobile/Small Screen fallback Problem Card */}
      <Card className="lg:hidden glass-card border-none bg-primary/10 p-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-primary">Problema (Efeito)</label>
        <Textarea 
            value={data.problem}
            onChange={(e) => onUpdate({ ...data, problem: e.target.value })}
            placeholder="Defina o problema..."
            className="bg-transparent border-none p-0 min-h-[60px] text-base font-black text-foreground focus-visible:ring-0"
        />
      </Card>
    </div>
  )
}

import { Textarea } from '@/components/ui/textarea'
