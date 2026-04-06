'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/lib/store'
import { type Project, PROJECT_COLORS, METHODOLOGY_INFO, type Methodology } from '@/lib/types'
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
import { Check, Users, Shield, Trash2 } from 'lucide-react'

interface ProjectSettingsDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectSettingsDialog({ project, open, onOpenChange }: ProjectSettingsDialogProps) {
  const { updateProject, users, user: currentUser } = useProjectStore()
  
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [category, setCategory] = useState(project.category)
  const [color, setColor] = useState(project.color)
  const [memberIds, setMemberIds] = useState<string[]>(project.memberIds || [])

  useEffect(() => {
    setName(project.name)
    setDescription(project.description || '')
    setCategory(project.category)
    setColor(project.color)
    setMemberIds(project.memberIds || [])
  }, [project, open])

  const handleSave = () => {
    updateProject(project.id, {
      name,
      description,
      category,
      color,
      memberIds
    })
    onOpenChange(false)
  }

  const toggleMember = (userId: string) => {
    setMemberIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md glass border-none shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-gradient flex items-center gap-2">
            Configurações do Projeto
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-muted-foreground/80 lowercase">
            Edite as informações básicas e permissões de acesso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome e Identidade</label>
              <div className="flex gap-2">
                <Input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="bg-background/50 border-border/50 font-bold"
                />
                <div 
                  className="w-10 h-10 rounded-xl shadow-lg shrink-0 border-2 border-white/20" 
                  style={{ backgroundColor: color }} 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Categoria</label>
              <Input 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                className="bg-background/50 border-border/50 font-semibold"
              />
            </div>
          </div>

          {/* Members / Permissions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Controle de Acesso</label>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
              {users.map((u) => {
                const isOwner = u.id === project.ownerId
                const isSystemProtected = u.role === 'admin' || u.role === 'conselho' || u.role === 'diretoria'
                const isSelected = memberIds.includes(u.id) || isOwner || isSystemProtected

                return (
                  <button
                    key={u.id}
                    type="button"
                    disabled={isOwner || isSystemProtected}
                    onClick={() => toggleMember(u.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left group",
                      isSelected
                        ? "bg-primary/10 border-primary/30"
                        : "bg-secondary/20 border-border/30 hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-slate-200 text-slate-500"
                      )}>
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className={cn("text-xs font-bold", isSelected ? "text-primary" : "text-slate-600")}>{u.name}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-tight">{u.role}</p>
                      </div>
                    </div>
                    
                    {isOwner ? (
                      <Badge className="bg-orange-500/10 text-orange-600 text-[8px] font-black hover:bg-orange-500/10 border-none">DONO</Badge>
                    ) : isSystemProtected ? (
                      <Shield className="h-3.5 w-3.5 text-slate-400" />
                    ) : isSelected ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-slate-300 group-hover:border-primary/50" />
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-[9px] text-muted-foreground font-medium italic">
              * Administradores e diretoria possuem acesso global garantido.
            </p>
          </div>

          {/* Colors Selection (Condensed) */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mudar Cor</label>
            <div className="flex flex-wrap gap-1.5">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-6 w-6 rounded-md transition-all border-2",
                    color === c ? "border-primary scale-110" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold text-muted-foreground">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-primary hover:bg-primary/90 font-black px-6 shadow-lg shadow-primary/20"
          >
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("px-1.5 py-0.5 rounded-md", className)}>
      {children}
    </span>
  )
}
