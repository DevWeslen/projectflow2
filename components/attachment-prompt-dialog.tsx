'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link as LinkIcon, FileUp, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AttachmentPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (attachment?: { name: string; url: string; type: 'link' | 'file' }) => void
  taskTitle: string
}

export function AttachmentPromptDialog({
  open,
  onOpenChange,
  onConfirm,
  taskTitle
}: AttachmentPromptDialogProps) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const handleConfirm = () => {
    if (name && url) {
      onConfirm({ name, url, type: 'link' })
    } else {
      onConfirm()
    }
    reset()
  }

  const handleSkip = () => {
    onConfirm()
    reset()
  }

  const reset = () => {
    setName('')
    setUrl('')
    setIsUploading(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (res.ok) {
          const data = await res.json()
          setName(data.name)
          setUrl(data.url)
        } else {
          console.error('Failed to upload file')
          alert('Erro ao fazer upload do arquivo')
        }
      } catch (error) {
        console.error('Error uploading:', error)
        alert('Erro de conexão ao fazer upload')
      } finally {
        setIsUploading(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass border-none shadow-2xl">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
          <DialogTitle className="text-center text-xl font-black text-gradient">
            Tarefa Concluída!
          </DialogTitle>
          <DialogDescription className="text-center font-medium">
            Parabéns por finalizar <strong className="text-foreground">{taskTitle}</strong>. 
            Deseja anexar uma evidência ou comprovante de entrega?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nome do Anexo</Label>
            <Input
              id="name"
              placeholder="Ex: Comprovante de Entrega"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background/50 border-border/50"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="url" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">URL ou Link</Label>
            <div className="relative">
              <Input
                id="url"
                placeholder="https://exemplo.com/arquivo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-background/50 border-border/50 pl-9"
              />
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-bold">Ou</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
             <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Upload de Arquivo</Label>
             <div className={cn(
               "border-2 border-dashed border-border/50 rounded-xl p-4 transition-all hover:bg-primary/5 flex flex-col items-center justify-center gap-2 cursor-pointer",
               isUploading && "opacity-50 pointer-events-none"
             )} onClick={() => document.getElementById('file-upload')?.click()}>
                <FileUp className="h-6 w-6 text-primary" />
                <span className="text-xs font-bold text-primary">
                  {isUploading ? 'Enviando...' : name && url.startsWith('#mock') ? name : 'Clique para selecionar'}
                </span>
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
             </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            className="w-full sm:w-auto font-bold text-muted-foreground"
          >
            Concluir sem anexo
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!name || !url || isUploading}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-lg"
          >
            Salvar com Anexo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
