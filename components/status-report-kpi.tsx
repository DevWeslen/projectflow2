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
      <style type="text/css" media="print">
        {`
          @page { size: A4 landscape; margin: 0; }
          body * { visibility: hidden; }
          .status-report-container, .status-report-container * {
            visibility: visible;
          }
          .status-report-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 297mm !important;
            height: 209mm !important;
            margin: 0 !important;
            padding: 5mm !important;
            background: white !important;
            z-index: 999999 !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            zoom: 0.8;
          }
        `}
      </style>
      <div className="status-report-container bg-white text-black p-6 min-h-screen font-sans print:p-0 print:m-0 print:min-h-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[#006838] pb-4 mb-6 gap-4 md:gap-0">
        <div className="flex items-center gap-4 min-w-0 w-full md:w-auto flex-1">
          <div className="w-40 h-16 bg-[#006838]/10 rounded flex items-center justify-center border-2 border-[#006838] shrink-0 hidden sm:flex">
            <span className="text-[#006838] font-black uppercase text-xl leading-none tracking-tighter text-center">
              Princesa<br/>Dos Campos
            </span>
          </div>
          <div className="ml-0 sm:ml-4 min-w-0 flex-1">
            <h1 className="text-4xl font-black uppercase tracking-tight text-[#006838] truncate">Status Report de Indicadores</h1>
            <h2 className="text-xl font-bold text-gray-500 uppercase mt-1 truncate" title={project.name}>Projeto {project.name}</h2>
          </div>
        </div>
        <div className="text-left md:text-right text-[10px] uppercase font-bold text-gray-600 space-y-0.5">
          <p><span className="text-black">Cliente:</span> Expresso Princesa dos Campos</p>
          <p><span className="text-black">Patrocinador:</span> Diretoria</p>
          <p><span className="text-black">Owner:</span> {owner}</p>
          <p><span className="text-black">Início do Projeto:</span> {start.toLocaleDateString('pt-BR')}</p>
          <p><span className="text-black">Go Live:</span> {end ? end.toLocaleDateString('pt-BR') : 'Não definido'}</p>
        </div>
      </div>

      {kpis.length === 0 ? (
        <div className="p-12 text-center text-gray-500 italic border-2 border-dashed border-gray-200 rounded-xl">
          Nenhum indicador registrado neste projeto.
        </div>
      ) : (
        <div className="space-y-6">
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
