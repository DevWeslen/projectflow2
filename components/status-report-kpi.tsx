'use client'

import { useProjectStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Target, Calendar } from 'lucide-react'

interface StatusReportKpiProps {
  projectId: string
}

export function StatusReportKpi({ projectId }: StatusReportKpiProps) {
  const { projects, users } = useProjectStore()
  const project = projects.find(p => p.id === projectId)

  if (!project) return null

  const owner = users.find(u => u.id === project.ownerId)?.name || 'Não atribuído'
  const kpis = project.generalKpis || []
  const yearlyGoals = project.yearlyGoals || []

  const start = new Date(project.actualStartDate || project.createdAt)
  const end = project.deadline ? new Date(project.deadline) : undefined

  return (
    <>

      <div className="status-report-container bg-white text-black font-sans">
        {/* HEADER */}
        <div style={{ background: '#006838', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Status Report de Indicadores</div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', opacity: 0.85, marginTop: 2 }}>Projeto {project.name}</div>
          </div>
          <div style={{ background: 'white', borderRadius: 8, padding: '6px 12px', minWidth: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/cropped-icon.png" alt="Princesa dos Campos" style={{ height: 52, width: 'auto', objectFit: 'contain', display: 'block' }} />
          </div>
        </div>
        {/* INFO BAR */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, padding: '6px 16px', borderBottom: '2px solid #006838', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#333' }}>
          <span><b>Cliente:</b>Princesa dos Campos</span>
          <span><b>Patrocinador:</b> Diretoria</span>
          <span><b>Owner:</b> {owner}</span>
          <span><b>Início do Projeto:</b> {start.toLocaleDateString('pt-BR')}</span>
          <span><b>Go Live:</b> {end ? end.toLocaleDateString('pt-BR') : 'Não definido'}</span>
        </div>

        {kpis.length === 0 ? (
          <div className="p-12 text-center text-gray-500 italic border-2 border-dashed border-gray-200 rounded-xl mx-4 mt-4">
            Nenhum indicador registrado neste projeto.
          </div>
        ) : (
          <div className="space-y-6 p-4">
            {/* Globais */}
            <Card className="p-4 border-2 border-black rounded-lg shadow-none">
              <h3 className="font-black uppercase text-sm mb-4 flex items-center gap-2 border-b pb-2">
                <Target className="w-4 h-4" /> Resultados Globais Consolidados
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kpis.map(kpi => {
                  const percent = kpi.target > 0 ? Math.min((kpi.current / kpi.target) * 100, 100) : 0
                  return (
                    <div key={kpi.id} className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-xs uppercase">{kpi.name}</div>
                        <div className="text-[9px] font-black uppercase px-2 py-0.5 bg-gray-200 rounded-full">
                          {kpi.aggregation === 'sum' ? 'Consolidado' : 'Média'}
                        </div>
                      </div>
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-2xl font-black">{kpi.current.toLocaleString('pt-BR')}</span>
                        <span className="text-xs font-bold text-gray-500 mb-0.5">/ {kpi.target.toLocaleString('pt-BR')} {kpi.unit}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-[#006838] h-full rounded-full" style={{ width: `${Math.max(2, percent)}%` }} />
                      </div>
                      <div className="text-[9px] font-bold text-right mt-1">{percent.toFixed(1)}% atingido</div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Anuais */}
            {yearlyGoals.length > 0 && (
              <Card className="p-4 border-2 border-black rounded-lg shadow-none">
                <h3 className="font-black uppercase text-sm mb-4 flex items-center gap-2 border-b pb-2">
                  <Calendar className="w-4 h-4" /> Detalhamento Anual
                </h3>
                <div className="space-y-4">
                  {yearlyGoals.map(yg => (
                    <div key={yg.id} className="border border-gray-300 rounded-lg p-3">
                      <h4 className="font-black text-lg mb-2">{yg.year}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {kpis.map(baseKpi => {
                          const yKpi = yg.kpis.find(k => k.id === baseKpi.id) || { ...baseKpi, current: 0, target: 0 }
                          const pct = yKpi.target > 0 ? Math.min((yKpi.current / yKpi.target) * 100, 100) : 0
                          return (
                            <div key={baseKpi.id} className="bg-gray-50 p-2 rounded border border-gray-200">
                              <div className="text-[9px] font-bold uppercase text-gray-500 mb-1">{baseKpi.name}</div>
                              <div className="flex items-end justify-between">
                                <span className="font-black text-sm">{yKpi.current.toLocaleString('pt-BR')}</span>
                                <span className="text-[10px] text-gray-500">meta: {yKpi.target.toLocaleString('pt-BR')}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div className="bg-[#006838] h-full rounded-full" style={{ width: `${Math.max(2, pct)}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  )
}
