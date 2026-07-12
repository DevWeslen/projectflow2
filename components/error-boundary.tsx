'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center space-y-6 bg-white rounded-3xl border shadow-xl mx-4 my-10">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 animate-pulse">
            <AlertCircle className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Oops! Algo deu errado.</h2>
            <p className="text-slate-500 max-w-md mx-auto font-medium">
              Ocorreu um erro inesperado nesta visualização. Isso pode ser devido a dados inconsistentes ou uma falha temporária.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 w-full max-w-lg overflow-auto max-h-32 text-left">
            <p className="text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Detalhes do erro:</p>
            <p className="text-xs font-mono text-rose-600 font-bold whitespace-pre-wrap">
              {this.state.error?.message || 'Erro desconhecido'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <Button 
                onClick={() => window.location.reload()} 
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl shadow-lg"
            >
              <RefreshCcw className="w-4 h-4 mr-2" /> Recarregar Página
            </Button>
            <Button 
                variant="outline"
                onClick={() => {
                    this.setState({ hasError: false });
                    window.location.href = '/';
                }} 
                className="flex-1 border-slate-200 font-bold h-12 rounded-xl"
            >
              <Home className="w-4 h-4 mr-2" /> Voltar ao Início
            </Button>
          </div>
          
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            Suporte Técnico - ProjectFlow
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
