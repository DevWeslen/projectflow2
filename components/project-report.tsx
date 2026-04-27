'use client'

import { useProjectStore } from '@/lib/store'
import { RISK_ANALYSIS_INFO, TASK_STATUS_INFO } from '@/lib/types'
import { SwotAnalysis } from './risk-tools/swot'
import { FiveWhysAnalysis } from './risk-tools/five-whys'
import { FiveW2HAnalysis } from './risk-tools/five-w2h'
import { ParetoAnalysis } from './risk-tools/pareto'
import { FishboneAnalysis } from './risk-tools/fishbone'

interface ProjectReportProps {
  projectId: string
}

export function ProjectReport({ projectId }: ProjectReportProps) {
  const { projects, tasks, riskAnalyses } = useProjectStore()
  const project = projects.find(p => p.id === projectId)
  const projectTasks = tasks.filter(t => t.projectId === projectId)
  const projectAnalyses = riskAnalyses.filter(r => r.projectId === projectId)

  if (!project) return null

  return (
    <div className="hidden print:block p-8 bg-white text-black min-h-screen">
      {/* Report Header */}
      <header className="border-b-4 border-primary pb-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-primary">{project.name}</h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Relatório Completo de Projeto e Riscos</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-muted-foreground uppercase">Data de Emissão</p>
            <p className="text-sm font-black">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </header>

      {/* Project Description */}
      <section className="mb-12">
        <h2 className="text-xl font-black uppercase tracking-widest border-l-4 border-primary pl-4 mb-4">Descrição do Projeto</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{project.description || 'Nenhuma descrição fornecida.'}</p>
      </section>

      {/* Tasks Table */}
      <section className="mb-12">
        <h2 className="text-xl font-black uppercase tracking-widest border-l-4 border-primary pl-4 mb-6">Estrutura de Tarefas</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left text-[10px] font-black uppercase">Título</th>
              <th className="border p-2 text-left text-[10px] font-black uppercase">Status</th>
              <th className="border p-2 text-center text-[10px] font-black uppercase">Progresso</th>
              <th className="border p-2 text-left text-[10px] font-black uppercase">Prazo</th>
            </tr>
          </thead>
          <tbody>
            {projectTasks.map(task => (
              <tr key={task.id}>
                <td className="border p-2 text-sm font-bold">{task.title}</td>
                <td className="border p-2 text-xs uppercase font-medium">{TASK_STATUS_INFO[task.status].name}</td>
                <td className="border p-2 text-center text-sm font-black">{Math.round(task.progress)}%</td>
                <td className="border p-2 text-sm">
                  {task.deadline ? new Date(task.deadline).toLocaleDateString('pt-BR') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Risk Analyses Section */}
      <section className="page-break-before">
        <h2 className="text-xl font-black uppercase tracking-widest border-l-4 border-orange-500 pl-4 mb-8 text-orange-600">Análises de Risco</h2>
        
        {projectAnalyses.length === 0 ? (
          <p className="italic text-muted-foreground">Nenhuma análise de risco realizada para este projeto.</p>
        ) : (
          <div className="space-y-16">
            {projectAnalyses.map(analysis => {
              const info = RISK_ANALYSIS_INFO[analysis.type]
              return (
                <div key={analysis.id} className="border-t pt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">{info.icon}</span>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">{analysis.title}</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{info.name}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    {analysis.type === 'swot' && <SwotAnalysis data={analysis.data} onUpdate={() => {}} />}
                    {analysis.type === '5whys' && <FiveWhysAnalysis data={analysis.data} onUpdate={() => {}} />}
                    {analysis.type === '5w2h' && <FiveW2HAnalysis data={analysis.data} onUpdate={() => {}} />}
                    {analysis.type === 'pareto' && <ParetoAnalysis data={analysis.data} onUpdate={() => {}} />}
                    {analysis.type === 'fishbone' && <FishboneAnalysis data={analysis.data} onUpdate={() => {}} />}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-20 pt-8 border-t border-gray-100 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Gerado automaticamente pelo Sistema de Gestão de Projetos</p>
      </footer>
    </div>
  )
}
