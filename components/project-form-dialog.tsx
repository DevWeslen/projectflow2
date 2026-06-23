'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { METHODOLOGY_INFO, PROJECT_COLORS, type Methodology, type KPI } from '@/lib/types'
import { LogoPrincesa } from '@/components/logo-princesa'
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
import { cn } from '@/lib/utils'
import { Check, Plus, Trash2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const generateId = () => Math.random().toString(36).substring(2, 15)

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectFormDialog({ open, onOpenChange }: ProjectFormDialogProps) {
  const { addProject, users, user: currentUser } = useProjectStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [category, setCategory] = useState('')
  const [methodology, setMethodology] = useState<Methodology>('kanban')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [sprintDuration, setSprintDuration] = useState('2')
  const [totalSprints, setTotalSprints] = useState('4')
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [stakeholderIds, setStakeholderIds] = useState<string[]>([])
  const [attachments, setAttachments] = useState<any[]>([])
  const [newAttachmentName, setNewAttachmentName] = useState('')
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('')
  const [showAttachmentInput, setShowAttachmentInput] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initial KPIs
  const [kpis, setKpis] = useState<KPI[]>([])
  const [kpiName, setKpiName] = useState('')
  const [kpiTarget, setKpiTarget] = useState('')
  const [kpiUnit, setKpiUnit] = useState('')
  const [kpiAggregation, setKpiAggregation] = useState<'sum' | 'average'>('sum')
  const [kpiDistribution, setKpiDistribution] = useState<'fraction' | 'global'>('fraction')
  const [showKpiInput, setShowKpiInput] = useState(false)

  const startYear = new Date().getFullYear()
  const endYear = deadline ? new Date(deadline).getFullYear() : startYear
  const numYears = Math.max(1, endYear - startYear + 1)

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

  const handleRemoveAttachment = (index: number) => setAttachments(prev => prev.filter((_, i) => i !== index))

  const handleAddKpi = () => {
    if (!kpiName.trim() || !kpiTarget) return
    setKpis(prev => [...prev, {
      id: generateId(),
      name: kpiName.trim(),
      target: Number(kpiTarget),
      current: 0,
      unit: kpiUnit.trim(),
      aggregation: kpiAggregation,
      distribution: kpiDistribution
    }])
    setKpiName('')
    setKpiTarget('')
    setKpiUnit('')
    setKpiAggregation('sum')
    setKpiDistribution('fraction')
    setShowKpiInput(false)
  }

  const handleRemoveKpi = (id: string) => setKpis(prev => prev.filter(k => k.id !== id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const id = await addProject({
        name: name.trim(),
        description: description.trim() || undefined,
        methodology,
        color,
        category: category.trim() || 'geral',
        status: 'active',
        deadline: deadline ? new Date(deadline) : undefined,
        sprintDuration: methodology === 'scrum' ? Number(sprintDuration) : undefined,
        totalSprints: methodology === 'scrum' ? Number(totalSprints) : undefined,
        generalKpis: kpis,
        yearlyGoals: undefined as any, // store will auto-generate
        ownerId: currentUser?.id || 'system',
        memberIds: [currentUser?.id || 'system', ...memberIds],
        stakeholderIds: stakeholderIds,
        attachments: attachments
      })

      if (id) {
        toast.success('Projeto criado com sucesso!')
        onOpenChange(false)
      } else {
        toast.error('Erro ao criar projeto no servidor. Verifique sua conexão.')
      }
    } catch (err) {
      toast.error('Ocorreu um erro inesperado ao salvar o projeto.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setDeadline('')
    setCategory('')
    setMethodology('kanban')
    setColor(PROJECT_COLORS[0])
    setSprintDuration('2')
    setTotalSprints('4')
    setKpis([])
    setKpiName('')
    setKpiTarget('')
    setKpiUnit('')
    setKpiAggregation('sum')
    setKpiDistribution('fraction')
    setMemberIds([])
    setStakeholderIds([])
    setAttachments([])
    setNewAttachmentName('')
    setNewAttachmentUrl('')
    setShowAttachmentInput(false)
    setShowKpiInput(false)
  }

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm()
      onOpenChange(value)
    }}>
      <DialogContent className="w-[95vw] sm:max-w-2xl glass border-none shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl sm:text-2xl font-black text-gradient">Novo Projeto</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm font-medium text-muted-foreground/80">
                Crie um projeto com ação, prazo, categoria e KPIs para acompanhamento de metas anuais.
              </DialogDescription>
            </div>
            <LogoPrincesa className="h-10 w-24 shrink-0 rounded-none bg-transparent" />
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 mt-2">
          {/* Row 1: Name + Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome do Projeto *</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Expansão Frota 2026"
                className="bg-background/50 border-border/50 focus:border-primary h-10 font-semibold"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data Final (Prazo)</label>
              <Input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="bg-background/50 border-border/50 focus:border-primary h-10 font-semibold"
              />
            </div>
          </div>

          {/* Row 2: Category + Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Categoria</label>
              <Input
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Ex: Frota, TI, Obras"
                className="bg-background/50 border-border/50 focus:border-primary h-10 font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Descrição (opcional)</label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Objetivo do projeto..."
                className="bg-background/50 border-border/50 focus:border-primary h-10 font-semibold"
              />
            </div>
          </div>

          {/* KPI Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                KPIs & Metas
                {deadline && numYears > 1 && (
                  <span className="ml-2 text-primary normal-case">· {numYears} anos ({startYear}–{endYear})</span>
                )}
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => setShowKpiInput(!showKpiInput)}
              >
                <Plus className="h-3 w-3" /> KPI
              </Button>
            </div>

            {showKpiInput && (
              <div className="p-3 rounded-xl bg-secondary/20 border border-border/50 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Nome do Indicador" value={kpiName} onChange={e => setKpiName(e.target.value)} className="h-8 text-xs font-bold" />
                  <Input type="number" placeholder="Meta Total" value={kpiTarget} onChange={e => setKpiTarget(e.target.value)} className="h-8 text-xs font-bold" />
                  
                  <div className="col-span-2 grid grid-cols-3 gap-2 items-end">
                    <Input placeholder="Unid. Medida (ex: R$/KM, %)" value={kpiUnit} onChange={e => setKpiUnit(e.target.value)} className="h-8 text-xs font-bold" />
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-1 h-8">
                        {(['sum', 'average'] as const).map(m => (
                          <button key={m} type="button" onClick={() => setKpiAggregation(m)} className={`flex-1 h-8 rounded-md text-[10px] uppercase font-black tracking-tighter border transition-all ${kpiAggregation === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/30 border-border text-muted-foreground'}`}>
                            {m === 'sum' ? '∑ Anual' : '⌀ Mensal'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex gap-1 h-8">
                        {(['fraction', 'global'] as const).map(d => (
                          <button key={d} type="button" onClick={() => setKpiDistribution(d)} className={`flex-1 h-8 rounded-md text-[10px] uppercase font-black tracking-tighter border transition-all ${kpiDistribution === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/30 border-border text-muted-foreground'}`}>
                            {d === 'fraction' ? '÷ Fração' : '∞ Global'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {kpiName && kpiTarget && numYears > 1 && (
                  <p className="text-[10px] text-muted-foreground font-bold">
                    {kpiDistribution === 'fraction'
                      ? `→ O sistema vai dividir ~ ${(Number(kpiTarget) / numYears).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} por ano.`
                      : `→ O sistema vai repetir a meta de ${Number(kpiTarget).toLocaleString('pt-BR')} em todos os anos.`}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowKpiInput(false)}>Cancelar</Button>
                  <Button type="button" size="sm" onClick={handleAddKpi} disabled={!kpiName.trim() || !kpiTarget} className="bg-primary h-7 text-xs">
                    <Check className="h-3 w-3 mr-1" /> Adicionar
                  </Button>
                </div>
              </div>
            )}

            {kpis.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {kpis.map(k => (
                  <div key={k.id} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary rounded-lg px-2 py-1 text-[10px] font-bold">
                    <span>{k.name}: {k.unit}{k.target.toLocaleString()}</span>
                    <span className="opacity-50">({k.aggregation === 'sum' ? '∑' : '⌀'})</span>
                    <button type="button" onClick={() => handleRemoveKpi(k.id)} className="text-destructive/70 hover:text-destructive ml-0.5">
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Identidade Visual</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-8 w-8 sm:h-9 sm:w-9 rounded-xl transition-all flex items-center justify-center shadow-md",
                    color === c ? "scale-110 ring-4 ring-primary/30" : "hover:scale-105 opacity-80 hover:opacity-100"
                  )}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="h-4 w-4 text-white drop-shadow-md" />}
                </button>
              ))}
            </div>
          </div>

          {/* Members & Stakeholders Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground uppercase">Equipe do Projeto</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-xl bg-secondary/20 border border-border/50">
                {users.filter(u => u.id !== currentUser?.id).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setMemberIds(prev => 
                        prev.includes(u.id) 
                          ? prev.filter(id => id !== u.id) 
                          : [...prev, u.id]
                      )
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border",
                      memberIds.includes(u.id)
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background/50 border-border/50 text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {u.name}
                    {memberIds.includes(u.id) && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground uppercase">Stakeholders (Interessados)</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-xl bg-secondary/20 border border-border/50">
                {users.map((u) => (
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
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border",
                      stakeholderIds.includes(u.id)
                        ? "bg-[#006838] text-white border-[#006838] shadow-sm"
                        : "bg-background/50 border-border/50 text-muted-foreground hover:border-[#006838]/50"
                    )}
                  >
                    {u.name}
                    {stakeholderIds.includes(u.id) && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Anexos / Evidências</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => setShowAttachmentInput(!showAttachmentInput)}
              >
                <Plus className="h-3 w-3" /> Anexo
              </Button>
            </div>

            {showAttachmentInput && (
              <div className="p-3 rounded-xl bg-secondary/20 border border-border/50 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Nome do Anexo (ex: Escopo)" value={newAttachmentName} onChange={e => setNewAttachmentName(e.target.value)} className="h-8 text-xs font-bold" />
                  <Input placeholder="Link/URL do arquivo" value={newAttachmentUrl} onChange={e => setNewAttachmentUrl(e.target.value)} className="h-8 text-xs font-bold" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAttachmentInput(false)}>Cancelar</Button>
                  <Button type="button" size="sm" onClick={handleAddAttachment} disabled={!newAttachmentName.trim() || !newAttachmentUrl.trim()} className="bg-primary h-7 text-xs">
                    <Check className="h-3 w-3 mr-1" /> Adicionar
                  </Button>
                </div>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((at, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-lg px-2 py-1 text-[10px] font-bold">
                    <span>{at.name}</span>
                    <button type="button" onClick={() => handleRemoveAttachment(idx)} className="text-destructive/70 hover:text-destructive ml-0.5">
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Methodology Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ação</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.entries(METHODOLOGY_INFO) as [Methodology, typeof METHODOLOGY_INFO[Methodology]][]).map(([key, info]) => (
                <TooltipProvider key={key} delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setMethodology(key)}
                        className={cn(
                          "group flex items-start gap-2 p-3 rounded-xl border transition-all text-left w-full",
                          methodology === key
                            ? "border-primary bg-primary/10 shadow-md shadow-primary/5"
                            : "border-border/50 bg-secondary/20 hover:border-primary/30"
                        )}
                      >
                        <span className="text-xl group-hover:scale-110 transition-transform shrink-0">{info.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={cn("font-bold text-xs transition-colors", methodology === key ? "text-primary" : "text-foreground")}>{info.name}</p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-tight line-clamp-1 mt-0.5">{info.description}</p>
                        </div>
                        {methodology === key && (
                          <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs p-4 glass border-none shadow-2xl hidden sm:block">
                      <p className="font-bold text-sm mb-1">{info.icon} {info.name}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{info.longDescription}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>

          {methodology === 'scrum' && (
            <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Configurações de Sprint</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Duração (Semanas)</label>
                  <Input type="number" min="1" max="8" value={sprintDuration} onChange={e => setSprintDuration(e.target.value)} className="bg-background/50 border-border/50 h-9 text-sm font-semibold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Total de Sprints</label>
                  <Input type="number" min="1" max="52" value={totalSprints} onChange={e => setTotalSprints(e.target.value)} className="bg-background/50 border-border/50 h-9 text-sm font-semibold" />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-row gap-2 pt-2 border-t border-border/20">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none font-bold text-muted-foreground">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground font-black px-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105"
            >
              {isSubmitting ? 'Criando...' : 'Criar Projeto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
