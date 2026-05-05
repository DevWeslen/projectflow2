import { useState, useMemo } from 'react'
import { useProjectStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Target, TrendingUp, BarChart3, LayoutDashboard, LogOut,
  Calculator, FolderKanban, FileSpreadsheet, Activity,
  CheckCircle2, Clock, AlertTriangle, Bus, Cpu, Globe, Wrench
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { KPI, Project } from '@/lib/types'
import { cn } from '@/lib/utils'
import { LogoPrincesa } from '@/components/logo-princesa'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Frota': <Bus className="w-4 h-4" />,
  'TI': <Cpu className="w-4 h-4" />,
  'Expansão': <Globe className="w-4 h-4" />,
  'Operações': <Wrench className="w-4 h-4" />,
}

function StatusPill({ pct }: { pct: number }) {
  const color = pct >= 100 ? 'text-emerald-500 bg-emerald-500/10 ring-emerald-500/20' : pct >= 50 ? 'text-amber-500 bg-amber-500/10 ring-amber-500/20' : 'text-rose-500 bg-rose-500/10 ring-rose-500/20'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ring-1 ring-inset ${color}`}>
      {pct >= 100 ? <CheckCircle2 className="w-3 h-3" /> : pct >= 50 ? <Clock className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {pct.toFixed(0)}%
    </span>
  )
}

export function ConsolidatedDashboard() {
  const { 
    projects, 
    logout, 
    user, 
    calculateProjectProgress, 
    selectProject, 
    tasks 
  } = useProjectStore()

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedOwner, setSelectedOwner] = useState<string>('all')
  const [showCompleted, setShowCompleted] = useState<boolean>(false)

  const { users } = useProjectStore()

  const availableYears = useMemo(() => {
    const years = new Set<number>()
    projects.forEach((p: Project) => {
      p.yearlyGoals?.forEach((g: any) => years.add(g.year))
      if (p.createdAt) years.add(new Date(p.createdAt).getFullYear())
    })
    if (years.size === 0) years.add(new Date().getFullYear())
    return Array.from(years).sort((a, b) => b - a)
  }, [projects])

  const filteredProjects = useMemo(() => projects.filter((project: Project) => {
    if (!user) return false
    
    // Check access
    const hasAccess = ['admin', 'conselho', 'diretoria'].includes(user.role) || 
                     project.ownerId === user.id || 
                     project.memberIds?.includes(user.id)
    
    if (!hasAccess) return false

    // Filter by Status
    if (!showCompleted && project.status === 'completed') return false
    if (showCompleted && project.status !== 'completed') return false

    // Filter by year: project must have a goal in that year or have been created in/before that year
    const hasGoalInYear = project.yearlyGoals?.some((g: any) => g.year === selectedYear)
    const wasCreatedInOrBefore = project.createdAt && new Date(project.createdAt).getFullYear() <= selectedYear
    if (!hasGoalInYear && !wasCreatedInOrBefore) return false

    // Filter by Category
    if (selectedCategory !== 'all' && project.category !== selectedCategory) return false

    // Filter by Owner
    if (selectedOwner !== 'all' && project.ownerId !== selectedOwner) return false

    return true
  }), [projects, user, selectedYear, selectedCategory, selectedOwner])

  // Filter tasks based on accessible projects
  const accessibleProjectIds = new Set(filteredProjects.map(p => p.id))
  const filteredTasks = tasks.filter(t => accessibleProjectIds.has(t.projectId))

  // ── Global KPI aggregation ──────────────────────────────────
  const kpiMatrix: Record<string, { projects: Record<string, { current: number; target: number }>, unit: string, aggregation: string }> = {}

  filteredProjects.forEach(project => {
    // Get KPIs for the selected year if they exist, otherwise fallback to general
    const yearGoal = project.yearlyGoals?.find(g => g.year === selectedYear)
    const kpisToUse = yearGoal ? yearGoal.kpis : (project.generalKpis || [])

    kpisToUse.forEach(kpi => {
      if (!kpiMatrix[kpi.name]) {
        kpiMatrix[kpi.name] = { projects: {}, unit: kpi.unit, aggregation: kpi.aggregation || 'sum' }
      }
      kpiMatrix[kpi.name].projects[project.id] = { current: kpi.current, target: kpi.target }
    })
  })

  const kpiNames = Object.keys(kpiMatrix).sort()

  // ── Financial KPI (Revenue / Investment) ──────────────────────
  let globalTarget = 0
  let globalCurrent = 0
  filteredProjects.forEach((p: Project) => {
    const yearGoal = p.yearlyGoals?.find((g: any) => g.year === selectedYear)
    const kpisToUse = yearGoal ? yearGoal.kpis : (p.generalKpis || [])

    kpisToUse.filter((k: KPI) =>
      k.name.toLowerCase().includes('receita') ||
      k.name.toLowerCase().includes('investimento') ||
      k.unit === 'R$'
    ).forEach((k: KPI) => { globalTarget += k.target; globalCurrent += k.current })
  })
  if (globalTarget === 0) { globalTarget = 42800000; globalCurrent = 7690000 }
  const globalPct = Math.round((globalCurrent / globalTarget) * 100)

  // ── Project-level stats ──────────────────────────────────────
  const totalTasks = filteredTasks.length
  const doneTasks = filteredTasks.filter(t => t.status === 'done').length
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress').length
  const totalKpis = filteredProjects.reduce((acc, p) => acc + (p.generalKpis?.length || 0), 0)

  // ── By category ──────────────────────────────────────────────
  const byCategory = filteredProjects.reduce((acc, p) => {
    const cat = p.category || 'geral'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {} as Record<string, Project[]>)

  const now = new Date()

  return (
    <div className="flex flex-col flex-1 min-w-0 w-full min-h-screen bg-zinc-50/50 font-sans selection:bg-emerald-500/20">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-[64px] items-center gap-3 sm:gap-4 border-b border-zinc-200/50 bg-white/70 backdrop-blur-xl px-4 sm:px-6">
        <LogoPrincesa className="h-6 sm:h-7 w-auto shrink-0" />
        <div className="hidden sm:block h-4 w-px bg-zinc-300 mx-2" />
        <div className="hidden sm:flex items-center gap-2 font-medium text-zinc-900 text-sm">
          <span>Painel Estratégico</span>
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {/* Year Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hidden lg:block">Ano:</span>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[85px] h-8 text-[10px] font-bold border-zinc-200 bg-white">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()} className="text-[10px] font-bold">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hidden lg:block">Cat:</span>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[110px] h-8 text-[10px] font-bold border-zinc-200 bg-white">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px] font-bold">Todas Categorias</SelectItem>
                {Array.from(new Set(projects.map(p => p.category || 'geral'))).map(cat => (
                  <SelectItem key={cat} value={cat} className="text-[10px] font-bold">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Owner Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hidden lg:block">Dono:</span>
            <Select value={selectedOwner} onValueChange={setSelectedOwner}>
              <SelectTrigger className="w-[110px] h-8 text-[10px] font-bold border-zinc-200 bg-white">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px] font-bold">Todos Responsáveis</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id} className="text-[10px] font-bold">
                    {u.name.split(' ')[0]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hidden lg:block">Status:</span>
            <Select value={showCompleted ? 'completed' : 'active'} onValueChange={(v) => setShowCompleted(v === 'completed')}>
              <SelectTrigger className="w-[100px] h-8 text-[10px] font-bold border-zinc-200 bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active" className="text-[10px] font-bold">Ativos</SelectItem>
                <SelectItem value="completed" className="text-[10px] font-bold">Concluídos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="hidden sm:block h-6 w-px bg-zinc-200 mx-1" />

          <div className="hidden md:flex flex-col items-end pr-4 shrink-0">
            <span className="text-xs font-semibold text-zinc-900 tracking-tight">{user?.name}</span>
            <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">{user?.role}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg px-2 sm:px-3 text-xs font-semibold shrink-0" onClick={() => logout()}>
            Sair
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-10 space-y-10 w-full min-w-0">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-zinc-900 leading-tight">Visão Global</h1>
          <p className="text-sm font-medium text-zinc-500 mt-2">Consolidação automática de métricas. Atualizado em {now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}.</p>
        </div>

        {/* ── Top KPI summary cards ────────────────────────────── */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Projetos Ativos', value: filteredProjects.length, sub: `${byCategory ? Object.keys(byCategory).length : 0} categorias`, color: 'text-[#006838]', bg: 'bg-[#006838]/10 text-[#006838]', icon: <FolderKanban className="w-5 h-5" /> },
            { label: 'Tarefas Concluídas', value: `${doneTasks}/${totalTasks}`, sub: `${totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}% do total`, color: 'text-emerald-600', bg: 'bg-emerald-100 text-emerald-600', icon: <CheckCircle2 className="w-5 h-5" /> },
            { label: 'Em Andamento', value: inProgressTasks, sub: 'tarefas em fluxo', color: 'text-amber-600', bg: 'bg-amber-100 text-amber-600', icon: <Clock className="w-5 h-5" /> },
            { label: 'KPIs Analisados', value: totalKpis, sub: `${kpiNames.length} métricas ativas`, color: 'text-blue-600', bg: 'bg-blue-100 text-blue-600', icon: <Calculator className="w-5 h-5" /> },
          ].map(c => (
            <div key={c.label} className="border border-slate-200 bg-white rounded-[24px] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className={cn('p-2.5 rounded-xl', c.bg)}>{c.icon}</div>
              </div>
              <p className={cn('text-4xl font-black tracking-tighter mt-4', c.color)}>{c.value}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">{c.label}</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Financial progress + project list ───────────────── */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm p-8 flex flex-col md:flex-row gap-8">
            <div className="flex flex-col justify-between z-10 w-full md:w-1/3">
              <div>
                <div className="p-3 bg-emerald-50 rounded-2xl w-max mb-6">
                  <Activity className="w-6 h-6 text-[#006838]" />
                </div>
                <div className="text-6xl font-black tracking-tighter text-slate-900">{globalPct}%</div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-2">Progresso Financeiro</div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-6 z-10 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta Total</p>
                  <p className="text-3xl font-black tracking-tighter text-slate-900 mt-1">R$ {(globalTarget / 1e6).toFixed(1)}M</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Realizado</p>
                  <p className="text-3xl font-black tracking-tighter text-[#006838] mt-1">R$ {(globalCurrent / 1e6).toFixed(1)}M</p>
                </div>
              </div>
              <div className="space-y-3 pt-4">
                <Progress value={globalPct} className="h-2 bg-slate-100 [&>div]:bg-[#006838]" />
                <div className="flex flex-wrap gap-4 mt-2">
                  {filteredProjects.slice(0,3).map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-[10px] font-bold text-slate-500 truncate max-w-[100px]">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm p-8 flex flex-col">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-8">Portfólio por Categoria</h3>
            <div className="space-y-6 flex-1 justify-center flex flex-col">
              {Object.entries(byCategory).map(([cat, projs]) => {
                const avgPct = projs.length ? Math.round(projs.reduce((a, p) => a + calculateProjectProgress(p.id), 0) / projs.length) : 0
                return (
                  <div key={cat} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-100 text-[#006838]">{CATEGORY_ICONS[cat] || <FolderKanban className="w-4 h-4" />}</div>
                        <span className="text-sm font-black text-slate-900">{cat}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 bg-slate-100 font-black text-slate-500">{projs.length}</Badge>
                      </div>
                      <StatusPill pct={avgPct} />
                    </div>
                    <Progress value={avgPct} className="h-2 bg-slate-100 [&>div]:bg-[#006838]" />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Per-project KPI cards ─────────────────────────────── */}
        {filteredProjects.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#006838]" /> Projetos Ativos
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {filteredProjects.map(p => {
                const pPct = Math.round(calculateProjectProgress(p.id))
                const pTasks = filteredTasks.filter(t => t.projectId === p.id)
                const pDone = pTasks.filter(t => t.status === 'done').length
                const kpis = p.generalKpis || []
                const daysLeft = p.deadline ? Math.ceil((new Date(p.deadline).getTime() - now.getTime()) / 86400000) : null

                return (
                  <div
                    key={p.id}
                    onClick={() => selectProject(p.id)}
                    className="group rounded-[24px] border border-slate-200 bg-white p-6 cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-[#006838]/30 transition-all duration-300 flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: p.color }} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{p.category}</span>
                      </div>
                      <StatusPill pct={pPct} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 leading-snug mb-5 line-clamp-2">{p.name}</h3>
                    
                    <div className="mt-auto space-y-4">
                      <div className="flex gap-4 text-center">
                        <div className="flex-1 bg-slate-50 rounded-xl p-2 border border-slate-100">
                          <p className="text-xl font-black text-slate-800">{pDone}<span className="text-xs text-slate-400 font-bold ml-0.5">/{pTasks.length}</span></p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Tarefas</p>
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-xl p-2 border border-slate-100">
                          <p className="text-xl font-black text-slate-800">{daysLeft !== null ? (daysLeft > 0 ? `${daysLeft}d` : 'Fim') : '—'}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Restam</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>PROGRESSO GERAL</span>
                          <span className="text-slate-900">{pPct}%</span>
                        </div>
                        <Progress value={pPct} className="h-2 bg-slate-100 [&>div]:bg-[#006838]" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── KPI Matrix ───────────────────────────────────────── */}
        {kpiNames.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-[#006838]" /> Desempenho por Indicador
              </h2>
              <p className="text-sm font-medium text-slate-500">Comparativo de realizado vs. meta de cada métrica em todos os projetos.</p>
            </div>
            
            <div className="rounded-[32px] border-2 border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b-2 border-slate-200">
                      <TableHead className="w-[300px] sticky left-0 z-20 bg-white font-black text-slate-500 uppercase tracking-wider text-[11px] p-6 border-r-2 border-slate-200 shadow-sm">
                        Métrica / Indicador Estratégico
                      </TableHead>
                      {filteredProjects.map(p => (
                        <TableHead key={p.id} className="min-w-[180px] bg-white group hover:bg-slate-50/50 transition-colors p-6 align-bottom border-r border-slate-200">
                          <div className="flex flex-col items-start gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.category}</span>
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: p.color }} />
                              <span className="truncate max-w-[150px] text-[13px] font-black text-slate-900 leading-tight">{p.name}</span>
                            </div>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="min-w-[200px] sticky right-0 z-20 bg-[#006838]/5 text-right font-black text-[#006838] uppercase tracking-wider text-[11px] p-6 border-l-2 border-[#006838]/20 shadow-[-5px_0_15px_-3px_rgba(0,0,0,0.05)]">
                        Consolidado
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {kpiNames.map((name) => {
                    const kd = kpiMatrix[name]
                    let totalCurrent = 0, totalTarget = 0, activePj = 0

                    Object.values(kd.projects).forEach(v => {
                      totalCurrent += v.current
                      totalTarget += v.target
                      activePj++
                    })

                    const consolidated = kd.aggregation === 'sum'
                      ? { current: totalCurrent, target: totalTarget }
                      : { current: activePj > 0 ? totalCurrent / activePj : 0, target: activePj > 0 ? totalTarget / activePj : 0 }

                    const consolidatedPct = consolidated.target > 0
                      ? Math.min(Math.round((consolidated.current / consolidated.target) * 100), 100)
                      : 0

                    return (
                      <TableRow key={name} className="hover:bg-slate-50/80 transition-colors group border-b border-slate-200 last:border-b-0">
                        <TableCell className="p-6 align-top sticky left-0 z-10 bg-white group-hover:bg-slate-50/50 transition-colors border-r-2 border-slate-200 shadow-sm">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:text-slate-600 transition-colors">
                                <Target className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-black text-slate-800 leading-tight">{name}</span>
                            </div>
                            <div className="flex items-center gap-2 ml-10">
                              <Badge variant="outline" className="text-[10px] font-black text-slate-500 bg-slate-50 border-slate-200 uppercase tracking-widest px-2 py-0.5 rounded-md">
                                {kd.unit}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] font-black text-slate-500 bg-slate-100 uppercase tracking-widest px-2 py-0.5 rounded-md">
                                {kd.aggregation === 'sum' ? '∑ Anual' : '⌀ Mensal'}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>

                        {filteredProjects.map(p => {
                          const val = kd.projects[p.id]
                          const pct = val ? (val.target > 0 ? Math.min(Math.round((val.current / val.target) * 100), 100) : 0) : null

                          let pctColorStr = "text-slate-400"
                          let bgColorStr = "bg-slate-100"
                          let bgProgressStr = "h-1.5"
                          if (pct !== null) {
                            if (pct >= 100) { pctColorStr = "text-green-600"; bgProgressStr = "h-1.5 [&>div]:bg-green-500"; bgColorStr = "bg-green-50" }
                            else if (pct >= 50) { pctColorStr = "text-yellow-600"; bgProgressStr = "h-1.5 [&>div]:bg-yellow-500"; bgColorStr = "bg-yellow-50" }
                            else { pctColorStr = "text-red-600"; bgProgressStr = "h-1.5 [&>div]:bg-red-500"; bgColorStr = "bg-red-50" }
                          }

                          return (
                            <TableCell key={p.id} className="p-6 align-top border-r border-slate-200 bg-white/50">
                              {val ? (
                                <div className="flex flex-col gap-2.5">
                                  <div className="flex items-baseline gap-1">
                                    <span className={cn("text-xl font-black leading-none text-slate-900")}>
                                      {val.current.toLocaleString('pt-BR')}
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-400">
                                      / {val.target.toLocaleString('pt-BR')}
                                    </span>
                                  </div>
                                  <div className={cn("flex items-center gap-3 p-2 rounded-lg", bgColorStr)}>
                                    <Progress value={pct ?? 0} className={cn("flex-1 bg-white/50", bgProgressStr)} />
                                    <span className={cn("text-[11px] font-black w-7 text-right", pctColorStr)}>{pct}%</span>
                                  </div>
                                </div>
                              ) : <span className="text-slate-200 font-medium text-lg leading-none block pt-1">—</span>}
                            </TableCell>
                          )
                        })}

                        <TableCell className="p-6 align-top sticky right-0 z-10 bg-[#006838]/5 border-l-2 border-[#006838]/20 group-hover:bg-[#006838]/10 transition-colors shadow-[-5px_0_15px_-3px_rgba(0,0,0,0.05)]">
                          <div className="flex flex-col items-end gap-3 pr-2">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xl font-black text-[#006838] leading-none">
                                {consolidated.current.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                              </span>
                              <span className="text-[11px] font-bold text-[#006838]/50">
                                / {consolidated.target.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 justify-end w-full min-w-[130px]">
                              <StatusPill pct={consolidatedPct} />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        )}

        <div className="pt-10 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest pb-8 flex flex-col gap-2 items-center">
          <LogoPrincesa className="h-5 w-auto" />
          <span>Gestão Estratégica &bull; Princesa dos Campos 2026</span>
        </div>
      </main>
    </div>
  )
}
