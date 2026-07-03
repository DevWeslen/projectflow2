'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { RISK_ANALYSIS_INFO, type RiskAnalysis } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RiskAnalysisDialog } from './risk-analysis-dialog'
import { SwotAnalysis } from './risk-tools/swot'
import { FiveWhysAnalysis } from './risk-tools/five-whys'
import { FiveW2HAnalysis } from './risk-tools/five-w2h'
import { ParetoAnalysis } from './risk-tools/pareto'
import { FishboneAnalysis } from './risk-tools/fishbone'
import { Plus, Trash2, ArrowLeft, History, Clock, Maximize2, Minimize2, Download, FileText } from 'lucide-react'
import { exportRiskToCSV } from '@/lib/export-utils'
import { cn } from '@/lib/utils'

interface RiskAnalysisViewProps {
  projectId: string
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export function RiskAnalysisView({ projectId, isExpanded, onToggleExpand }: RiskAnalysisViewProps) {
  const { riskAnalyses, updateRiskAnalysis, deleteRiskAnalysis, projects } = useProjectStore()
  const project = projects.find(p => p.id === projectId)
  const projectAnalyses = riskAnalyses.filter(r => r.projectId === projectId)
  
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const selectedAnalysis = projectAnalyses.find(r => r.id === selectedAnalysisId)

  const handleUpdateData = (newData: any) => {
    if (selectedAnalysisId) {
      updateRiskAnalysis(selectedAnalysisId, { data: newData })
    }
  }

  const renderAnalysisTool = () => {
    if (!selectedAnalysis) return null

    switch (selectedAnalysis.type) {
      case 'swot':
        return <SwotAnalysis data={selectedAnalysis.data} onUpdate={handleUpdateData} />
      case '5whys':
        return <FiveWhysAnalysis data={selectedAnalysis.data} onUpdate={handleUpdateData} />
      case '5w2h':
        return <FiveW2HAnalysis data={selectedAnalysis.data} onUpdate={handleUpdateData} />
      case 'pareto':
        return <ParetoAnalysis data={selectedAnalysis.data} onUpdate={handleUpdateData} />
      case 'fishbone':
        return <FishboneAnalysis data={selectedAnalysis.data} onUpdate={handleUpdateData} />
      default:
        return <p className="text-center py-10 text-muted-foreground">Ferramenta em desenvolvimento...</p>
    }
  }

  if (selectedAnalysis) {
    const info = RISK_ANALYSIS_INFO[selectedAnalysis.type]
    return (
      <div className="space-y-6 animate-in-fade">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-4">
            <Button 
               variant="outline" 
               size="icon" 
               onClick={() => setSelectedAnalysisId(null)}
               className="rounded-full glass border-none h-10 w-10 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                 <span className="text-xl">{info.icon}</span>
                 <h2 className="text-2xl font-black text-primary">{selectedAnalysis.title}</h2>
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{info.name} • {info.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 no-print">
             <Button
                variant="outline"
                size="icon"
                onClick={() => exportRiskToCSV(project!, selectedAnalysis.type, selectedAnalysis.data)}
                className="h-10 w-10 rounded-full glass border-none group transition-all hover:scale-110"
              >
                <Download className="h-4 w-4 text-primary group-hover:animate-bounce" />
             </Button>
             <Button
                variant="outline"
                size="icon"
                onClick={() => window.print()}
                className="h-10 w-10 rounded-full glass border-none group transition-all hover:scale-110"
              >
                <FileText className="h-4 w-4 text-primary" />
             </Button>
             <div className="w-[1px] h-6 bg-border/40 mx-1" />
             <Button
                variant="ghost"
                size="icon"
                onClick={onToggleExpand}
                className="h-10 w-10 rounded-full hover:bg-white/10"
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
             </Button>
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  if (confirm('Tem certeza que deseja excluir esta análise?')) {
                    deleteRiskAnalysis(selectedAnalysis.id)
                    setSelectedAnalysisId(null)
                  }
                }}
                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
              >
                <Trash2 className="h-4 w-4" />
             </Button>
          </div>
        </div>

        <div className="pt-2">
           {renderAnalysisTool()}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in-fade">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-primary">Análises de Risco</h2>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleExpand}
            className="h-10 w-10 rounded-full glass border-none"
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 shadow-lg shadow-orange-500/20 font-bold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Análise
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectAnalyses.map((analysis) => {
          const info = RISK_ANALYSIS_INFO[analysis.type]
          return (
            <Card 
              key={analysis.id} 
              className="glass-card group hover:border-orange-500/50 transition-all cursor-pointer overflow-hidden border-none"
              onClick={() => setSelectedAnalysisId(analysis.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                   <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                      <span className="text-2xl">{info.icon}</span>
                   </div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(analysis.updatedAt).toLocaleDateString('pt-BR')}
                   </div>
                </div>
                <CardTitle className="text-lg font-black group-hover:text-orange-500 transition-colors">{analysis.title}</CardTitle>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{info.name}</p>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {info.description}
                </p>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-end">
                   <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 group-hover:translate-x-1 transition-transform">Abrir Ferramenta →</span>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {projectAnalyses.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4 bg-secondary/10 rounded-3xl border-2 border-dashed border-muted/20">
            <div className="mx-auto h-20 w-20 rounded-full bg-secondary/20 flex items-center justify-center">
               <History className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <div>
               <p className="text-muted-foreground font-bold">Nenhuma análise de risco iniciada.</p>
               <p className="text-xs text-muted-foreground/60">Comece identificando ameaças e oportunidades para seu projeto.</p>
            </div>
            <Button 
               variant="outline" 
               onClick={() => setDialogOpen(true)}
               className="rounded-xl border-orange-500/30 text-orange-500 hover:bg-orange-500/5"
            >
               Iniciar Primeira Análise
            </Button>
          </div>
        )}
      </div>

      <RiskAnalysisDialog 
        projectId={projectId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
