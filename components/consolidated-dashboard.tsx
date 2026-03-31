'use client'

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

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Frota': <Bus className="w-4 h-4" />,
  'TI': <Cpu className="w-4 h-4" />,
  'Expansão': <Globe className="w-4 h-4" />,
  'Operações': <Wrench className="w-4 h-4" />,
}

function StatusPill({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] font-black ${color}`}>
      {pct >= 80 ? <CheckCircle2 className="w-2.5 h-2.5" /> : pct >= 50 ? <Clock className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
      {pct.toFixed(0)}%
    </span>
  )
}

export function ConsolidatedDashboard() {
  const { projects, logout, user, calculateProjectProgress, selectProject, tasks } = useProjectStore()

  // ── Global KPI aggregation ──────────────────────────────────
  const kpiMatrix: Record<string, { projects: Record<string, { current: number; target: number }>, unit: string, aggregation: string }> = {}

  projects.forEach(project => {
    ;(project.generalKpis || []).forEach(kpi => {
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
  projects.forEach(p => {
    ;(p.generalKpis || []).filter(k =>
      k.name.toLowerCase().includes('receita') ||
      k.name.toLowerCase().includes('investimento') ||
      k.unit === 'R$'
    ).forEach(k => { globalTarget += k.target; globalCurrent += k.current })
  })
  if (globalTarget === 0) { globalTarget = 42800000; globalCurrent = 7690000 }
  const globalPct = Math.round((globalCurrent / globalTarget) * 100)

  // ── Project-level stats ──────────────────────────────────────
  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length
  const totalKpis = projects.reduce((acc, p) => acc + (p.generalKpis?.length || 0), 0)

  // ── By category ──────────────────────────────────────────────
  const byCategory = projects.reduce((acc, p) => {
    const cat = p.category || 'geral'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {} as Record<string, Project[]>)

  const now = new Date()

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-6 shadow-sm">
        <LogoPrincesa className="h-8 w-auto" />
        <div className="h-6 w-px bg-slate-200 mx-2" />
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <BarChart3 className="w-5 h-5 text-[#006838]" />
          <span>Painel Estratégico Consolidado</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex flex-col items-end pr-4 border-r">
            <span className="text-sm font-bold text-slate-900">{user?.name}</span>
            <span className="text-[10px] text-slate-500 uppercase font-black">{user?.role}</span>
          </div>
          <Button variant="ghost" size="sm" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => logout()}>
            <LogOut className="w-4 h-4" /> Sair
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Visão Geral da Organização</h1>
          <p className="text-slate-500 font-medium">Consolidação automática de KPIs e metas estratégicas. Atualizado: {now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* ── Top KPI summary cards ────────────────────────────── */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Projetos Ativos', value: projects.length, sub: `${byCategory ? Object.keys(byCategory).length : 0} categorias`, color: 'text-[#006838]', icon: <FolderKanban className="w-5 h-5" /> },
            { label: 'Tarefas Concluídas', value: `${doneTasks}/${totalTasks}`, sub: `${totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}% do total`, color: 'text-green-600', icon: <CheckCircle2 className="w-5 h-5" /> },
            { label: 'Em Andamento', value: inProgressTasks, sub: 'tarefas abertas agora', color: 'text-yellow-600', icon: <Clock className="w-5 h-5" /> },
            { label: 'KPIs Rastreados', value: totalKpis, sub: `${kpiNames.length} indicadores únicos`, color: 'text-purple-600', icon: <Calculator className="w-5 h-5" /> },
          ].map(c => (
            <Card key={c.label} className="border-none shadow-md bg-white">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className={cn('p-2 rounded-xl bg-slate-100', c.color)}>{c.icon}</div>
                </div>
                <p className={cn('text-2xl font-black', c.color)}>{c.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{c.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{c.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Financial progress + project list ───────────────── */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 border-none shadow-md overflow-hidden bg-white">
            <div className="flex flex-col sm:flex-row">
              <div className="p-8 bg-[#006838] text-white sm:w-1/3 flex flex-col justify-center items-center text-center">
                <Target className="w-10 h-10 mb-4 opacity-50" />
                <div className="text-5xl font-black mb-1">{globalPct}%</div>
                <div className="text-xs font-bold uppercase tracking-widest opacity-80">Atingimento Financeiro</div>
              </div>
              <div className="p-6 flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meta Total (R$)</p>
                    <p className="text-xl font-black text-slate-900">R$ {(globalTarget / 1e6).toFixed(1)}M</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Realizado (R$)</p>
                    <p className="text-xl font-black text-[#006838]">R$ {(globalCurrent / 1e6).toFixed(1)}M</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>PROGRESSO FINANCEIRO CONSOLIDADO</span>
                    <span>{globalPct}%</span>
                  </div>
                  <Progress value={globalPct} className="h-2.5" />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                  {projects.slice(0, 3).map(p => {
                    const pct = Math.round(calculateProjectProgress(p.id))
                    return (
                      <div key={p.id} className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-[10px] font-bold text-slate-500 truncate">{p.name.split(' ').slice(0, 2).join(' ')}</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                        <span className="text-[10px] text-slate-400">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </Card>

          <Card className="shadow-md border-none bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#006838]" />
                Portfólio por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(byCategory).map(([cat, projs]) => {
                const avgPct = projs.length
                  ? Math.round(projs.reduce((a, p) => a + calculateProjectProgress(p.id), 0) / projs.length)
                  : 0
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-slate-400">{CATEGORY_ICONS[cat] || <FolderKanban className="w-4 h-4" />}</div>
                        <span className="text-sm font-bold text-slate-700">{cat}</span>
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{projs.length}</Badge>
                      </div>
                      <StatusPill pct={avgPct} />
                    </div>
                    <Progress value={avgPct} className="h-1.5" />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* ── Per-project KPI cards ─────────────────────────────── */}
        {projects.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#006838]" /> Desempenho por Projeto
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {projects.map(p => {
                const pPct = Math.round(calculateProjectProgress(p.id))
                const pTasks = tasks.filter(t => t.projectId === p.id)
                const pDone = pTasks.filter(t => t.status === 'done').length
                const kpis = p.generalKpis || []
                const daysLeft = p.deadline ? Math.ceil((new Date(p.deadline).getTime() - now.getTime()) / 86400000) : null

                return (
                  <Card
                    key={p.id}
                    className="border-none shadow-md bg-white hover:shadow-lg cursor-pointer transition-all"
                    onClick={() => selectProject(p.id)}
                  >
                    <CardHeader className="pb-2 pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                          <p className="text-xs font-black text-slate-500 uppercase tracking-wider">{p.category}</p>
                        </div>
                        <StatusPill pct={pPct} />
                      </div>
                      <p className="text-sm font-black text-slate-900 leading-snug mt-1">{p.name}</p>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-4">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>PROGRESSO GERAL</span>
                          <span>{pPct}%</span>
                        </div>
                        <Progress value={pPct} className="h-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-slate-50 rounded-lg p-2">
                          <p className="text-sm font-black text-slate-700">{pDone}/{pTasks.length}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Tarefas</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2">
                          <p className="text-sm font-black text-slate-700">{daysLeft !== null ? (daysLeft > 0 ? `${daysLeft}d` : 'Encerrado') : '—'}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Restam</p>
                        </div>
                      </div>
                      {kpis.length > 0 && (
                        <div className="space-y-1.5 pt-1 border-t">
                          {kpis.slice(0, 2).map(k => {
                            const kPct = k.target > 0 ? Math.min(Math.round((k.current / k.target) * 100), 100) : 0
                            return (
                              <div key={k.id} className="flex items-center gap-2">
                                <p className="text-[10px] text-slate-500 font-bold truncate flex-1">{k.name}</p>
                                <Progress value={kPct} className="h-1 w-16" />
                                <p className="text-[10px] font-black text-slate-600 w-7 text-right">{kPct}%</p>
                              </div>
                            )
                          })}
                          {kpis.length > 2 && (
                            <p className="text-[9px] text-slate-400 text-center">+{kpis.length - 2} mais KPIs</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* ── KPI Matrix ───────────────────────────────────────── */}
        {kpiNames.length > 0 && (
          <Card className="shadow-lg border-none overflow-hidden bg-white">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#006838]" />
                Matriz de Desempenho por Indicador
              </CardTitle>
              <CardDescription>Comparativo de realizado vs. meta de cada KPI por projeto. Clique em um projeto para acessar o detalhe.</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-bold text-slate-900 w-[200px] sticky left-0 z-20 bg-slate-50">Indicador</TableHead>
                    <TableHead className="text-center font-bold text-slate-500 w-[60px]">Und.</TableHead>
                    <TableHead className="text-center font-bold text-slate-500 w-[70px]">Tipo</TableHead>
                    {projects.map(p => (
                      <TableHead key={p.id} className="text-center font-bold text-slate-900 min-w-[160px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="truncate max-w-[130px] text-xs">{p.name.split(' ').slice(0, 3).join(' ')}</span>
                          <div className="h-1 w-10 rounded-full" style={{ backgroundColor: p.color }} />
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-right font-black text-[#006838] sticky right-0 z-20 bg-slate-50 border-l min-w-[120px]">TOTAL</TableHead>
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
                      <TableRow key={name} className="hover:bg-green-50/30 transition-colors">
                        <TableCell className="font-bold text-slate-700 sticky left-0 z-10 bg-white border-r">{name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-medium text-slate-500 text-[9px]">{kd.unit}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-[9px] font-bold">
                            {kd.aggregation === 'sum' ? '∑ Soma' : '⌀ Média'}
                          </Badge>
                        </TableCell>
                        {projects.map(p => {
                          const val = kd.projects[p.id]
                          const pct = val ? (val.target > 0 ? Math.min(Math.round((val.current / val.target) * 100), 100) : 0) : null
                          return (
                            <TableCell key={p.id} className="text-center">
                              {val ? (
                                <div className="space-y-1">
                                  <div className="text-xs font-bold text-slate-700">
                                    {val.current.toLocaleString('pt-BR')} / {val.target.toLocaleString('pt-BR')}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Progress value={pct ?? 0} className="h-1.5 flex-1" />
                                    <span className="text-[9px] font-black text-slate-500 w-7 text-right">{pct}%</span>
                                  </div>
                                </div>
                              ) : <span className="text-slate-300">—</span>}
                            </TableCell>
                          )
                        })}
                        <TableCell className="sticky right-0 z-10 bg-green-50/50 border-l">
                          <div className="text-right space-y-1">
                            <p className="text-sm font-black text-slate-900">
                              {consolidated.current.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-[9px] text-slate-400">/ {consolidated.target.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                            <StatusPill pct={consolidatedPct} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        <div className="pt-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest pb-8">
          Desenvolvido por Weslen Rian e William Kutz &bull; Gestão Estratégica Princesa dos Campos 2026
        </div>
      </main>
    </div>
  )
}
