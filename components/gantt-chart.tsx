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

function MonthPicker({ value, onChange }: { value: DateRange | undefined; onChange: (range: DateRange | undefined) => void }) {
  const [year, setYear] = useState((value?.from || new Date()).getFullYear())
  const [hoverMonth, setHoverMonth] = useState<number | null>(null)

  const MONTHS_SHORT_LOCAL = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  const handleMonthClick = (mIdx: number) => {
    if (!value?.from || (value.from && value.to)) {
      const from = new Date(year, mIdx, 1)
      from.setHours(0,0,0,0)
      onChange({ from, to: undefined })
    } else {
      const date1 = value.from
      const date2 = new Date(year, mIdx, 1)
      if (date2 < date1) {
        const from = new Date(year, mIdx, 1)
        from.setHours(0,0,0,0)
        const to = new Date(date1.getFullYear(), date1.getMonth() + 1, 0)
        to.setHours(23,59,59,999)
        onChange({ from, to })
      } else {
        const from = new Date(date1.getFullYear(), date1.getMonth(), 1)
        from.setHours(0,0,0,0)
        const to = new Date(year, mIdx + 1, 0)
        to.setHours(23,59,59,999)
        onChange({ from, to })
      }
    }
  }

  const isSelected = (mIdx: number) => {
    if (!value?.from) return false
    const date = new Date(year, mIdx, 1)
    if (value.from && value.to) {
      return date >= new Date(value.from.getFullYear(), value.from.getMonth(), 1) &&
             date <= new Date(value.to.getFullYear(), value.to.getMonth(), 1)
    }
    return date.getFullYear() === value.from.getFullYear() && date.getMonth() === value.from.getMonth()
  }

  const isBetween = (mIdx: number) => {
    if (!value?.from || value.to || hoverMonth === null) return false
    const start = value.from
    const current = new Date(year, mIdx, 1)
    const hover = new Date(year, hoverMonth, 1)
    if (hover > start) {
      return current > start && current < hover
    } else {
      return current < start && current > hover
    }
  }

  return (
    <div className="p-3 w-[280px] bg-background text-foreground">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setYear(year - 1)}>
          &lt;
        </Button>
        <span className="text-sm font-bold">{year}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setYear(year + 1)}>
          &gt;
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MONTHS_SHORT_LOCAL.map((label, idx) => {
          const selected = isSelected(idx)
          const between = isBetween(idx)
          return (
            <Button
              key={idx}
              variant={selected ? "default" : "ghost"}
              className={cn(
                "h-10 text-xs font-bold capitalize",
                between && "bg-muted text-foreground"
              )}
              onClick={() => handleMonthClick(idx)}
              onMouseEnter={() => setHoverMonth(idx)}
              onMouseLeave={() => setHoverMonth(null)}
            >
              {label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function WeekPicker({ value, onChange }: { value: DateRange | undefined; onChange: (range: DateRange | undefined) => void }) {
  const [year, setYear] = useState((value?.from || new Date()).getFullYear())
  const [hoverWeek, setHoverWeek] = useState<number | null>(null)

  const weeks = useMemo(() => {
    const list: { weekNum: number; start: Date; end: Date; label: string }[] = []
    let curr = new Date(year, 0, 1)
    while (curr.getDay() !== 1) {
      curr.setDate(curr.getDate() + 1)
    }
    curr.setHours(0,0,0,0)

    for (let w = 1; w <= 52; w++) {
      const wStart = new Date(curr)
      const wEnd = new Date(curr)
      wEnd.setDate(wEnd.getDate() + 6)
      wEnd.setHours(23,59,59,999)

      list.push({
        weekNum: w,
        start: wStart,
        end: wEnd,
        label: `Semana ${w} (${wStart.getDate().toString().padStart(2, '0')}/${(wStart.getMonth()+1).toString().padStart(2, '0')} - ${wEnd.getDate().toString().padStart(2, '0')}/${(wEnd.getMonth()+1).toString().padStart(2, '0')})`
      })

      curr.setDate(curr.getDate() + 7)
    }
    return list
  }, [year])

  const handleWeekClick = (week: typeof weeks[0]) => {
    if (!value?.from || (value.from && value.to)) {
      onChange({ from: week.start, to: undefined })
    } else {
      const date1 = value.from
      const date2 = week.start
      if (date2 < date1) {
        const endOfDate1Week = new Date(date1)
        endOfDate1Week.setDate(endOfDate1Week.getDate() + 6)
        endOfDate1Week.setHours(23, 59, 59, 999)
        onChange({ from: week.start, to: endOfDate1Week })
      } else {
        onChange({ from: date1, to: week.end })
      }
    }
  }

  const isSelected = (week: typeof weeks[0]) => {
    if (!value?.from) return false
    if (value.from && value.to) {
      return week.start >= value.from && week.end <= value.to
    }
    return week.start.getTime() === value.from.getTime()
  }

  const isBetween = (week: typeof weeks[0]) => {
    if (!value?.from || value.to || hoverWeek === null) return false
    const start = value.from
    const current = week.start
    const hover = weeks[hoverWeek - 1]?.start
    if (!hover) return false
    if (hover > start) {
      return current > start && current < hover
    } else {
      return current < start && current > hover
    }
  }

  return (
    <div className="p-3 w-[300px] bg-background text-foreground">
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setYear(year - 1)}>
          &lt;
        </Button>
        <span className="text-sm font-bold">{year}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setYear(year + 1)}>
          &gt;
        </Button>
      </div>
      <div className="h-[280px] overflow-y-auto space-y-1 pr-1 border rounded-md p-1 scrollbar-thin">
        {weeks.map((w) => {
          const selected = isSelected(w)
          const between = isBetween(w)
          return (
            <Button
              key={w.weekNum}
              variant={selected ? "default" : "ghost"}
              className={cn(
                "w-full text-left justify-start text-[11px] h-8 px-2",
                between && "bg-muted text-foreground"
              )}
              onClick={() => handleWeekClick(w)}
              onMouseEnter={() => setHoverWeek(w.weekNum)}
              onMouseLeave={() => setHoverWeek(null)}
            >
              {w.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

interface GanttChartProps {
  tasks: Task[]
  dependencies?: TaskDependency[]
  startDate: Date
  endDate: Date
  viewMode?: 'day' | 'week' | 'month'
  onViewModeChange?: (mode: 'day' | 'week' | 'month') => void
  dateRange?: DateRange
  onDateRangeChange?: (range: DateRange | undefined) => void
}

export function GanttChart({
  tasks,
  dependencies = [],
  startDate,
  endDate,
  viewMode: controlledViewMode,
  onViewModeChange,
  dateRange: controlledDateRange,
  onDateRangeChange
}: GanttChartProps) {
  const [internalViewMode, setInternalViewMode] = useState<'day' | 'week' | 'month'>('day')
  const viewMode = controlledViewMode ?? internalViewMode
  const setViewMode = onViewModeChange ?? setInternalViewMode

  const [internalDateRange, setInternalDateRange] = useState<DateRange | undefined>({
    from: new Date(startDate.getFullYear(), startDate.getMonth(), 1),
    to: new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0)
  })
  const dateRange = controlledDateRange ?? internalDateRange
  const setDateRange = onDateRangeChange ?? setInternalDateRange

  const colWidth = viewMode === 'day' ? 20 : viewMode === 'week' ? 60 : 100

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

  // Generate array of days from dateRange (still used for some background logic or day calculation)
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

  // Generate grid columns based on viewMode
  const columns = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return []

    if (viewMode === 'day') {
      return days.map((d, i) => ({
        start: d.date,
        end: d.date,
        label: String(d.date.getDate()),
        sublabel: String(d.date.getDate()),
        isWeekend: d.date.getDay() === 0 || d.date.getDay() === 6,
        isFirstOfGroup: d.date.getDate() === 1 && i > 0,
        key: `day-${i}`,
        groupKey: `${d.year}-${d.monthIndex}`,
        groupLabel: `${MONTHS_FULL[d.monthIndex]} ${d.year}`,
      }))
    } else if (viewMode === 'week') {
      const list: any[] = []
      let curr = new Date(dateRange.from)
      const dayOfWeek = curr.getDay()
      const diff = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      curr = new Date(curr.setDate(diff))
      curr.setHours(0, 0, 0, 0)

      const end = new Date(dateRange.to)
      const endDayOfWeek = end.getDay()
      const endDiff = end.getDate() + (endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek)
      const endWeek = new Date(end.setDate(endDiff))
      endWeek.setHours(23, 59, 59, 999)

      let i = 0
      while (curr <= endWeek) {
        const wStart = new Date(curr)
        const wEnd = new Date(curr)
        wEnd.setDate(wEnd.getDate() + 6)
        wEnd.setHours(23, 59, 59, 999)

        const oneJan = new Date(wStart.getFullYear(), 0, 1)
        const numberOfDays = Math.floor((wStart.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000))
        const weekNum = Math.ceil((wStart.getDay() + 1 + numberOfDays) / 7)

        const mIdx = wStart.getMonth()
        const y = wStart.getFullYear()

        list.push({
          start: wStart,
          end: wEnd,
          label: `Sem. ${weekNum}`,
          sublabel: `${wStart.getDate().toString().padStart(2, '0')}/${(wStart.getMonth()+1).toString().padStart(2, '0')}`,
          isWeekend: false,
          isFirstOfGroup: wStart.getDate() <= 7 && i > 0,
          key: `week-${i}`,
          groupKey: `${y}-${mIdx}`,
          groupLabel: `${MONTHS_FULL[mIdx]} ${y}`,
        })
        curr.setDate(curr.getDate() + 7)
        i++
      }
      return list
    } else {
      // month
      const list: any[] = []
      let curr = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), 1)
      curr.setHours(0, 0, 0, 0)

      const end = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)

      let i = 0
      while (curr <= end) {
        const mStart = new Date(curr)
        const mEnd = new Date(curr.getFullYear(), curr.getMonth() + 1, 0)
        mEnd.setHours(23, 59, 59, 999)

        const y = mStart.getFullYear()
        list.push({
          start: mStart,
          end: mEnd,
          label: MONTHS_FULL[mStart.getMonth()],
          sublabel: MONTHS[mStart.getMonth()],
          isWeekend: false,
          isFirstOfGroup: i > 0 && mStart.getFullYear() !== list[i-1].start.getFullYear(),
          key: `month-${i}`,
          groupKey: `${y}`,
          groupLabel: `${y}`,
        })
        curr.setMonth(curr.getMonth() + 1)
        i++
      }
      return list
    }
  }, [dateRange, viewMode, days])

  const chartTasks = useMemo(() => {
    return tasks
      .filter(t => t.deadline || t.actualStartDate || t.actualEndDate)
      .map(t => {
        const taskStart = t.actualStartDate ? new Date(t.actualStartDate) : new Date(t.createdAt)
        const taskEnd = t.actualEndDate ? new Date(t.actualEndDate) : (t.deadline ? new Date(t.deadline) : new Date(taskStart.getTime() + 86400000))
        
        taskStart.setHours(0, 0, 0, 0)
        taskEnd.setHours(23, 59, 59, 999)

        let startCol = -1
        let endCol = -1

        for (let idx = 0; idx < columns.length; idx++) {
          const col = columns[idx]
          if (taskStart <= col.end && taskEnd >= col.start) {
            if (startCol === -1) startCol = idx + 1
            endCol = idx + 1
          }
        }

        if (startCol === -1 || endCol === -1) return null

        return { ...t, startCol, endCol, duration: endCol - startCol + 1 }
      })
      .filter((t): t is (Task & { startCol: number, endCol: number, duration: number }) => t !== null)
      .sort((a, b) => {
        if (a.parentId === null && b.parentId !== null) return -1
        if (a.parentId !== null && b.parentId === null) return 1
        return a.startCol - b.startCol
      })
  }, [tasks, columns])

  // Group header spans (for visual grouping)
  const groupSpans = useMemo(() => {
    const spans: { key: string; label: string; count: number }[] = []
    let currentKey = ''
    let currentCount = 0

    columns.forEach((col) => {
      const key = col.groupKey
      if (key !== currentKey) {
        if (currentKey) {
          spans.push({ key: currentKey, label: columns.find(c => c.groupKey === currentKey)?.groupLabel || '', count: currentCount })
        }
        currentKey = key
        currentCount = 1
      } else {
        currentCount++
      }
    })
    if (currentKey) {
      spans.push({ key: currentKey, label: columns.find(c => c.groupKey === currentKey)?.groupLabel || '', count: currentCount })
    }
    return spans
  }, [columns])

  // Automatically align date range when viewMode changes
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return

    if (viewMode === 'week') {
      const from = new Date(dateRange.from)
      const dayOfWeekFrom = from.getDay()
      const diffToMonday = from.getDate() - dayOfWeekFrom + (dayOfWeekFrom === 0 ? -6 : 1)
      const startOfWeek = new Date(from.setDate(diffToMonday))
      startOfWeek.setHours(0,0,0,0)

      const to = new Date(dateRange.to)
      const dayOfWeekTo = to.getDay()
      const diffToSunday = to.getDate() + (dayOfWeekTo === 0 ? 0 : 7 - dayOfWeekTo)
      const endOfWeek = new Date(to.setDate(diffToSunday))
      endOfWeek.setHours(23,59,59,999)

      if (dateRange.from.getTime() !== startOfWeek.getTime() || dateRange.to.getTime() !== endOfWeek.getTime()) {
        setDateRange({ from: startOfWeek, to: endOfWeek })
      }
    } else if (viewMode === 'month') {
      const from = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), 1)
      from.setHours(0,0,0,0)
      const to = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth() + 1, 0)
      to.setHours(23,59,59,999)

      if (dateRange.from.getTime() !== from.getTime() || dateRange.to.getTime() !== to.getTime()) {
        setDateRange({ from, to })
      }
    }
  }, [viewMode])

  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range) {
      setDateRange(undefined)
      return
    }

    if (viewMode === 'day') {
      setDateRange(range)
    } else if (viewMode === 'week') {
      if (range.from && !range.to) {
        const from = new Date(range.from)
        const dayOfWeek = from.getDay()
        const diffToMonday = from.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        const startOfWeek = new Date(from.setDate(diffToMonday))
        startOfWeek.setHours(0,0,0,0)

        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(endOfWeek.getDate() + 6)
        endOfWeek.setHours(23,59,59,999)

        setDateRange({ from: startOfWeek, to: endOfWeek })
      } else if (range.from && range.to) {
        const from = new Date(range.from)
        const dayOfWeekFrom = from.getDay()
        const diffToMonday = from.getDate() - dayOfWeekFrom + (dayOfWeekFrom === 0 ? -6 : 1)
        const startOfWeek = new Date(from.setDate(diffToMonday))
        startOfWeek.setHours(0,0,0,0)

        const to = new Date(range.to)
        const dayOfWeekTo = to.getDay()
        const diffToSunday = to.getDate() + (dayOfWeekTo === 0 ? 0 : 7 - dayOfWeekTo)
        const endOfWeek = new Date(to.setDate(diffToSunday))
        endOfWeek.setHours(23,59,59,999)

        setDateRange({ from: startOfWeek, to: endOfWeek })
      }
    } else if (viewMode === 'month') {
      if (range.from && !range.to) {
        const from = new Date(range.from.getFullYear(), range.from.getMonth(), 1)
        from.setHours(0,0,0,0)
        const to = new Date(range.from.getFullYear(), range.from.getMonth() + 1, 0)
        to.setHours(23,59,59,999)
        setDateRange({ from, to })
      } else if (range.from && range.to) {
        const from = new Date(range.from.getFullYear(), range.from.getMonth(), 1)
        from.setHours(0,0,0,0)
        const to = new Date(range.to.getFullYear(), range.to.getMonth() + 1, 0)
        to.setHours(23,59,59,999)
        setDateRange({ from, to })
      }
    }
  }

  const dateRangeLabel = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 'Selecionar período'

    if (viewMode === 'day') {
      return `${dateRange.from.toLocaleDateString('pt-BR')} até ${dateRange.to.toLocaleDateString('pt-BR')}`
    } else if (viewMode === 'week') {
      const getWeekInfo = (date: Date) => {
        const oneJan = new Date(date.getFullYear(), 0, 1)
        const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000))
        const weekNum = Math.ceil((date.getDay() + 1 + numberOfDays) / 7)
        return `Sem. ${weekNum}/${date.getFullYear()}`
      }
      return `${getWeekInfo(dateRange.from)} até ${getWeekInfo(dateRange.to)}`
    } else {
      const getMonthInfo = (date: Date) => {
        return `${MONTHS_FULL[date.getMonth()]}/${date.getFullYear()}`
      }
      return `${getMonthInfo(dateRange.from)} até ${getMonthInfo(dateRange.to)}`
    }
  }, [dateRange, viewMode])

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
        <div className="flex bg-muted p-0.5 rounded-lg border border-border/50 mr-auto sm:mr-0">
          {(['day', 'week', 'month'] as const).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "h-7 text-[10px] font-black uppercase tracking-wider px-3",
                viewMode === mode && "shadow-sm bg-background text-primary"
              )}
              onClick={() => setViewMode(mode)}
            >
              {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
            </Button>
          ))}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8 text-xs font-bold bg-background gap-1.5 min-w-[200px]">
              <CalendarDays className="h-3.5 w-3.5" />
              {dateRangeLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            {viewMode === 'day' ? (
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateSelect}
                numberOfMonths={2}
              />
            ) : viewMode === 'week' ? (
              <WeekPicker value={dateRange} onChange={setDateRange} />
            ) : (
              <MonthPicker value={dateRange} onChange={setDateRange} />
            )}
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
        className="w-full overflow-x-auto border border-border/50 rounded-xl bg-background pb-2 scrollbar-thin scrollbar-thumb-primary/20 print:overflow-visible print:border-none relative cursor-grab active:cursor-grabbing"
      >
        <div 
          ref={gridRef}
          className="min-w-max grid relative select-none" 
          style={{ 
            gridTemplateColumns: `220px repeat(${columns.length}, ${colWidth}px)` 
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
              const startX = 220 + (pred.endCol * colWidth)
              const startY = 64 + (predIdx * 25) + 12.5

              // Calculate end coordinates (left side of successor bar)
              const endX = 220 + ((succ.startCol - 1) * colWidth)
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
          {groupSpans.map((span) => (
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
          
          {columns.map((col, i) => {
            return (
              <div 
                key={col.key} 
                className={cn(
                  "border-b border-border/30 h-8 flex flex-col items-center justify-center text-[8px] font-bold overflow-hidden",
                  col.isFirstOfGroup && "border-l-2 border-l-primary/30",
                  !col.isFirstOfGroup && "border-l border-l-border/30",
                  col.isWeekend ? "bg-muted/30 text-muted-foreground/50 print:bg-gray-100" : "bg-muted/10 text-muted-foreground print:bg-white"
                )}
              >
                {viewMode === 'day' ? (
                  <span>{col.label}</span>
                ) : viewMode === 'week' ? (
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-[7px] text-muted-foreground">{col.label}</span>
                    <span className="text-[8px]">{col.sublabel}</span>
                  </div>
                ) : (
                  <span className="text-[8px] truncate px-0.5">{col.sublabel}</span>
                )}
              </div>
            )
          })}

          {/* Background Vertical Lines (Optimized) */}
          {columns.map((col, i) => {
            return (
              <div 
                key={`bg-${col.key}`} 
                className={cn(
                  "pointer-events-none z-0",
                  col.isFirstOfGroup && "border-l-2 border-l-primary/30",
                  !col.isFirstOfGroup && "border-l border-l-border/10",
                  col.isWeekend && "bg-muted/10 print:hidden"
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
                  style={{ gridColumn: `2 / span ${columns.length}`, gridRow: rowIdx }}
                >
                  {task.startCol <= columns.length && task.endCol >= 1 && (() => {
                    const getBarColorClass = (progress: number) => {
                      if (progress === 100) return 'bg-[#006838]'          // verde — concluído
                      if (progress > 0 && progress < 100) return 'bg-[#F9A825]'   // amarelo — em progresso
                      return 'bg-[#94a3b8]'                                 // cinza — a fazer / revisão
                    }
                    return (
                      <div 
                        className={cn(
                          "absolute inset-y-0.5 z-10 rounded-sm",
                          getBarColorClass(task.progress)
                        )}
                        style={{
                          left: `${(Math.max(1, task.startCol) - 1) * colWidth}px`,
                          width: `${(Math.min(columns.length, task.endCol) - Math.max(1, task.startCol) + 1) * colWidth}px`
                        }}
                        title={`${task.title} - ${statusInfo.name} (${Math.round(task.progress)}%)`}
                      >
                        {task.duration * colWidth >= 28 && (
                          <span className="absolute left-1 top-0 bottom-0 flex items-center text-[9px] font-black text-white whitespace-nowrap drop-shadow-md pointer-events-none print:text-white">
                            {Math.round(task.progress)}%
                          </span>
                        )}
                      </div>
                    )
                  })()}
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
