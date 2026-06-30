'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { Task, TaskDependency, TASK_STATUS_INFO } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarDays, Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { DateRange } from 'react-day-picker'

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
  dependencies?: TaskDependency[]
  startDate: Date
  endDate: Date
}

export function GanttChart({ tasks, dependencies = [], startDate, endDate }: GanttChartProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(startDate.getFullYear(), startDate.getMonth(), 1),
    to: new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0)
  })

  const gridRef = useRef<HTMLDivElement>(null)
  const [gridWidth, setGridWidth] = useState(0)

  useEffect(() => {
    if (!gridRef.current) return
    const observer = new ResizeObserver((entries) => {
      setGridWidth(entries[0].contentRect.width)
    })
    observer.observe(gridRef.current)
    return () => observer.disconnect()
  }, [])

  // Generate array of days from dateRange
  const days = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return []
    const d: { date: Date; monthIndex: number; year: number }[] = []
    let curr = new Date(dateRange.from)
    curr.setHours(0,0,0,0)
    const end = new Date(dateRange.to)
    end.setHours(23,59,59,999)
    
    while (curr <= end) {
      d.push({
        date: new Date(curr),
        monthIndex: curr.getMonth(),
        year: curr.getFullYear()
      })
      curr.setDate(curr.getDate() + 1)
    }
    return d
  }, [dateRange])

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

  const dateRangeLabel = dateRange?.from && dateRange?.to 
    ? `${dateRange.from.toLocaleDateString('pt-BR')} até ${dateRange.to.toLocaleDateString('pt-BR')}`
    : 'Selecionar período'

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return
    isDragging.current = true
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft
    scrollLeft.current = scrollContainerRef.current.scrollLeft
  }

  const handleMouseLeave = () => {
    isDragging.current = false
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - startX.current) * 1.5 // Scroll speed
    scrollContainerRef.current.scrollLeft = scrollLeft.current - walk
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Filters */}
      <div className="flex items-center gap-2 print:hidden justify-end flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8 text-xs font-bold bg-background gap-1.5 min-w-[200px]">
              <CalendarDays className="h-3.5 w-3.5" />
              {dateRangeLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Gantt Grid */}
      <div 
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="w-full overflow-x-auto border border-border/50 rounded-xl bg-background pb-2 scrollbar-thin scrollbar-thumb-primary/20 print:overflow-visible print:border-black relative cursor-grab active:cursor-grabbing"
      >
        <div 
          ref={gridRef}
          className="min-w-max grid relative select-none" 
          style={{ 
            gridTemplateColumns: `220px repeat(${days.length}, 20px)` 
          }}
        >
          {/* SVGs for dependencies */}
          <svg className="absolute inset-0 pointer-events-none z-10 print:block" width="100%" height="100%" style={{ overflow: 'visible' }}>
            <defs>
              <marker
                id="arrowhead"
                markerWidth="4"
                markerHeight="3"
                refX="4"
                refY="1.5"
                orient="auto"
                className="fill-slate-400 print:fill-slate-500"
              >
                <polygon points="0 0, 4 1.5, 0 3" />
              </marker>
            </defs>
            {dependencies.map(dep => {
              const predIdx = chartTasks.findIndex(t => t.id === dep.predecessorId)
              const succIdx = chartTasks.findIndex(t => t.id === dep.successorId)
              if (predIdx === -1 || succIdx === -1) return null

              const pred = chartTasks[predIdx]
              const succ = chartTasks[succIdx]

              // Calculate start coordinates (right side of predecessor bar)
              const startX = 220 + (pred.endCol * 20)
              const startY = 64 + (predIdx * 25) + 12.5

              // Calculate end coordinates (left side of successor bar)
              const endX = 220 + ((succ.startCol - 1) * 20)
              const endY = 64 + (succIdx * 25) + 12.5

              if (!gridWidth) return null;
              
              let path = '';
              if (endX >= startX + 10) {
                // Successor is to the right
                const midX = startX + 8;
                path = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX - 2} ${endY}`;
              } else {
                // Successor is to the left or directly below (route around)
                const midX1 = startX + 8;
                const midY = startY + 12; // halfway down to next row
                const midX2 = endX - 8;
                path = `M ${startX} ${startY} L ${midX1} ${startY} L ${midX1} ${midY} L ${midX2} ${midY} L ${midX2} ${endY} L ${endX - 2} ${endY}`;
              }

              return (
                <path
                  key={dep.id}
                  d={path}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-slate-400 print:text-slate-500"
                  markerEnd="url(#arrowhead)"
                />
              )
            })}
          </svg>
          {/* Month Header Row */}
          <div className="sticky left-0 z-30 bg-background border-b border-border/50 flex items-center p-2 text-[10px] font-black uppercase tracking-widest text-primary overflow-hidden print:bg-white print:text-black">
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
          <div className="sticky left-0 z-20 bg-background border-b border-border/50 flex items-end p-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground overflow-hidden print:bg-white print:text-black print:backdrop-blur-none">
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

          {/* Background Vertical Lines (Optimized) */}
          {days.map((d, i) => {
            const isWeekend = d.date.getDay() === 0 || d.date.getDay() === 6
            const isFirstOfMonth = d.date.getDate() === 1 && i > 0
            return (
              <div 
                key={`bg-${i}`} 
                className={cn(
                  "pointer-events-none z-0",
                  isFirstOfMonth && "border-l-2 border-l-primary/30",
                  !isFirstOfMonth && "border-l border-l-border/10",
                  isWeekend && "bg-muted/10 print:hidden"
                )}
                style={{ gridColumn: i + 2, gridRow: `3 / span ${Math.max(1, chartTasks.length)}` }}
              />
            )
          })}

          {/* Task Rows */}
          {chartTasks.map((task, index) => {
            const statusInfo = TASK_STATUS_INFO[task.status]
            const isMacro = task.parentId === null
            const rowIdx = index + 3
            
            return (
              <div className="contents" key={task.id}>
                <div 
                  className={cn(
                    "sticky left-0 z-20 bg-background print:bg-white border-b border-border/30 px-2 py-1 flex items-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] print:shadow-none",
                    isMacro ? "pl-2" : "pl-5"
                  )}
                  style={{ gridColumn: 1, gridRow: rowIdx }}
                >
                  <div className="truncate w-full text-[9px] font-bold" title={task.title}>
                    {isMacro ? (
                      <span className="font-black uppercase">{task.title}</span>
                    ) : (
                      <span className="text-muted-foreground">{task.title}</span>
                    )}
                  </div>
                </div>

                <div 
                  className="relative h-6 flex items-center border-b border-border/10"
                  style={{ gridColumn: `2 / span ${days.length}`, gridRow: rowIdx }}
                >
                  {task.startCol <= days.length && task.endCol >= 1 && (
                    <div 
                      className={cn(
                        "absolute inset-y-0.5 z-10 rounded-sm",
                        statusInfo.color.replace('text-', 'bg-').replace('/20', '/80')
                      )}
                      style={{
                        left: `${(Math.max(1, task.startCol) - 1) * 20}px`,
                        width: `${(Math.min(days.length, task.endCol) - Math.max(1, task.startCol) + 1) * 20}px`
                      }}
                      title={`${task.title} - ${statusInfo.name} (${Math.round(task.progress)}%)`}
                    >
                      {task.duration >= 2 && (
                        <span className="absolute left-1 top-0 bottom-0 flex items-center text-[9px] font-black text-white whitespace-nowrap drop-shadow-md pointer-events-none print:text-white">
                          {Math.round(task.progress)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
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
