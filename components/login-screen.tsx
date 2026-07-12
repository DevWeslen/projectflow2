'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogIn, ShieldCheck, Lock } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { LogoPrincesa } from '@/components/logo-princesa'

export function LoginScreen() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const login = useProjectStore((state) => state.login)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(false)
    const success = login(username, password)
    if (!success) {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border p-8 space-y-8 animate-in-fade">
        <div className="flex flex-col items-center text-center space-y-4">
          <LogoPrincesa className="h-16 w-auto" />
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sistema de Gestão</h1>
            <p className="text-sm text-slate-500 font-medium">Autenticação de Acesso ao ProjectFlow</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="animate-pulse">
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>Usuário ou senha incorretos.</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Usuário</Label>
            <div className="relative">
              <LogIn className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="username"
                placeholder="Ex: joao.silva"
                className="pl-10"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type="password"
                placeholder="********"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200">
            Entrar no Sistema
          </Button>
        </form>

        <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-4 border-t">
          ProjectFlow &copy; 2026
        </div>
      </div>
    </div>
  )
}
