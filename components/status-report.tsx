'use client'

import { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '@/lib/store'
import { GanttChart } from './gantt-chart'
import { Maximize2, Minimize2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DateRange } from 'react-day-picker'

interface StatusReportProps {
  projectId: string
}

export function StatusReport({ projectId }: StatusReportProps) {
  const { projects, tasks, taskDependencies, riskAnalyses, users } = useProjectStore()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  // Refs for jsPDF capture
  const page1Ref = useRef<HTMLDivElement>(null)
  const page2Ref = useRef<HTMLDivElement>(null)

  const project = projects.find(p => p.id === projectId)
  const projectTasks = tasks.filter(t => t.projectId === projectId)

  useEffect(() => {
    if (project) {
      const start = new Date(project.actualStartDate || project.createdAt)
      const end = project.deadline ? new Date(project.deadline) : undefined
      const ganttEnd = end || new Date(new Date().getTime() + 90 * 24 * 60 * 60 * 1000)
      setDateRange({
        from: new Date(start.getFullYear(), start.getMonth(), 1),
        to: new Date(ganttEnd.getFullYear(), ganttEnd.getMonth() + 1, 0)
      })
    }
  }, [projectId, project])

  if (!project) return null

  const owner = users.find(u => u.id === project.ownerId)?.name || 'Não atribuído'
  const totalTasks = projectTasks.length
  const progressAvg = totalTasks > 0
    ? projectTasks.reduce((acc, t) => acc + t.progress, 0) / totalTasks
    : 0

  let expectedProgress = 0
  const now = new Date()
  const start = new Date(project.actualStartDate || project.createdAt)
  const end = project.deadline ? new Date(project.deadline) : undefined

  if (end) {
    const totalDuration = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    if (elapsed > totalDuration) expectedProgress = 100
    else if (elapsed > 0) expectedProgress = (elapsed / totalDuration) * 100
  }

  const doneTasks = projectTasks.filter(t => t.status === 'done')
  const nextWeekTasks = projectTasks.filter(t => {
    if (t.status === 'done') return false
    if (!t.deadline) return false
    const d = new Date(t.deadline)
    const weekFromNow = new Date()
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    return d > now && d <= weekFromNow
  })
  const delayedTasks = projectTasks.filter(t => {
    if (t.status === 'done') return false
    if (!t.deadline) return false
    return new Date(t.deadline) < now
  })

  const attentionPoints: string[] = []
  delayedTasks.forEach(dt => {
    const deps = taskDependencies.filter(dep => dep.predecessorId === dt.id)
    if (deps.length > 0) {
      attentionPoints.push(`Atrasada: "${dt.title}" bloqueia ${deps.length} tarefa(s)`)
    } else {
      attentionPoints.push(`Atrasada: ${dt.title}`)
    }
  })
  riskAnalyses.filter(r => r.projectId === projectId).forEach(r => {
    attentionPoints.push(`Risco: ${r.title} (${r.type})`)
  })

  const ganttEnd = end || new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  // ── PDF Export matching ExportReports.tsx pattern ───────────────────────────

  /**
   * html2canvas does not support modern CSS color functions (oklab, oklch, color())
   * that Tailwind v4 emits for opacity utilities (e.g. bg-primary/50).
   * This helper walks every element inside `root`, reads the browser-resolved
   * rgb() value via getComputedStyle, and stamps it as an inline style so
   * html2canvas only ever sees plain rgb/rgba values.
   */
  const resolveOklabColors = (root: HTMLElement) => {
    const colorProps = [
      'color', 'backgroundColor', 'borderColor',
      'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
      'outlineColor', 'textDecorationColor', 'fill', 'stroke',
    ] as const
    const unsupportedPattern = /oklab|oklch|color\(/i
    const elements = root.querySelectorAll<HTMLElement>('*')
    elements.forEach(el => {
      const computed = window.getComputedStyle(el)
      colorProps.forEach(prop => {
        const value = computed[prop as keyof CSSStyleDeclaration] as string
        if (value && unsupportedPattern.test(value)) {
          // The browser already resolved this to rgb() in getComputedStyle;
          // if it still shows oklab it means the engine returned it verbatim.
          // Force it to transparent as a safe fallback.
          ;(el.style as unknown as Record<string, string>)[prop] =
            value.startsWith('oklab') || value.startsWith('oklch')
              ? 'transparent'
              : value
        }
      })
    })
  }

  const handleExportPDF = async () => {
    if (!page1Ref.current || !page2Ref.current) return
    setIsExportingPDF(true)
    try {
      await new Promise(r => setTimeout(r, 500))

      const { default: jsPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')

      // Pre-process: replace oklab/oklch colors with rgb equivalents
      resolveOklabColors(page1Ref.current)
      resolveOklabColors(page2Ref.current)

      // Capture both pages at 2x resolution
      const [canvas1, canvas2] = await Promise.all([
        html2canvas(page1Ref.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }),
        html2canvas(page2Ref.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }),
      ])

      // Format [canvas.width, canvas.height] eliminates all margins and borders
      const pdf = new jsPDF({
        orientation: 'l',
        unit: 'px',
        format: [canvas1.width, canvas1.height]
      })

      pdf.addImage(canvas1.toDataURL('image/png'), 'PNG', 0, 0, canvas1.width, canvas1.height)

      pdf.addPage([canvas2.width, canvas2.height], 'l')
      pdf.addImage(canvas2.toDataURL('image/png'), 'PNG', 0, 0, canvas2.width, canvas2.height)

      pdf.save(`StatusReport_${project.name.replace(/\s+/g, '_')}.pdf`)
    } catch (err) {
      console.error('Erro ao exportar PDF:', err)
      alert('Erro ao gerar PDF.')
    } finally {
      setIsExportingPDF(false)
    }
  }

  // ── Green Header ─────────────────────────────────────────────────────────────
  const Header = ({ title }: { title: string }) => (
    <div style={{ background: '#006838', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
      <div>
        <div style={{ fontSize: 26, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', opacity: 0.85, marginTop: 2 }}>Projeto {project.name}</div>
      </div>
      <div style={{ background: 'white', borderRadius: 8, padding: '6px 12px', minWidth: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/cropped-icon.png" alt="Princesa dos Campos" style={{ height: 52, width: 'auto', objectFit: 'contain', display: 'block' }} />
      </div>
    </div>
  )

  const listItemStyle = (color?: string): React.CSSProperties => ({
    fontSize: 12,
    lineHeight: 1.6,
    color: color ?? '#1f2937',
    fontWeight: color ? 700 : 400,
    marginBottom: 6,
  })

  // Width for hidden PDF template page (exact A4 aspect ratio helper)
  const PDF_WIDTH = 1400
  const PDF_HEIGHT = 990

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SCREEN VIEW (User Interface)                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="status-report-container bg-white text-black p-6 min-h-screen font-sans flex flex-col gap-4">

        {/* HEADER */}
        <div className="bg-[#006838] text-white p-4 rounded-t-xl flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">Status Report</h1>
            <h2 className="text-sm sm:text-md font-bold text-green-100 uppercase mt-0.5" title={project.name}>Projeto {project.name}</h2>
          </div>
          <div className="bg-white rounded-lg px-4 py-2 min-w-[120px] flex items-center justify-center">
            <img src="/cropped-icon.png" alt="Princesa dos Campos" className="h-12 w-auto object-contain" />
          </div>
        </div>

        {/* INFO BAR */}
        <div className="flex flex-wrap justify-end gap-5 px-4 py-2 border-b-2 border-[#006838] text-[11px] font-bold uppercase text-gray-600 items-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs font-bold border-primary text-primary hover:bg-primary/10"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
          >
            <Download className="h-3.5 w-3.5" />
            {isExportingPDF ? 'Gerando PDF...' : 'Exportar PDF'}
          </Button>
          <span><b>Cliente:</b> Expresso Princesa dos Campos</span>
          <span><b>Patrocinador:</b> Diretoria</span>
          <span><b>Owner:</b> {owner}</span>
          <span><b>Início:</b> {start.toLocaleDateString('pt-BR')}</span>
          <span><b>Go Live:</b> {end ? end.toLocaleDateString('pt-BR') : 'Não definido'}</span>
        </div>

        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2 p-4 border-2 border-black rounded-xl flex items-center justify-around bg-white">
            <div className="text-center">
              <span className="text-3xl sm:text-4xl font-black block">{totalTasks}</span>
              <span className="text-[10px] font-bold uppercase text-gray-500">Atividades</span>
            </div>
            <div className="text-center">
              <span className="text-3xl sm:text-4xl font-black block">{Math.round(progressAvg)}%</span>
              <span className="text-[10px] font-bold uppercase text-gray-500">Concluído</span>
            </div>
            <div className="text-center">
              <span className="text-3xl sm:text-4xl font-black block">{Math.round(expectedProgress)}%</span>
              <span className="text-[10px] font-bold uppercase text-gray-500">Previsto</span>
            </div>
          </div>
          <div className="col-span-1 p-4 border-2 border-black rounded-xl bg-white flex flex-col">
            <h3 className="font-black uppercase text-xs mb-1 text-[#006838]">Escopo</h3>
            <p className="text-[11px] leading-relaxed text-gray-600 flex-1">{project.description || 'Nenhum escopo definido.'}</p>
          </div>
        </div>

        {/* 4 BOXES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          {/* Pontos de Atenção */}
          <div className="border-2 border-black rounded-xl p-4 flex flex-col bg-white">
            <h3 className="text-center font-black uppercase text-xs mb-3 pb-2 border-b-2 border-[#006838] text-[#006838]">Pontos de Atenção</h3>
            <ul className="list-disc pl-4 text-[12px] space-y-1.5 text-red-600 font-bold flex-1">
              {attentionPoints.length > 0 ? (
                attentionPoints.map((pt, i) => <li key={i}>{pt}</li>)
              ) : (
                <li className="text-gray-400 italic list-none">Nenhum ponto.</li>
              )}
            </ul>
          </div>

          {/* Atividades Realizadas */}
          <div className="border-2 border-black rounded-xl p-4 flex flex-col bg-white">
            <h3 className="text-center font-black uppercase text-xs mb-3 pb-2 border-b-2 border-[#006838] text-[#006838]">Realizadas</h3>
            <ul className="list-disc pl-4 text-[12px] space-y-1.5 text-gray-600 flex-1">
              {doneTasks.slice(0, 10).map(t => <li key={t.id}>{t.title}</li>)}
              {doneTasks.length === 0 && <li className="text-gray-400 italic list-none">Nenhuma concluída</li>}
            </ul>
          </div>

          {/* Próx. Semana */}
          <div className="border-2 border-black rounded-xl p-4 flex flex-col bg-white">
            <h3 className="text-center font-black uppercase text-xs mb-3 pb-2 border-b-2 border-[#006838] text-[#006838]">Próx. Semana</h3>
            <ul className="list-disc pl-4 text-[12px] space-y-1.5 text-gray-600 flex-1">
              {nextWeekTasks.slice(0, 10).map(t => <li key={t.id}>{t.title}</li>)}
              {nextWeekTasks.length === 0 && <li className="text-gray-400 italic list-none">Nenhuma programada</li>}
            </ul>
          </div>

          {/* Atrasadas */}
          <div className="border-2 border-black rounded-xl p-4 flex flex-col bg-white">
            <h3 className="text-center font-black uppercase text-xs mb-3 pb-2 border-b-2 border-[#006838] text-[#006838]">Atrasadas</h3>
            <ul className="list-disc pl-4 text-[12px] space-y-1.5 text-red-600 font-bold flex-1">
              {delayedTasks.slice(0, 10).map(t => <li key={t.id}>{t.title}</li>)}
              {delayedTasks.length === 0 && <li className="text-gray-400 italic list-none">Nenhuma atrasada</li>}
            </ul>
          </div>
        </div>

        {/* Screen Gantt */}
        <div className="border-2 border-black rounded-xl overflow-hidden mt-4">
          <div className="flex items-center justify-between px-4 py-2 border-b border-black bg-gray-50">
            <h3 className="font-black uppercase text-xs text-primary">Cronograma</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsFullscreen(true)}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-x-auto p-3 bg-white">
            <GanttChart
              tasks={projectTasks}
              dependencies={taskDependencies}
              startDate={start}
              endDate={ganttEnd}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </div>

      </div>

      {/* Fullscreen Gantt */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full h-full rounded-xl shadow-2xl flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8" />
              <h3 className="font-black uppercase text-sm">Cronograma</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsFullscreen(false)}>
                <Minimize2 className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-x-auto">
              <GanttChart
                tasks={projectTasks}
                dependencies={taskDependencies}
                startDate={start}
                endDate={ganttEnd}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* HIDDEN TEMPLATES FOR PDF GENERATION                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>

        {/* PAGE 1: Status Report Template */}
        <div
          ref={page1Ref}
          style={{
            width: `${PDF_WIDTH}px`,
            height: `${PDF_HEIGHT}px`,
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Arial, sans-serif',
            boxSizing: 'border-box'
          }}
        >
          <Header title="Status Report" />

          {/* Info bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, padding: '8px 24px', borderBottom: '2.5px solid #006838', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#555' }}>
            <span><b>Cliente:</b> Expresso Princesa dos Campos</span>
            <span><b>Patrocinador:</b> Diretoria</span>
            <span><b>Owner:</b> {owner}</span>
            <span><b>Início:</b> {start.toLocaleDateString('pt-BR')}</span>
            <span><b>Go Live:</b> {end ? end.toLocaleDateString('pt-BR') : 'Não definido'}</span>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, padding: '16px 24px 10px' }}>
            <div style={{ border: '2px solid #000000', borderRadius: 8, padding: '12px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#006838', marginBottom: 4 }}>Evolução</div>
              <div style={{ display: 'flex', gap: 40 }}>
                {[{ val: totalTasks, label: 'Atividades' }, { val: `${Math.round(progressAvg)}%`, label: 'Concluído' }, { val: `${Math.round(expectedProgress)}%`, label: 'Previsto' }].map(({ val, label }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{val}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#444' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ border: '2px solid #000000', borderRadius: 8, padding: '12px 18px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#006838', marginBottom: 4 }}>Escopo</div>
              <p style={{ fontSize: 11, margin: 0, lineHeight: 1.5, color: '#374151', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{project.description || 'Nenhum escopo definido.'}</p>
            </div>
          </div>

          {/* 4 Boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, padding: '0 24px 24px', flex: 1, minHeight: 0 }}>
            {[
              {
                title: 'Pontos de Atenção',
                items: attentionPoints.slice(0, 8).map((pt, i) => <li key={i} style={listItemStyle('#dc2626')}>{pt}</li>),
              },
              {
                title: 'Atividades Realizadas',
                items: doneTasks.slice(0, 8).map(t => <li key={t.id} style={listItemStyle()}>{t.title}</li>),
              },
              {
                title: 'Próx. Semana',
                items: nextWeekTasks.slice(0, 8).map(t => <li key={t.id} style={listItemStyle('#374151')}>{t.title}</li>),
              },
              {
                title: 'Atrasadas',
                items: delayedTasks.slice(0, 8).map(t => <li key={t.id} style={listItemStyle('#dc2626')}>{t.title}</li>),
              },
            ].map(({ title, items }) => (
              <div key={title} style={{ display: 'flex', flexDirection: 'column', border: '2px solid #000000', borderRadius: 8, overflow: 'hidden', height: '100%' }}>
                <div style={{ background: '#f0fdf4', borderBottom: '3.5px solid #006838', padding: '10px 14px', textAlign: 'center', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#006838', letterSpacing: '0.05em' }}>
                  {title}
                </div>
                <div style={{ padding: '12px 16px', flex: 1, overflow: 'hidden' }}>
                  <ul style={{ margin: 0, paddingLeft: 18, listStyleType: items.length > 0 ? 'disc' : 'none' }}>
                    {items.length > 0 ? items : <li style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>Nenhum registro.</li>}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PAGE 2: Cronograma Template — PDF-safe Gantt (no sticky, no overflow, no transform) */}
        {(() => {
          // ── layout constants ──────────────────────────────────────────────
          const LABEL_W   = 260         // px — left column for task names (wider for long titles)
          const ROW_H     = 22          // px — row height
          const BODY_PAD  = 32          // px — left+right padding inside body (16px each)
          const HEADER_H  = 74          // px — green header height
          const META_H    = 30          // px — month/day header rows combined

          // ── date range ───────────────────────────────────────────────────
          const rangeStart = dateRange?.from ? new Date(dateRange.from) : new Date(start.getFullYear(), start.getMonth(), 1)
          rangeStart.setHours(0, 0, 0, 0)
          const rangeEnd   = dateRange?.to ? new Date(dateRange.to) : new Date(ganttEnd.getFullYear(), ganttEnd.getMonth() + 1, 0)
          rangeEnd.setHours(23, 59, 59, 999)

          const MONTHS_FULL_LOCAL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
          const MONTHS_SHORT_LOCAL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

          // Generate columns for PDF based on viewMode
          const columnsPdf: any[] = []
          if (viewMode === 'day') {
            const cur = new Date(rangeStart)
            while (cur <= rangeEnd) {
              const d = new Date(cur)
              const mIdx = d.getMonth()
              const y = d.getFullYear()
              columnsPdf.push({
                start: d,
                end: d,
                label: String(d.getDate()),
                sublabel: String(d.getDate()),
                isWeekend: d.getDay() === 0 || d.getDay() === 6,
                isFirstOfGroup: d.getDate() === 1 && columnsPdf.length > 0,
                key: `day-${columnsPdf.length}`,
                groupKey: `${y}-${mIdx}`,
                groupLabel: `${MONTHS_FULL_LOCAL[mIdx]} ${y}`,
              })
              cur.setDate(cur.getDate() + 1)
            }
          } else if (viewMode === 'week') {
            let curr = new Date(rangeStart)
            const dayOfWeek = curr.getDay()
            const diff = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
            curr = new Date(curr.setDate(diff))
            curr.setHours(0, 0, 0, 0)

            const endWeek = new Date(rangeEnd)
            const endDayOfWeek = endWeek.getDay()
            const endDiff = endWeek.getDate() + (endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek)
            const endWeekAdjusted = new Date(endWeek.setDate(endDiff))
            endWeekAdjusted.setHours(23, 59, 59, 999)

            while (curr <= endWeekAdjusted) {
              const wStart = new Date(curr)
              const wEnd = new Date(curr)
              wEnd.setDate(wEnd.getDate() + 6)
              wEnd.setHours(23, 59, 59, 999)

              const oneJan = new Date(wStart.getFullYear(), 0, 1)
              const numberOfDays = Math.floor((wStart.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000))
              const weekNum = Math.ceil((wStart.getDay() + 1 + numberOfDays) / 7)

              const mIdx = wStart.getMonth()
              const y = wStart.getFullYear()

              columnsPdf.push({
                start: wStart,
                end: wEnd,
                label: `Sem. ${weekNum}`,
                sublabel: `${wStart.getDate().toString().padStart(2, '0')}/${(wStart.getMonth()+1).toString().padStart(2, '0')}`,
                isWeekend: false,
                isFirstOfGroup: wStart.getDate() <= 7 && columnsPdf.length > 0,
                key: `week-${columnsPdf.length}`,
                groupKey: `${y}-${mIdx}`,
                groupLabel: `${MONTHS_FULL_LOCAL[mIdx]} ${y}`,
              })
              curr.setDate(curr.getDate() + 7)
            }
          } else {
            // month
            let curr = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
            curr.setHours(0, 0, 0, 0)

            const endMonth = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() + 1, 0)
            endMonth.setHours(23, 59, 59, 999)

            while (curr <= endMonth) {
              const mStart = new Date(curr)
              const mEnd = new Date(curr.getFullYear(), curr.getMonth() + 1, 0)
              mEnd.setHours(23, 59, 59, 999)

              const y = mStart.getFullYear()
              columnsPdf.push({
                start: mStart,
                end: mEnd,
                label: MONTHS_FULL_LOCAL[mStart.getMonth()],
                sublabel: MONTHS_SHORT_LOCAL[mStart.getMonth()],
                isWeekend: false,
                isFirstOfGroup: columnsPdf.length > 0 && mStart.getFullYear() !== columnsPdf[columnsPdf.length-1].start.getFullYear(),
                key: `month-${columnsPdf.length}`,
                groupKey: `${y}`,
                groupLabel: `${y}`,
              })
              curr.setMonth(curr.getMonth() + 1)
            }
          }

          const totalCols = columnsPdf.length
          const availableForBars = PDF_WIDTH - BODY_PAD - LABEL_W
          const colWidthPdf = viewMode === 'day'
            ? Math.max(4, Math.floor(availableForBars / Math.max(1, totalCols)))
            : Math.max(viewMode === 'week' ? 20 : 50, Math.floor(availableForBars / Math.max(1, totalCols)))
          const gridW = LABEL_W + totalCols * colWidthPdf

          // ── month/year spans for PDF ──────────────────────────────────────
          const groupSpansPdf: { label: string; count: number; key: string }[] = []
          columnsPdf.forEach((col) => {
            const key = col.groupKey
            const label = col.groupLabel
            if (!groupSpansPdf.length || groupSpansPdf[groupSpansPdf.length - 1].key !== key) {
              groupSpansPdf.push({ key, label, count: 1 })
            } else {
              groupSpansPdf[groupSpansPdf.length - 1].count++
            }
          })

          // ── task rows ────────────────────────────────────────────────────
          const ganttTasks = projectTasks
            .filter(t => t.deadline || t.actualStartDate || t.actualEndDate)
            .map(t => {
              const ts = new Date(t.actualStartDate || t.createdAt); ts.setHours(0,0,0,0)
              const te = new Date(t.actualEndDate || t.deadline || new Date(ts.getTime() + 86400000)); te.setHours(23,59,59,999)
              
              let startCol = -1
              let endCol = -1

              for (let idx = 0; idx < columnsPdf.length; idx++) {
                const col = columnsPdf[idx]
                if (ts <= col.end && te >= col.start) {
                  if (startCol === -1) startCol = idx
                  endCol = idx
                }
              }

              if (startCol === -1 || endCol === -1) return null
              return { ...t, startCol, endCol }
            })
            .filter((t): t is NonNullable<typeof t> => t !== null)
            .sort((a, b) => {
              if (!a.parentId && b.parentId) return -1
              if (a.parentId && !b.parentId) return 1
              return a.startCol - b.startCol
            })

          const totalH = HEADER_H + META_H + ganttTasks.length * ROW_H + 4
          const pdfH   = Math.max(PDF_HEIGHT, totalH)

          // ── bar colours ──────────────────────────────────────────────────
          const barColour = (progress: number) => {
            if (progress === 100)        return '#006838'  // verde — concluído
            if (progress > 0 && progress < 100) return '#F9A825'  // amarelo — em progresso
            return '#94a3b8' // cinza
          }

          return (
            <div
              ref={page2Ref}
              style={{
                width:      `${PDF_WIDTH}px`,
                height:     `${pdfH}px`,
                background: '#ffffff',
                display:    'flex',
                flexDirection: 'column',
                fontFamily: 'Arial, sans-serif',
                boxSizing:  'border-box'
              }}
            >
              <Header title="Cronograma" />

              {/* Gantt body */}
              <div style={{ padding: '12px 16px', flex: 1 }}>
                <div style={{ position: 'relative', width: `${gridW}px` }}>

                  {/* ── Month header ───────────────────────────── */}
                  <div style={{ display: 'flex', height: 16 }}>
                    <div style={{ width: LABEL_W, flexShrink: 0, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: '#006838', display: 'flex', alignItems: 'center', paddingLeft: 4 }}>Período</div>
                    <div style={{ display: 'flex', flex: 1 }}>
                      {groupSpansPdf.map((m, i) => (
                        <div key={i} style={{ width: m.count * colWidthPdf, flexShrink: 0, background: '#f0fdf4', borderLeft: '1px solid #e2e8f0', fontSize: 8, fontWeight: 900, textTransform: 'uppercase', color: '#006838', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {m.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Day numbers header ─────────────────────── */}
                  <div style={{ display: 'flex', height: 14, borderBottom: '2px solid #006838', marginBottom: 2 }}>
                    <div style={{ width: LABEL_W, flexShrink: 0, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', color: '#64748b', display: 'flex', alignItems: 'center', paddingLeft: 4 }}>Atividade</div>
                    <div style={{ display: 'flex', flex: 1 }}>
                      {columnsPdf.map((col, i) => (
                        <div key={col.key} style={{
                          width: colWidthPdf,
                          flexShrink: 0,
                          fontSize: viewMode === 'day' ? 6 : 7,
                          textAlign: 'center',
                          color: '#94a3b8',
                          background: col.isWeekend ? '#f8fafc' : '#ffffff',
                          borderLeft: col.isFirstOfGroup ? '1.5px solid #006838' : '1px solid #f1f5f9'
                        }}>
                          {viewMode === 'day' ? col.label : col.sublabel}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Task rows ──────────────────────────────── */}
                  {ganttTasks.map((task, idx) => {
                    const isMacro = !task.parentId
                    const barW = (task.endCol - task.startCol + 1) * colWidthPdf
                    const barX = task.startCol * colWidthPdf
                    const bg   = barColour(task.progress)
                    return (
                      <div key={task.id} style={{ display: 'flex', height: ROW_H, borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                        {/* Label — truncation must be on a block div with explicit width */}
                        <div style={{
                          width: LABEL_W,
                          flexShrink: 0,
                          boxSizing: 'border-box',
                          paddingLeft: isMacro ? 4 : 14,
                          paddingRight: 6,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: `${ROW_H}px`,
                          fontSize: isMacro ? 9 : 8,
                          fontWeight: isMacro ? 900 : 600,
                          color: isMacro ? '#111827' : '#4b5563',
                          textTransform: isMacro ? 'uppercase' : 'none'
                        }}>
                          {task.title}
                        </div>
                        {/* Bar area */}
                        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                          <div style={{ position: 'absolute', left: barX, width: barW, top: 3, bottom: 3, background: bg, borderRadius: 3, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                            {barW >= 28 && (
                              <span style={{ fontSize: 7, fontWeight: 900, color: '#ffffff', paddingLeft: 3, whiteSpace: 'nowrap' }}>
                                {Math.round(task.progress)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* ── Dependency arrows SVG overlay ───────────── */}
                  {taskDependencies.length > 0 && (() => {
                    const svgH = META_H + ganttTasks.length * ROW_H
                    return (
                      <svg
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: gridW,
                          height: svgH,
                          overflow: 'visible',
                          pointerEvents: 'none'
                        }}
                        width={gridW}
                        height={svgH}
                      >
                        <defs>
                          <marker
                            id="pdf-arrow"
                            markerWidth="5"
                            markerHeight="4"
                            refX="5"
                            refY="2"
                            orient="auto"
                          >
                            <polygon points="0 0, 5 2, 0 4" fill="#64748b" />
                          </marker>
                        </defs>
                        {taskDependencies.map(dep => {
                          const predIdx = ganttTasks.findIndex(t => t.id === dep.predecessorId)
                          const succIdx = ganttTasks.findIndex(t => t.id === dep.successorId)
                          if (predIdx === -1 || succIdx === -1) return null
                          const pred = ganttTasks[predIdx]
                          const succ = ganttTasks[succIdx]

                          // Absolute X coordinates within the SVG (offset by LABEL_W)
                          const startX = LABEL_W + (pred.endCol + 1) * colWidthPdf
                          const startY = META_H + predIdx * ROW_H + ROW_H / 2
                          const endX   = LABEL_W + succ.startCol * colWidthPdf
                          const endY   = META_H + succIdx * ROW_H + ROW_H / 2

                          let path = ''
                          if (endX >= startX + 10) {
                            const midX = startX + 8
                            path = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX - 2} ${endY}`
                          } else {
                            const midX1 = startX + 8
                            const midY  = startY + ROW_H / 2
                            const midX2 = endX - 8
                            path = `M ${startX} ${startY} L ${midX1} ${startY} L ${midX1} ${midY} L ${midX2} ${midY} L ${midX2} ${endY} L ${endX - 2} ${endY}`
                          }

                          return (
                            <path
                              key={dep.id}
                              d={path}
                              fill="none"
                              stroke="#64748b"
                              strokeWidth="1.2"
                              markerEnd="url(#pdf-arrow)"
                            />
                          )
                        })}
                      </svg>
                    )
                  })()}
                </div>
              </div>
            </div>
          )
        })()}

      </div>
    </>
  )
}
