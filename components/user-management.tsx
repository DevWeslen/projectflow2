'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { User, UserRole } from '@/lib/types'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  UserPlus, 
  Pencil, 
  Trash2, 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  UserCircle,
  Key
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function UserManagement() {
  const { users, addUser, updateUser, deleteUser, user: currentUser } = useProjectStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: 'operador' as UserRole,
    password: '',
  })

  const resetForm = () => {
    setFormData({ name: '', username: '', role: 'operador', password: '' })
    setEditingUser(null)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.username) {
      toast.error('Preencha pelo menos o nome e o usuário.')
      return
    }

    setIsSubmitting(true)
    try {
      let success = false
      if (editingUser) {
        success = await updateUser(editingUser.id, formData)
        if (success) toast.success('Usuário atualizado com sucesso!')
      } else {
        success = await addUser(formData)
        if (success) toast.success('Usuário criado com sucesso!')
      }

      if (success) {
        setIsDialogOpen(false)
        resetForm()
      } else {
        toast.error('Erro ao sincronizar com o servidor. Tente novamente.')
      }
    } catch (err) {
      toast.error('Ocorreu um erro ao salvar o usuário.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      username: user.username,
      role: user.role,
      password: user.password || '',
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      const success = await deleteUser(id)
      if (success) {
        toast.success('Usuário removido com sucesso.')
      } else {
        toast.error('Erro ao remover usuário no servidor.')
      }
    }
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"><ShieldAlert className="w-3 h-3 mr-1" /> Admin</Badge>
      case 'gerencia':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20"><ShieldCheck className="w-3 h-3 mr-1" /> Gerência</Badge>
      case 'conselho':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"><Shield className="w-3 h-3 mr-1" /> Conselho</Badge>
      default:
        return <Badge variant="outline" className="bg-slate-500/5 border-slate-500/20"><UserCircle className="w-3 h-3 mr-1" /> Operador</Badge>
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3 italic tracking-tight uppercase">
            <Users className="w-8 h-8 text-primary" />
            Gestão de Contas
          </h1>
          <p className="text-muted-foreground font-medium text-sm">Controle de acessos e permissões do sistema.</p>
        </div>

        <Button 
          onClick={() => {
            resetForm()
            setIsDialogOpen(true)
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="sm:max-w-[450px] glass border-none shadow-2xl p-0 overflow-hidden">
          <div className="p-6 pb-2">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-gradient uppercase italic">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Configure o perfil e acesso</p>
            </DialogHeader>
          </div>

          <div className="p-6 pt-2 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João da Silva"
                  className="bg-background/50 border-border/50 h-11 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Login (Rede)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">@</span>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="user.name"
                      className="bg-background/50 border-border/50 h-11 pl-8 font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Senha de Acesso</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="bg-background/50 border-border/50 h-11 pl-10 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nível de Permissão</Label>
                <Select
                  value={formData.role}
                  onValueChange={(val: UserRole) => setFormData({ ...formData, role: val })}
                >
                  <SelectTrigger className="bg-background/50 border-border/50 h-11 font-bold">
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="admin" className="font-bold text-red-500">Administrador</SelectItem>
                    <SelectItem value="gerencia" className="font-bold text-blue-500">Gerência</SelectItem>
                    <SelectItem value="conselho" className="font-bold text-emerald-500">Conselho / Board</SelectItem>
                    <SelectItem value="operador" className="font-bold">Operador Padrão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button 
                onClick={handleSave} 
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black w-full h-12 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                {isSubmitting ? 'Salvando...' : 'Confirmar e Salvar'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-2xl border border-border/50 shadow-2xl overflow-hidden glass">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-12">Colaborador</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-12">Identificação</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-12 text-center">Nível de Acesso</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground h-12 pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className="hover:bg-primary/5 transition-colors border-border/20">
                <TableCell className="font-bold text-foreground py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-xs border border-primary/20">
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>
                    {u.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground font-bold italic">@{u.username}</TableCell>
                <TableCell className="text-center">{getRoleBadge(u.role)}</TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                      onClick={() => handleEdit(u)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                      disabled={currentUser?.id === u.id}
                      onClick={() => handleDelete(u.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-center space-y-2 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
          <Shield className="w-3 h-3 text-primary" />
          <span className="text-[10px] text-primary font-black uppercase tracking-widest">Protocolo de Segurança Ativo</span>
        </div>
        <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-[0.3em]">
          Princesa dos Campos · Gestão de Identidade
        </p>
      </div>
    </div>
  )
}
