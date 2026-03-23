'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { HelpCircle } from 'lucide-react'

interface FiveW2HAnalysisProps {
  data: {
    what: string
    why: string
    where: string
    when: string
    who: string
    how: string
    howMuch: string
  }
  onUpdate: (data: any) => void
}

export function FiveW2HAnalysis({ data, onUpdate }: FiveW2HAnalysisProps) {
  const fields = [
    { id: 'what', label: 'What', sub: 'O que', placeholder: 'O que será feito?', helper: 'Ação ou problema', icon: '❓', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'why', label: 'Why', sub: 'Por que', placeholder: 'Por que será feito?', helper: 'Justificativa', icon: '🎯', color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'where', label: 'Where', sub: 'Onde', placeholder: 'Onde será feito?', helper: 'Local ou área', icon: '📍', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'when', label: 'When', sub: 'Quando', placeholder: 'Quando será feito?', helper: 'Prazo ou data', icon: '📅', color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 'who', label: 'Who', sub: 'Quem', placeholder: 'Quem fará?', helper: 'Responsável', icon: '👤', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'how', label: 'How', sub: 'Como', placeholder: 'Como será feito?', helper: 'Método ou processo', icon: '⚙️', color: 'text-gray-500', bg: 'bg-gray-500/10' },
    { id: 'howMuch', label: 'How Much', sub: 'Quanto', placeholder: 'Quanto custará?', helper: 'Custo ou recursos', icon: '💰', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in-fade py-4">
      {fields.map((field) => (
        <Card key={field.id} className="glass-card border-none overflow-hidden group hover:bg-background/40 transition-all shadow-xl">
          <div className={cn("p-4 flex items-center gap-4 border-b border-white/5", field.bg)}>
            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner", field.bg, field.color)}>
              {field.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={cn("font-black uppercase tracking-widest text-sm", field.color)}>{field.label}</h3>
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">{field.sub}</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium italic">{field.helper}</p>
            </div>
          </div>
          <CardContent className="p-4 bg-background/20">
            <Textarea
              id={field.id}
              value={data[field.id as keyof typeof data]}
              onChange={(e) => onUpdate({ ...data, [field.id]: e.target.value })}
              placeholder={field.placeholder}
              className="bg-transparent border-none focus:ring-1 ring-primary/30 min-h-[100px] text-sm font-medium resize-none p-0 placeholder:text-muted-foreground/30"
            />
          </CardContent>
        </Card>
      ))}
      
      {/* Visual connection ornament for 5W2H */}
      <div className="hidden lg:flex items-center justify-center p-8 opacity-10">
         <HelpCircle className="h-24 w-24 text-primary" />
      </div>
    </div>
  )
}

import { cn } from '@/lib/utils'
