'use client'

import { useMemo, useState } from 'react'
import { Task, TASK_STATUS_INFO } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarDays, Calendar } from 'lucide-react'

const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
]

const MONTHS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

interface GanttChartProps {
  tasks: Task[]
  startDate: Date
  endDate: Date
}

export function GanttChart({ tasks, startDate, endDate }: GanttChartProps) {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const [selectedMonths, setSelectedMonths] = useState<number[]>([currentMonth])

  // Derive years from project startDate and endDate
  const projectYears = useMemo(() => {
    const s = new Date(startDate)
    const e = new Date(endDate)
    const startYear = s.getFullYear()
    const endYear = e.getFullYear()
    const years: number[] = []
    for (let y = startYear; y <= endYear; y++) {
      years.push(y)
    }
    if (!years.includes(currentYear)) years.push(currentYear)
    years.sort((a, b) => a - b)
    return years
  }, [startDate, endDate, currentYear])

  const [selectedYears, setSelectedYears] = useState<number[]>(() => {
    return projectYears.includes(currentYear) ? [currentYear] : [projectYears[0]]
  })

  const toggleMonth = (month: number) => {
    setSelectedMonths(prev => {
      if (prev.includes(month)) {
        if (prev.length === 1) return prev
        return prev.filter(m => m !== month).sort((a, b) => a - b)
      }
      return [...prev, month].sort((a, b) => a - b)
    })
  }

  const toggleYear = (year: number) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        if (prev.length === 1) return prev
        return prev.filter(y => y !== year).sort((a, b) => a - b)
      }
      return [...prev, year].sort((a, b) => a - b)
    })
  }

  const selectAllMonths = () => setSelectedMonths([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  const selectCurrentMonth = () => setSelectedMonths([currentMonth])
  const selectAllYears = () => setSelectedYears([...projectYears])
  const selectCurrentYear = () => setSelectedYears([currentYear])

  // Generate array of days for all selected years + months combinations (sorted)
  const days = useMemo(() => {
    const d: { date: Date; monthIndex: number; year: number }[] = []
    const sortedYears = [...selectedYears].sort((a, b) => a - b)
    const sortedMonths = [...selectedMonths].sort((a, b) => a - b)
    for (const year of sortedYears) {
      for (const month of sortedMonths) {
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        for (let i = 1; i <= daysInMonth; i++) {
          d.push({ date: new Date(year, month, i), monthIndex: month, year })
        }
      }
    }
    return d
  }, [selectedMonths, selectedYears])

  const gridStart = useMemo(() => {
    if (days.length === 0) return new Date()
    const d = new Date(days[0].date)
    d.setHours(0, 0, 0, 0)
    return d
  }, [days])

  const chartTasks = useMemo(() => {
    return tasks
      .filter(t => t.deadline || t.actualStartDate || t.actualEndDate)
      .map(t => {
        const taskStart = t.actualStartDate ? new Date(t.actualStartDate) : new Date(t.createdAt)
        const taskEnd = t.actualEndDate ? new Date(t.actualEndDate) : (t.deadline ? new Date(t.deadline) : new Date(taskStart.getTime() + 86400000))
        
        taskStart.setHours(0, 0, 0, 0)
        taskEnd.setHours(23, 59, 59, 999)

        let startCol = Math.floor((taskStart.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
        let endCol = Math.floor((taskEnd.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

        if (endCol < 1 || startCol > days.length) return null
        if (startCol < 1) startCol = 1
        if (endCol > days.length) endCol = days.length

        return { ...t, startCol, endCol, duration: endCol - startCol + 1 }
      })
      .filter((t): t is (Task & { startCol: number, endCol: number, duration: number }) => t !== null)
      .sort((a, b) => {
        if (a.parentId === null && b.parentId !== null) return -1
        if (a.parentId !== null && b.parentId === null) return 1
        return a.startCol - b.startCol
      })
  }, [tasks, gridStart, days.length])

  // Month header spans (for visual grouping)
  const monthSpans = useMemo(() => {
    const spans: { key: string; label: string; count: number }[] = []
    let currentKey = ''
    let currentCount = 0

    days.forEach((d) => {
      const key = `${d.year}-${d.monthIndex}`
      if (key !== currentKey) {
        if (currentKey) {
          spans.push({ key: currentKey, label: spans.length > 0 ? `${MONTHS[parseInt(currentKey.split('-')[1])]}/${currentKey.split('-')[0]}` : `${MONTHS_FULL[parseInt(currentKey.split('-')[1])]} ${currentKey.split('-')[0]}`, count: currentCount })
        }
        currentKey = key
        currentCount = 1
      } else {
        currentCount++
      }
    })
    if (currentKey) {
      spans.push({ key: currentKey, label: `${MONTHS_FULL[parseInt(currentKey.split('-')[1])]} ${currentKey.split('-')[0]}`, count: currentCount })
    }
    // Simplify labels - just show "Mês Ano" for each
    return spans.map(s => {
      const [year, month] = s.key.split('-').map(Number)
      return { ...s, label: `${MONTHS_FULL[month]} ${year}` }
    })
  }, [days])

  const monthsLabel = selectedMonths.length === 12
    ? 'Todos os meses'
    : selectedMonths.length === 1
      ? MONTHS_FULL[selectedMonths[0]]
      : `${selectedMonths.length} meses`

  const yearsLabel = selectedYears.length === projectYears.length && projectYears.length > 1
    ? 'Todos os anos'
    : selectedYears.length === 1
      ? selectedYears[0].toString()
      : `${selectedYears.length} anos`

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Filters */}
      <div className="flex items-center gap-2 print:hidden justify-end flex-wrap">
        {/* Month multi-select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8 text-xs font-bold bg-background gap-1.5 min-w-[130px]">
              <CalendarDays className="h-3.5 w-3.5" />
              {monthsLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-3" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Meses</span>
                <div className="flex gap-1">
                  <button onClick={selectAllMonths} className="text-[10px] font-bold text-primary hover:underline">Todos</button>
                  <span className="text-muted-foreground/40">|</span>
                  <button onClick={selectCurrentMonth} className="text-[10px] font-bold text-primary hover:underline">Atual</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {MONTHS_FULL.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => toggleMonth(i)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all border",
                      selectedMonths.includes(i)
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-background border-border/50 text-muted-foreground hover:bg-secondary/50"
                    )}
                  >
                    <div className={cn(
                      "h-3 w-3 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
                      selectedMonths.includes(i) ? "bg-primary border-primary" : "border-muted-foreground/30"
                    )}>
                      {selectedMonths.includes(i) && (
                        <svg className="h-2 w-2 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    {MONTHS[i]}
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Year multi-select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8 text-xs font-bold bg-background gap-1.5 min-w-[100px]">
              <Calendar className="h-3.5 w-3.5" />
              {yearsLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[180px] p-3" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Anos</span>
                {projectYears.length > 1 && (
                  <div className="flex gap-1">
                    <button onClick={selectAllYears} className="text-[10px] font-bold text-primary hover:underline">Todos</button>
                    <span className="text-muted-foreground/40">|</span>
                    <button onClick={selectCurrentYear} className="text-[10px] font-bold text-primary hover:underline">Atual</button>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                {projectYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => toggleYear(year)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border",
                      selectedYears.includes(year)
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-background border-border/50 text-muted-foreground hover:bg-secondary/50"
                    )}
                  >
                    <div className={cn(
                      "h-3.5 w-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
                      selectedYears.includes(year) ? "bg-primary border-primary" : "border-muted-foreground/30"
                    )}>
                      {selectedYears.includes(year) && (
                        <svg className="h-2 w-2 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Gantt Grid */}
      <div className="w-full overflow-x-auto border border-border/50 rounded-xl bg-background pb-2 scrollbar-thin scrollbar-thumb-primary/20 print:overflow-visible print:border-black">
        <div 
          className="min-w-max grid print:min-w-0 print:w-full" 
          style={{ 
            gridTemplateColumns: `minmax(180px, 220px) repeat(${days.length}, minmax(16px, 1fr))` 
          }}
        >
          {/* Month Header Row */}
          <div className="sticky left-0 z-30 bg-primary/5 border-b border-border/50 flex items-center p-2 text-[10px] font-black uppercase tracking-widest text-primary print:bg-white print:text-black">
            Período
          </div>
          {monthSpans.map((span) => (
            <div
              key={span.key}
              className="bg-primary/5 border-b border-l border-border/50 flex items-center justify-center text-[10px] font-black uppercase tracking-wider text-primary print:bg-white print:text-black"
              style={{ gridColumn: `span ${span.count}` }}
            >
              {span.label}
            </div>
          ))}

          {/* Day Header Row */}
          <div className="sticky left-0 z-20 bg-muted/80 backdrop-blur-md border-b border-border/50 flex items-end p-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground print:bg-white print:text-black">
            Atividade
          </div>
          
          {days.map((d, i) => {
            const isWeekend = d.date.getDay() === 0 || d.date.getDay() === 6
            const isFirstOfMonth = d.date.getDate() === 1 && i > 0
            return (
              <div 
                key={i} 
                className={cn(
                  "border-b border-border/30 h-8 flex flex-col items-center justify-center text-[8px] font-bold overflow-hidden",
                  isFirstOfMonth && "border-l-2 border-l-primary/30",
                  !isFirstOfMonth && "border-l border-l-border/30",
                  isWeekend ? "bg-muted/30 text-muted-foreground/50 print:bg-gray-100" : "bg-muted/10 text-muted-foreground print:bg-white"
                )}
              >
                <span>{d.date.getDate()}</span>
              </div>
            )
          })}

          {/* Task Rows */}
          {chartTasks.map((task) => {
            const statusInfo = TASK_STATUS_INFO[task.status]
            const isMacro = task.parentId === null
            
            return (
              <div className="contents" key={task.id}>
                <div 
                  className={cn(
                    "sticky left-0 z-10 bg-background print:bg-white border-b border-border/30 px-2 py-1 flex items-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] print:shadow-none",
                    isMacro ? "pl-2" : "pl-5"
                  )}
                >
                  <div className="truncate w-full text-[9px] font-bold" title={task.title}>
                    {isMacro ? (
                      <span className="font-black uppercase">{task.title}</span>
                    ) : (
                      <span className="text-muted-foreground">{task.title}</span>
                    )}
                  </div>
                </div>

                {days.map((d, i) => {
                  const isWeekend = d.date.getDay() === 0 || d.date.getDay() === 6
                  const isFirstOfMonth = d.date.getDate() === 1 && i > 0
                  const colIndex = i + 1
                  const isTaskDay = colIndex >= task.startCol && colIndex <= task.endCol
                  const isStart = colIndex === task.startCol
                  const isEnd = colIndex === task.endCol

                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "border-b border-border/10 relative h-6 flex items-center",
                        isFirstOfMonth && "border-l-2 border-l-primary/30",
                        !isFirstOfMonth && "border-l border-l-border/10",
                        isWeekend && "bg-muted/10"
                      )}
                    >
                      {isTaskDay && (
                        <div 
                          className={cn(
                            "absolute inset-y-0.5 w-[105%] z-0",
                            statusInfo.color.replace('text-', 'bg-').replace('/20', '/80'),
                            isStart && "rounded-l-sm ml-0.5",
                            isEnd && "rounded-r-sm mr-0.5",
                            !isStart && !isEnd && "-mx-px"
                          )}
                          title={`${task.title} - ${statusInfo.name} (${Math.round(task.progress)}%)`}
                        >
                          {isStart && task.duration >= 2 && (
                            <span className="text-[9px] font-black text-white px-1 whitespace-nowrap overflow-hidden block leading-[24px] drop-shadow-md print:text-white print:drop-shadow-none">
                              {Math.round(task.progress)}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {chartTasks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground/60">
          <p className="text-xs font-bold">Nenhuma atividade neste período.</p>
          <p className="text-[10px]">Selecione outros meses ou verifique os prazos das tarefas.</p>
        </div>
      )}
    </div>
  )
}
