'use client'

import { useProjectStore } from '@/lib/store'
import { GanttChart } from './gantt-chart'
import { Card } from '@/components/ui/card'
import { TASK_STATUS_INFO } from '@/lib/types'
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'

interface StatusReportProps {
  projectId: string
}

export function StatusReport({ projectId }: StatusReportProps) {
  const { projects, tasks, taskDependencies, riskAnalyses, users } = useProjectStore()

  const project = projects.find(p => p.id === projectId)
  const projectTasks = tasks.filter(t => t.projectId === projectId)

  if (!project) return null

  const owner = users.find(u => u.id === project.ownerId)?.name || 'Nao atribuído'

  // Calculations
  const totalTasks = projectTasks.length
  
  // % Concluído: average progress of all tasks or root tasks. Let's use average of all for simplicity.
  const progressAvg = totalTasks > 0 
    ? projectTasks.reduce((acc, t) => acc + t.progress, 0) / totalTasks 
    : 0

  // % Previsto: based on time passed between start and deadline
  let expectedProgress = 0
  const now = new Date()
  const start = new Date(project.actualStartDate || project.createdAt)
  const end = project.deadline ? new Date(project.deadline) : undefined

  if (end) {
    const totalDuration = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    if (elapsed > totalDuration) expectedProgress = 100
    else if (elapsed > 0) expectedProgress = (elapsed / totalDuration) * 100
  } else {
    expectedProgress = 0 // can't calculate expected if no deadline
  }

  // Lists
  const doneTasks = projectTasks.filter(t => t.status === 'done')
  
  // Next week: not done, deadline within next 7 days
  const nextWeekTasks = projectTasks.filter(t => {
    if (t.status === 'done') return false
    if (!t.deadline) return false
    const d = new Date(t.deadline)
    const weekFromNow = new Date()
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    return d > now && d <= weekFromNow
  })

  // Delayed: not done, deadline passed
  const delayedTasks = projectTasks.filter(t => {
    if (t.status === 'done') return false
    if (!t.deadline) return false
    return new Date(t.deadline) < now
  })

  // Attention Points: Delayed tasks with dependents + Risk Analyses
  const attentionPoints = []
  
  delayedTasks.forEach(dt => {
    const deps = taskDependencies.filter(dep => dep.predecessorId === dt.id)
    if (deps.length > 0) {
      attentionPoints.push(`Tarefa atrasada "${dt.title}" está bloqueando ${deps.length} tarefa(s) sucessora(s).`)
    } else {
      attentionPoints.push(`Tarefa atrasada: ${dt.title}`)
    }
  })

  riskAnalyses.filter(r => r.projectId === projectId).forEach(r => {
    attentionPoints.push(`Risco registrado: ${r.title} (${r.type})`)
  })

  // Determine Gantt dates
  const ganttStart = start
  const ganttEnd = end || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

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
            width: calc(297mm / 0.65) !important;
            height: calc(209mm / 0.65) !important;
            margin: 0 !important;
            padding: 8mm !important;
            background: white !important;
            z-index: 999999 !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            transform: scale(0.65) !important;
            transform-origin: top left !important;
          }
          [data-sidebar="sidebar"], [data-slot="sidebar"] {
            display: none !important;
          }
        `}
      </style>
      <div className="status-report-container bg-white text-black p-4 min-h-screen font-sans print:p-0 print:m-0 print:min-h-0 flex flex-col gap-3">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-primary pb-2 mb-2 gap-4 md:gap-0">
        <div className="flex items-center gap-4 min-w-0 w-full md:w-auto flex-1">
          {/* Faux Logo placeholder */}
          <div className="w-40 h-16 bg-primary/10 rounded flex items-center justify-center border-2 border-primary shrink-0 hidden sm:flex">
            <span className="text-primary font-black uppercase text-xl leading-none tracking-tighter text-center">
              Princesa<br/>Dos Campos
            </span>
          </div>
          <div className="ml-0 sm:ml-4 min-w-0 flex-1">
            <h1 className="text-3xl font-black uppercase tracking-tight text-primary truncate">Status Report</h1>
            <h2 className="text-lg font-bold text-gray-500 uppercase mt-0.5 truncate" title={project.name}>Projeto {project.name}</h2>
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

      {/* TOP METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* EVOLUÇÃO */}
        <Card className="col-span-2 p-3 border-2 border-black rounded-lg shadow-none flex flex-col">
          <h3 className="text-center font-black uppercase text-xs mb-2">Evolução</h3>
          <div className="flex justify-around items-end flex-1">
            <div className="text-center">
              <span className="text-4xl font-black">{totalTasks}</span>
              <span className="text-[10px] font-bold uppercase ml-1">Atividades</span>
            </div>
            <div className="text-center">
              <span className="text-4xl font-black">{Math.round(progressAvg)}%</span>
              <span className="text-[10px] font-bold uppercase ml-1">Concluído</span>
            </div>
            <div className="text-center">
              <span className="text-4xl font-black">{Math.round(expectedProgress)}%</span>
              <span className="text-[10px] font-bold uppercase ml-1">Previsto</span>
            </div>
          </div>
        </Card>
        {/* ESCOPO */}
        <Card className="col-span-1 p-3 border-2 border-black rounded-lg shadow-none flex flex-col">
          <h3 className="text-center font-black uppercase text-xs mb-2">Escopo</h3>
          <p className="text-[9px] font-medium leading-relaxed flex-1">{project.description || 'Nenhum escopo definido.'}</p>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row flex-1 gap-3 min-h-0 pb-4">
        {/* LEFT COLUMN: GANTT & RISKS */}
        <div className="flex-[2] flex flex-col gap-3 min-w-0 min-h-0">
          <Card className="flex-[2] p-3 border-2 border-black rounded-lg shadow-none overflow-hidden flex flex-col min-h-[300px]">
            <h3 className="text-center font-black uppercase text-xs mb-2">Cronograma</h3>
            <div className="w-full flex-1 min-h-0 overflow-x-auto">
              <GanttChart tasks={projectTasks} startDate={ganttStart} endDate={ganttEnd} />
            </div>
          </Card>
          
          <Card className="flex-1 p-3 border-2 border-black rounded-lg shadow-none flex flex-col min-h-0">
            <h3 className="text-center font-black uppercase text-xs mb-2">Pontos de Atenção</h3>
            <ul className="list-disc pl-5 text-[9px] space-y-0.5 text-red-600 font-bold overflow-hidden flex-1">
              {attentionPoints.length > 0 ? (
                attentionPoints.map((pt, i) => (
                  <li key={i} className="text-red-700 font-bold line-clamp-1">{pt}</li>
                ))
              ) : (
                <li className="text-gray-500 italic">Nenhum ponto de atenção.</li>
              )}
            </ul>
          </Card>
        </div>

        {/* RIGHT COLUMN: LISTS */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 min-h-0">
          <Card className="flex-1 p-3 border-2 border-black rounded-lg shadow-none flex flex-col min-h-0">
            <h3 className="text-center font-black uppercase text-xs mb-2">Atividades Realizadas</h3>
            <ul className="list-disc pl-5 text-[9px] space-y-0.5 overflow-hidden flex-1">
              {doneTasks.slice(0, 5).map(t => (
                <li key={t.id} className="line-clamp-1">{t.title}</li>
              ))}
              {doneTasks.length === 0 && <li className="italic text-gray-500">Nenhuma concluída</li>}
            </ul>
          </Card>

          <Card className="flex-1 p-3 border-2 border-black rounded-lg shadow-none flex flex-col min-h-0">
            <h3 className="text-center font-black uppercase text-xs mb-2">Próx. Semana</h3>
            <ul className="list-disc pl-5 text-[9px] space-y-0.5 text-gray-600 overflow-hidden flex-1">
              {nextWeekTasks.slice(0, 5).map(t => (
                <li key={t.id} className="line-clamp-1">{t.title}</li>
              ))}
              {nextWeekTasks.length === 0 && <li className="italic text-gray-500">Nenhuma programada</li>}
            </ul>
          </Card>

          <Card className="flex-1 p-3 border-2 border-black rounded-lg shadow-none flex flex-col min-h-0">
            <h3 className="text-center font-black uppercase text-xs mb-2">Atrasadas</h3>
            <ul className="list-disc pl-5 text-[9px] space-y-0.5 overflow-hidden flex-1">
              {delayedTasks.slice(0, 5).map(t => (
                <li key={t.id} className="text-red-600 font-bold line-clamp-1">{t.title}</li>
              ))}
              {delayedTasks.length === 0 && <li className="italic text-gray-500">Nenhuma atrasada</li>}
            </ul>
          </Card>
        </div>
      </div>
      </div>
    </>
  )
}
