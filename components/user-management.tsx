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
  DialogTrigger,
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
  UserCircle 
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function UserManagement() {
  const { users, addUser, updateUser, deleteUser, user: currentUser } = useProjectStore()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  
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

  const handleSave = () => {
    if (editingUser) {
      updateUser(editingUser.id, formData)
    } else {
      addUser(formData)
    }
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      username: user.username,
      role: user.role,
      password: user.password || '',
    })
    setIsAddDialogOpen(true)
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><ShieldAlert className="w-3 h-3 mr-1" /> Admin</Badge>
      case 'gerencia':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><ShieldCheck className="w-3 h-3 mr-1" /> Gerência</Badge>
      case 'conselho':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><Shield className="w-3 h-3 mr-1" /> Conselho</Badge>
      default:
        return <Badge variant="secondary"><UserCircle className="w-3 h-3 mr-1" /> Operador</Badge>
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in-fade bg-white min-h-screen">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 italic tracking-tighter">
            <Users className="w-8 h-8 text-blue-600" />
            Gestão de Contas
          </h1>
          <p className="text-slate-500 font-medium">Controle de acessos e permissões do sistema.</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-blue-100">
              <UserPlus className="w-5 h-5 mr-2" />
              Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username (Rede)</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="joao.silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Digite a senha"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="role">Nível de Acesso</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(val: UserRole) => setFormData({ ...formData, role: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="gerencia">Gerência</SelectItem>
                      <SelectItem value="conselho">Conselho / Board</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full h-11 rounded-xl">
                Salvar Credenciais
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-slate-700">Nome</TableHead>
              <TableHead className="font-bold text-slate-700">Login</TableHead>
              <TableHead className="font-bold text-slate-700">Status / Função</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className="hover:bg-slate-50/50">
                <TableCell className="font-bold text-slate-900">{u.name}</TableCell>
                <TableCell className="text-slate-500 font-medium">@{u.username}</TableCell>
                <TableCell>{getRoleBadge(u.role)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 rounded-lg"
                      onClick={() => handleEdit(u)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      disabled={currentUser?.id === u.id}
                      onClick={() => deleteUser(u.id)}
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
      <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-8">
        Sistema de Segurança - Princesa dos Campos
      </div>
    </div>
  )
}
