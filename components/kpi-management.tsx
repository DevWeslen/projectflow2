'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Target, TrendingUp, Plus, Edit2, Check, X, Calendar, Trash2, RefreshCw, Save, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MonthlyKpiDialog, EditingMonthly } from './monthly-kpi-dialog'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { KPI } from '@/lib/types'

interface KpiManagementProps {
  projectId: string
}

const generateId = () => Math.random().toString(36).substring(2, 15)

interface EditingKpi {
  id: string
  name: string
  target: string
  unit: string
  aggregation: 'sum' | 'average'
  distribution: 'fraction' | 'global'
}

export function KpiManagement({ projectId }: KpiManagementProps) {
  const { projects, updateProject } = useProjectStore()
  const project = projects.find(p => p.id === projectId)

  // ── Yearly cell editing ────────────────────────────────────
  const [editingYearIndex, setEditingYearIndex] = useState<number | null>(null)
  const [editingKpiId, setEditingKpiId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [editType, setEditType] = useState<'current' | 'target'>('current')

  // ── Monthly KPI editing ────────────────────────────────────
  const [editingMonthly, setEditingMonthly] = useState<EditingMonthly | null>(null)

  // ── General KPI editing ────────────────────────────────────
  const [editingGeneral, setEditingGeneral] = useState<EditingKpi | null>(null)
  
  // ── Year Deletion ──────────────────────────────────────────
  const [deleteYearConfirm, setDeleteYearConfirm] = useState<string | null>(null)

  // ── New KPI form ───────────────────────────────────────────
  const [showKpiForm, setShowKpiForm] = useState(false)
  const [newKpiName, setNewKpiName] = useState('')
  const [newKpiTarget, setNewKpiTarget] = useState('')
  const [newKpiUnit, setNewKpiUnit] = useState('')
  const [newKpiAggregation, setNewKpiAggregation] = useState<'sum' | 'average'>('sum')
  const [newKpiDistribution, setNewKpiDistribution] = useState<'fraction' | 'global'>('fraction')

  if (!project) return null

  const kpis = project.generalKpis || []
  const yearlyGoals = project.yearlyGoals || []
  const numYears = yearlyGoals.length || 1

  const fmtDate = (d: Date | string) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // ── Handlers ───────────────────────────────────────────────
  const handleAddKpi = () => {
    if (!newKpiName.trim() || !newKpiTarget) return
    const totalTarget = Number(newKpiTarget)
    const newKpi: KPI = {
      id: generateId(),
      name: newKpiName.trim(),
      target: totalTarget,
      current: 0,
      unit: newKpiUnit.trim() || '',
      aggregation: newKpiAggregation,
      distribution: newKpiDistribution
    }
    const updatedKpis = [...kpis, newKpi]
    const updatedGoals = yearlyGoals.map(yg => ({
      ...yg,
      kpis: [...yg.kpis.filter(k => k.id !== newKpi.id), {
        ...newKpi,
        current: 0,
        target: newKpiDistribution === 'fraction' ? Math.round((totalTarget / numYears) * 100) / 100 : totalTarget
      }]
    }))
    updateProject(projectId, { generalKpis: updatedKpis, yearlyGoals: updatedGoals })
    setNewKpiName(''); setNewKpiTarget(''); setNewKpiUnit(''); setNewKpiAggregation('sum'); setNewKpiDistribution('fraction')
    setShowKpiForm(false)
  }

  const handleDeleteKpi = (kpiId: string) => {
    updateProject(projectId, {
      generalKpis: kpis.filter(k => k.id !== kpiId),
      yearlyGoals: yearlyGoals.map(yg => ({ ...yg, kpis: yg.kpis.filter(k => k.id !== kpiId) }))
    })
    if (editingGeneral?.id === kpiId) setEditingGeneral(null)
  }

  const handleSaveGeneralKpi = () => {
    if (!editingGeneral) return
    const newTarget = Number(editingGeneral.target)
    const updatedKpis = kpis.map(k => k.id === editingGeneral.id
      ? { ...k, name: editingGeneral.name, target: newTarget, unit: editingGeneral.unit, aggregation: editingGeneral.aggregation, distribution: editingGeneral.distribution }
      : k
    )
    const updatedGoals = yearlyGoals.map(yg => ({
      ...yg,
      kpis: yg.kpis.map(k => k.id === editingGeneral.id
        ? { ...k, name: editingGeneral.name, unit: editingGeneral.unit, aggregation: editingGeneral.aggregation, distribution: editingGeneral.distribution }
        : k
      )
    }))
    updateProject(projectId, { generalKpis: updatedKpis, yearlyGoals: updatedGoals })
    setEditingGeneral(null)
  }

  const handleRedistribute = (kpiId: string) => {
    const baseKpi = kpis.find(k => k.id === kpiId)
    if (!baseKpi) return
    const isFraction = baseKpi.distribution === 'fraction' || (!baseKpi.distribution && baseKpi.aggregation === 'sum')
    const perYear = isFraction
      ? Math.round((baseKpi.target / numYears) * 100) / 100
      : baseKpi.target
    const updatedGoals = yearlyGoals.map(yg => ({
      ...yg,
      kpis: yg.kpis.map(k => k.id === kpiId ? { ...k, target: perYear } : k)
    }))
    updateProject(projectId, { yearlyGoals: updatedGoals })
  }

  const handleUpdateYearlyGoal = (yearIndex: number, kpiId: string, type: 'current' | 'target', value: number) => {
    const updatedGoals = [...yearlyGoals]
    const yearGoal = { ...updatedGoals[yearIndex] }
    const kpisList = [...yearGoal.kpis]

    const kpiIndex = kpisList.findIndex(k => k.id === kpiId)
    if (kpiIndex >= 0) {
      kpisList[kpiIndex] = { ...kpisList[kpiIndex], [type]: value }
    } else {
      const baseKpi = kpis.find(k => k.id === kpiId)
      if (baseKpi) kpisList.push({ ...baseKpi, current: 0, target: 0, [type]: value })
    }
    yearGoal.kpis = kpisList
    updatedGoals[yearIndex] = yearGoal

    const updatedGeneralKpis = kpis.map(k => {
      if (k.id !== kpiId) return k
      let newCurrent = 0, newTarget = 0, validYears = 0
      updatedGoals.forEach(g => {
        const gk = g.kpis.find(x => x.id === kpiId)
        if (gk) { newCurrent += gk.current; newTarget += gk.target; validYears++ }
      })
      if (k.aggregation === 'average' && validYears > 0) {
        return { ...k, current: newCurrent / validYears, target: newTarget / validYears }
      }
      return { ...k, current: newCurrent, target: newTarget }
    })

    updateProject(projectId, { yearlyGoals: updatedGoals, generalKpis: updatedGeneralKpis })
    setEditingYearIndex(null)
    setEditingKpiId(null)
  }

  const handleOpenMonthly = (yIdx: number, baseKpi: KPI, yKpi: KPI) => {
    const defaultMonthly = Array.from({length: 12}).map((_, i) => ({
      monthIndex: i,
      current: 0,
      target: baseKpi.distribution === 'fraction' ? Math.round((yKpi.target / 12) * 100) / 100 : yKpi.target
    }))
    setEditingMonthly({
      yearGoalId: yearlyGoals[yIdx].id,
      kpiId: baseKpi.id,
      kpiName: baseKpi.name,
      unit: baseKpi.unit,
      target: yKpi.target,
      aggregation: baseKpi.aggregation,
      monthly: yKpi.monthly || defaultMonthly
    })
  }

  const handleSaveMonthly = (data: EditingMonthly) => {
    let totalCurrent = 0
    let validMonths = 0
    data.monthly.forEach(m => {
      if (m.current > 0 || data.aggregation === 'sum') {
        totalCurrent += m.current
        validMonths++
      }
    })
    
    let newYearCurrent = data.aggregation === 'sum' 
      ? totalCurrent 
      : (validMonths > 0 ? totalCurrent / validMonths : 0)
    
    newYearCurrent = Math.round(newYearCurrent * 100) / 100

    // Também reconcilia a META (Target) a partir das entradas mensais
    let totalMonthlyTarget = 0
    let validTargetMonths = 0
    data.monthly.forEach(m => {
      totalMonthlyTarget += (m.target || 0)
      if (m.target > 0) validTargetMonths++
    })

    const newYearTarget = data.aggregation === 'sum'
      ? totalMonthlyTarget
      : (validTargetMonths > 0 ? totalMonthlyTarget / validTargetMonths : 0)

    const updatedGoals = yearlyGoals.map(yg => {
      if (yg.id !== data.yearGoalId) return yg
      return {
        ...yg,
        kpis: yg.kpis.map(yKpi => {
          if (yKpi.id !== data.kpiId) return yKpi
          return {
            ...yKpi,
            monthly: data.monthly,
            current: newYearCurrent,
            target: Math.round(newYearTarget * 100) / 100
          }
        })
      }
    })
    
    const updatedGeneralKpis = kpis.map(k => {
      if (k.id !== data.kpiId) return k
      let newCurrent = 0, newTarget = 0, validYears = 0
      updatedGoals.forEach(g => {
        const gk = g.kpis.find(x => x.id === k.id)
        if (gk) { newCurrent += gk.current; newTarget += gk.target; validYears++ }
      })
      if (k.aggregation === 'average' && validYears > 0) {
        return { ...k, current: newCurrent / validYears, target: newTarget / validYears }
      }
      return { ...k, current: newCurrent, target: newTarget }
    })

    updateProject(projectId, { yearlyGoals: updatedGoals, generalKpis: updatedGeneralKpis })
    setEditingMonthly(null)
  }

  const startEditing = (yearIdx: number, kpi: KPI, type: 'current' | 'target') => {
    setEditingYearIndex(yearIdx)
    setEditingKpiId(kpi.id)
    setEditType(type)
    setEditValue(type === 'current' ? kpi.current.toString() : kpi.target.toString())
  }

  const handleAddYear = () => {
    const lastYear = yearlyGoals.length > 0 ? yearlyGoals[yearlyGoals.length - 1].year : new Date().getFullYear() - 1
    const newYear = lastYear + 1
    const newGoals = [...yearlyGoals, {
      id: generateId(),
      year: newYear,
      startDate: new Date(newYear, 0, 1),
      endDate: new Date(newYear, 11, 31),
      kpis: kpis.map(k => {
        const isFraction = k.distribution === 'fraction' || (!k.distribution && k.aggregation === 'sum')
        return {
          ...k, current: 0,
          target: isFraction ? Math.round((k.target / (numYears + 1)) * 100) / 100 : k.target
        }
      })
    }]
    updateProject(projectId, { yearlyGoals: newGoals })
  }

  const handleDeleteYear = (yearId: string) => {
    if (yearlyGoals.length <= 1) {
      alert("O projeto não pode ficar sem detalhamento anual. Pelo menos um ano deve existir.")
      return
    }
    setDeleteYearConfirm(yearId)
  }

  const confirmDeleteYear = (redistribute: boolean) => {
    if (!deleteYearConfirm) return
    const yearId = deleteYearConfirm

    const remainingGoals = yearlyGoals.filter(yg => yg.id !== yearId)
    const newNumYears = remainingGoals.length
    
    // Redistribute fraction targets across remaining years if user chose YES
    const updatedGoals = remainingGoals.map(yg => {
      if (!redistribute) return yg
      
      return {
        ...yg,
        kpis: yg.kpis.map(yKpi => {
          const baseKpi = kpis.find(k => k.id === yKpi.id)
          if (!baseKpi) return yKpi
          const isFraction = baseKpi.distribution === 'fraction' || (!baseKpi.distribution && baseKpi.aggregation === 'sum')
          if (isFraction) {
            return { ...yKpi, target: Math.round((baseKpi.target / newNumYears) * 100) / 100 }
          }
          return yKpi
        })
      }
    })
    
    // Update general KPIs based on the new yearly totals
    const updatedGeneralKpis = kpis.map(k => {
      let newCurrent = 0, newTarget = 0, validYears = 0
      updatedGoals.forEach(g => {
        const gk = g.kpis.find(x => x.id === k.id)
        if (gk) { newCurrent += gk.current; newTarget += gk.target; validYears++ }
      })
      if (k.aggregation === 'average' && validYears > 0) {
        return { ...k, current: newCurrent / validYears, target: newTarget / validYears }
      }
      return { ...k, current: newCurrent, target: newTarget }
    })
    
    updateProject(projectId, { yearlyGoals: updatedGoals, generalKpis: updatedGeneralKpis })
    setDeleteYearConfirm(null)
  }

  const isFractionKpiPresent = kpis.some(k => k.distribution === 'fraction' || (!k.distribution && k.aggregation === 'sum'))

  const yearRange = yearlyGoals.length >= 2
    ? `${yearlyGoals[0].year} – ${yearlyGoals[yearlyGoals.length - 1].year}`
    : yearlyGoals.length === 1 ? `${yearlyGoals[0].year}` : ''

  // Pre-defined vivid card colors
  const cardColors = [
    'from-emerald-500 to-teal-600',
    'from-indigo-500 to-blue-600',
    'from-rose-500 to-orange-600',
    'from-violet-500 to-fuchsia-600',
    'from-sky-500 to-cyan-600',
    'from-amber-500 to-yellow-600'
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Target className="h-6 w-6 text-[#006838]" /> Painel de Metas & Indicadores
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {yearRange ? `Período: ${yearRange} · ${numYears} ano${numYears !== 1 ? 's' : ''}` : 'Gerencie e acompanhe a evolução dos resultados do projeto.'}
          </p>
        </div>
        <Button onClick={() => setShowKpiForm(!showKpiForm)} className="bg-[#006838] hover:bg-[#00522a] text-white shadow-md gap-2 self-start rounded-xl px-6">
          <Plus className="h-4 w-4" /> Adicionar Novo KPI
        </Button>
      </div>

      {/* New KPI Form */}
      {showKpiForm && (
        <Card className="border shadow-lg rounded-xl overflow-hidden bg-white">
          <div className="bg-slate-50 border-b px-6 py-4 flex items-center gap-3">
            <div className="p-2 bg-[#006838]/10 text-[#006838] rounded-lg"><Plus className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-slate-900">Configuração de Novo Indicador</h3>
              <p className="text-xs text-slate-500 font-medium">Defina os parâmetros base. O sistema distribuirá a meta automaticamente.</p>
            </div>
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Nome do Indicador</label>
                <Input placeholder="Ex: Produção Mensal" value={newKpiName} onChange={e => setNewKpiName(e.target.value)} className="h-11 rounded-lg border-slate-200" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Meta Total Global</label>
                <Input type="number" placeholder="Ex: 5000" value={newKpiTarget} onChange={e => setNewKpiTarget(e.target.value)} className="h-11 rounded-lg border-slate-200" />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Unid. Medida (ex: R$/KM, %)</label>
                <Input placeholder="Unidade de medida" value={newKpiUnit} onChange={e => setNewKpiUnit(e.target.value)} className="h-11 rounded-lg border-slate-200" />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Cálculo (Painel Geral)</label>
                <div className="flex gap-2 h-11">
                  {(['sum', 'average'] as const).map(m => (
                    <button key={m} onClick={() => setNewKpiAggregation(m)}
                      className={`flex-1 rounded-lg text-xs font-black transition-all border-2 ${newKpiAggregation === m ? 'bg-[#006838]/10 text-[#006838] border-[#006838]' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      {m === 'sum' ? '∑ Soma' : '⌀ Média'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 col-span-1 md:col-span-4 mt-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Distribuição da Meta (Anos)</label>
                <div className="flex gap-2 h-11">
                  {(['fraction', 'global'] as const).map(d => (
                    <button key={d} onClick={() => setNewKpiDistribution(d)}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg text-xs font-black transition-all border-2 ${newKpiDistribution === d ? 'bg-[#006838] text-white border-[#006838] shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      {d === 'fraction' ? '÷ Fração (Dividir)' : '∞ Global (Repetir)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {newKpiName && newKpiTarget && numYears > 1 && (
              <div className="bg-slate-50 rounded-xl p-4 border flex items-start gap-3 mt-4">
                <div className="bg-blue-100 text-blue-700 p-1.5 rounded-md mt-0.5"><TrendingUp className="w-4 h-4" /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Projeção da Meta</h4>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {newKpiDistribution === 'fraction'
                      ? `Meta total dividida pelos ${numYears} anos de projeto: Aprox. `
                      : `A mesma meta se aplica a todos os ${numYears} anos: Exatamente `}
                    <strong className="text-slate-900 bg-white px-2 py-0.5 rounded border ml-1 shadow-sm">
                      {newKpiDistribution === 'fraction' 
                        ? `${newKpiUnit} ${(Number(newKpiTarget) / numYears).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}` 
                        : `${newKpiUnit} ${Number(newKpiTarget).toLocaleString()}`} por ano
                    </strong>
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowKpiForm(false)} className="rounded-xl font-bold">Cancelar</Button>
              <Button onClick={handleAddKpi} disabled={!newKpiName.trim() || !newKpiTarget} className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold px-8">
                Confirmar Criação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {kpis.length > 0 ? (
        <div className="space-y-10">
          
          {/* VIBRANT CONSOLIDATED CARDS */}
          <div>
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-slate-400" /> Resultados Globais Consolidados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {kpis.map((kpi, idx) => {
                const percent = kpi.target > 0 ? Math.min((kpi.current / kpi.target) * 100, 100) : 0
                const isEditing = editingGeneral?.id === kpi.id
                const bgGradient = cardColors[idx % cardColors.length]
                const isSuccess = percent >= 100
                const isWarning = percent > 0 && percent < 50

                // Render Edit form
                if (isEditing) {
                  return (
                    <Card key={kpi.id} className="border-2 border-slate-900 shadow-xl rounded-2xl overflow-hidden bg-white col-span-1 md:col-span-2">
                      <div className="bg-slate-900 px-4 py-3 text-white flex justify-between items-center">
                        <span className="font-bold text-sm flex items-center gap-2"><Edit2 className="w-4 h-4"/> Editando Total</span>
                        <button onClick={() => setEditingGeneral(null)} className="hover:bg-white/20 p-1 rounded-md transition-colors"><X className="w-4 h-4"/></button>
                      </div>
                      <CardContent className="p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5 hover:bg-slate-50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Nome</label>
                            <Input value={editingGeneral.name} onChange={e => setEditingGeneral({ ...editingGeneral, name: e.target.value })} className="h-9 font-bold" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Meta Global</label>
                            <Input type="number" value={editingGeneral.target} onChange={e => setEditingGeneral({ ...editingGeneral, target: e.target.value })} className="h-9 font-bold" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Apresentação</label>
                            <Input value={editingGeneral.unit} onChange={e => setEditingGeneral({ ...editingGeneral, unit: e.target.value })} className="h-9" placeholder="R$, %, Qtde..." />
                          </div>
                          <div className="space-y-1.5 col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Cálculo no Painel Consolidado</label>
                            <div className="flex gap-1">
                              {(['sum', 'average'] as const).map(m => (
                                <button key={m} onClick={() => setEditingGeneral({ ...editingGeneral, aggregation: m })}
                                  className={`flex-1 h-9 rounded-md text-[10px] font-black transition-all ${editingGeneral.aggregation === m ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                  {m === 'sum' ? '∑ Soma Geral' : '⌀ Tirar Média'}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1.5 col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Distribuição da Meta Anual</label>
                            <div className="flex gap-1">
                              {(['fraction', 'global'] as const).map(d => (
                                <button key={d} onClick={() => setEditingGeneral({ ...editingGeneral, distribution: d })}
                                  className={`flex-1 h-9 rounded-md text-[10px] font-black transition-all ${editingGeneral.distribution === d ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                  {d === 'fraction' ? '÷ Fração (Dividir)' : '∞ Global (Repetir)'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end pt-2 border-t">
                          <Button size="sm" onClick={handleSaveGeneralKpi} className="bg-slate-900 hover:bg-slate-800 text-white">Salvar</Button>
                          <Button size="sm" variant="outline" onClick={() => { handleSaveGeneralKpi(); handleRedistribute(kpi.id) }} className="gap-1 border-slate-300 font-bold">
                            <RefreshCw className="h-4 w-4" /> Salvar e Rebalancear 
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                }

                // Render Vibrant KPI Card
                return (
                  <div key={kpi.id} className="relative group rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
                    {/* Background gradient with overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-95`} />
                    <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
                    
                    <div className="relative p-5 text-white h-full flex flex-col justify-between min-h-[180px]">
                      {/* Top section */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <h4 className="font-black text-lg leading-tight drop-shadow-sm pr-6 leading-tight max-w-[90%]">{kpi.name}</h4>
                          <span className="inline-flex py-0.5 px-2 bg-black/20 font-bold text-[9px] rounded-full uppercase tracking-widest backdrop-blur-sm shadow-inner">
                            {kpi.aggregation === 'sum' ? 'Acumulativo' : 'Média Geral'}
                          </span>
                        </div>
                        
                        {/* Action buttons (fade in on hover) */}
                        <div className="absolute top-4 right-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-md rounded-xl p-1 border border-white/10 shadow-2xl">
                          <button onClick={() => setEditingGeneral({ id: kpi.id, name: kpi.name, target: kpi.target.toString(), unit: kpi.unit, aggregation: kpi.aggregation, distribution: kpi.distribution || (kpi.aggregation === 'sum' ? 'fraction' : 'global') })} className="p-1.5 hover:bg-white/20 rounded-lg text-white/90 hover:text-white transition-colors" title="Editar">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleRedistribute(kpi.id)} className="p-1.5 hover:bg-white/20 rounded-lg text-white/90 hover:text-white transition-colors" title="Repartir meta nos anos">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteKpi(kpi.id)} className="p-1.5 hover:bg-red-500/80 rounded-lg text-white/90 hover:text-white transition-colors" title="Excluir">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Bottom values section */}
                      <div className="mt-auto">
                        <div className="flex items-end gap-1.5 mb-2">
                          <span className="text-4xl font-black tracking-tighter drop-shadow-md leading-none">
                            {kpi.current.toLocaleString('pt-BR')}
                          </span>
                          <span className="text-white/70 font-bold text-sm mb-1">
                            / {kpi.target.toLocaleString('pt-BR')} {kpi.unit}
                          </span>
                        </div>
                        
                        {/* Thick Progress bar container */}
                        <div className="w-full bg-black/20 rounded-full h-3.5 p-0.5 backdrop-blur-sm overflow-hidden flex shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${isSuccess ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]' : isWarning ? 'bg-amber-300' : 'bg-white/90'}`}
                            style={{ width: `${Math.max(2, percent)}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5 text-xs font-bold text-white/80 drop-shadow-sm">
                          <span>Realizado</span>
                          <span className={isSuccess ? 'text-white font-black' : ''}>{percent.toFixed(1)}% atingido</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* SPREAD YEARLY CARDS */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-400" /> Detalhamento Anual
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {yearlyGoals.map((yearGoal, yIdx) => (
                <Card key={yearGoal.id} className="border-none shadow-lg rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
                  <div className="bg-slate-50 border-b px-5 py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black text-slate-900">{yearGoal.year}</h4>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                         {fmtDate(yearGoal.startDate)} → {fmtDate(yearGoal.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-white font-bold text-[10px]">{yearGoal.kpis.length} KPIs</Badge>
                      <button onClick={() => handleDeleteYear(yearGoal.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Excluir Ano">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <CardContent className="p-0">
                    {kpis.length === 0 && <div className="p-8 text-center text-sm text-slate-400">Sem indicadores.</div>}
                    
                    {/* List of KPIs in this year */}
                    <div className="divide-y divide-slate-100">
                      {kpis.map((baseKpi, kpiIdx) => {
                        const yKpi = yearGoal.kpis.find(k => k.id === baseKpi.id) || { ...baseKpi, current: 0, target: 0 }
                        const isEditCurrent = editingYearIndex === yIdx && editingKpiId === baseKpi.id && editType === 'current'
                        const isEditTarget = editingYearIndex === yIdx && editingKpiId === baseKpi.id && editType === 'target'
                        const pct = yKpi.target > 0 ? Math.min((yKpi.current / yKpi.target) * 100, 100) : 0
                        
                        // Pick color from the same pool to tie it visually
                        const dotColor = cardColors[kpiIdx % cardColors.length].split(' ')[0].replace('from-', 'bg-')

                        return (
                          <div key={baseKpi.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                              <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${dotColor}`} />
                              <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">{baseKpi.name}</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                              {/* Realizado */}
                              <div className="flex-1 bg-white border border-slate-200 rounded-xl p-2 pb-1.5 group/edit relative cursor-pointer hover:border-slate-300 transition-colors shadow-sm"
                                onClick={() => !isEditCurrent && startEditing(yIdx, yKpi, 'current')}>
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Realizado</p>
                                {isEditCurrent ? (
                                  <div className="flex items-center gap-1.5 h-6">
                                    <Input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} className="h-full px-1.5 text-sm font-bold w-full rounded-md" />
                                    <button className="bg-slate-900 text-white p-1 rounded hover:bg-slate-800" onClick={(e) => { e.stopPropagation(); handleUpdateYearlyGoal(yIdx, baseKpi.id, 'current', Number(editValue)) }}>
                                      <Check className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-end gap-1 h-6">
                                    <span className="text-lg font-black text-slate-900 leading-none">{yKpi.current.toLocaleString('pt-BR')}</span>
                                    <Edit2 className="w-3 h-3 text-slate-300 absolute top-2.5 right-2 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Meta */}
                              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 pb-1.5 group/edit relative cursor-pointer hover:border-slate-300 transition-colors"
                                onClick={() => !isEditTarget && startEditing(yIdx, yKpi, 'target')}>
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Meta Anual</p>
                                {isEditTarget ? (
                                  <div className="flex items-center gap-1.5 h-6">
                                    <Input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} className="h-full px-1.5 text-sm font-bold w-full rounded-md" />
                                    <button className="bg-slate-900 text-white p-1 rounded hover:bg-slate-800" onClick={(e) => { e.stopPropagation(); handleUpdateYearlyGoal(yIdx, baseKpi.id, 'target', Number(editValue)) }}>
                                      <Check className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-end gap-1 h-6">
                                    <span className="text-lg font-bold text-slate-500 leading-none">{yKpi.target.toLocaleString('pt-BR')}</span>
                                    {yKpi.unit && <span className="text-xs text-slate-400 mb-0.5">{yKpi.unit}</span>}
                                    <Edit2 className="w-3 h-3 text-slate-300 absolute top-2.5 right-2 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                                  </div>
                                )}
                              </div>

                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-full min-h-[50px] border-slate-200 text-slate-500 hover:text-[#006838] hover:border-[#006838]/30 hover:bg-[#006838]/5 font-bold gap-1.5 flex-col justify-center px-4 shadow-sm"
                                onClick={() => handleOpenMonthly(yIdx, baseKpi, yKpi)}
                                title="Gráficos e Detalhamento Mensal"
                              >
                                <BarChart3 className="h-4 w-4" />
                                <span className="text-[9px] uppercase tracking-widest leading-none">Meses</span>
                              </Button>
                            </div>

                            {/* Mini Progress */}
                            <div className="mt-3 flex items-center gap-3">
                              <Progress value={pct} className="h-1.5 flex-1 bg-slate-100" />
                              <span className="text-[10px] font-black w-8 tracking-tighter text-right text-slate-500">{pct.toFixed(0)}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add Year Plus Card */}
              <div
                className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center min-h-[300px] cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all group"
                onClick={handleAddYear}
              >
                <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300 mb-4 text-slate-400 group-hover:text-slate-900">
                  <Plus className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-700">Adicionar Extensão Anual</h4>
                <p className="text-xs text-slate-400 font-medium mt-1">Estender para {yearlyGoals.length > 0 ? yearlyGoals[yearlyGoals.length - 1].year + 1 : new Date().getFullYear()}</p>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <Card className="border-dashed border-2 p-12 text-center rounded-2xl bg-slate-50 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:20px_20px]" />
          <div className="relative z-10 w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mx-auto mb-6 text-slate-300">
            <Target className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-3 relative z-10">Construa o Painel de Indicadores</h3>
          <p className="text-slate-500 font-medium max-w-md mx-auto relative z-10">
            Comece configurando os grandes objetivos do projeto. As metas serão repartidas automaticamente ano a ano.
          </p>
        </Card>
      )}

      <MonthlyKpiDialog 
        editingMonthly={editingMonthly} 
        setEditingMonthly={setEditingMonthly} 
        onSave={handleSaveMonthly} 
      />

      {/* Pop-up estilizado para Exclusão de Ano */}
      {deleteYearConfirm && (
        <Dialog open={!!deleteYearConfirm} onOpenChange={(open) => !open && setDeleteYearConfirm(null)}>
          <DialogContent className="sm:max-w-lg bg-white border-slate-200 p-6 w-[95vw] max-h-[90vh] overflow-y-auto rounded-[32px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-900 border-b pb-4">Excluir Detalhamento Anual</DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500 pt-4 flex flex-col gap-4 text-left">
                <span className="text-base text-slate-700">Você está prestes a excluir um ano inteiro deste projeto.</span>
                {isFractionKpiPresent && (
                  <span className="bg-amber-50 text-amber-700 p-4 rounded-xl border border-amber-200 text-sm leading-relaxed shadow-sm">
                    Deseja que o sistema <strong>redistribua automaticamente</strong> as metas do tipo "Fração" (que estavam alocadas neste ano) para os anos restantes, a fim de manter a meta global original intacta?
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 w-full mt-6">
              {isFractionKpiPresent ? (
                <>
                  <Button onClick={() => confirmDeleteYear(true)} className="w-full font-black bg-[#006838] text-white hover:bg-[#00522a] shadow-lg h-14 text-sm rounded-xl">
                    Sim, Excluir e Redistribuir Metas
                  </Button>
                  <Button variant="outline" onClick={() => confirmDeleteYear(false)} className="w-full font-black border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 hover:border-red-300 h-14 text-sm rounded-xl shadow-sm">
                    Excluir Sem Redistribuir
                  </Button>
                </>
              ) : (
                <Button onClick={() => confirmDeleteYear(false)} className="w-full font-black bg-red-600 text-white hover:bg-red-700 shadow-lg h-14 text-sm rounded-xl">
                  Confirmar Exclusão
                </Button>
              )}
              <Button variant="ghost" onClick={() => setDeleteYearConfirm(null)} className="w-full font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 h-12 text-sm rounded-xl mt-2">
                Cancelar e Voltar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
