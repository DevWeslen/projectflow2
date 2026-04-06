import { Check, X, Calendar, TrendingUp, Save, BarChart3, RefreshCw, AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { MonthlyData } from '@/lib/types'
import { cn } from '@/lib/utils'

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export interface EditingMonthly {
  yearGoalId: string
  kpiId: string
  kpiName: string
  unit: string
  target: number
  aggregation: 'sum' | 'average'
  monthly: MonthlyData[]
}

interface MonthlyKpiDialogProps {
  editingMonthly: EditingMonthly | null
  setEditingMonthly: (val: EditingMonthly | null) => void
  onSave: (data: EditingMonthly) => void
}

export function MonthlyKpiDialog({ editingMonthly, setEditingMonthly, onSave }: MonthlyKpiDialogProps) {
  if (!editingMonthly) return null
  
  const handleMonthChange = (monthIndex: number, field: 'current' | 'target', value: string) => {
    const numValue = Number(value)
    
    // Copy the monthly array
    const newMonthly = [...editingMonthly.monthly]
    const month = { ...newMonthly[monthIndex] }
    month[field] = numValue
    newMonthly[monthIndex] = month
    
    setEditingMonthly({
      ...editingMonthly,
      monthly: newMonthly
    })
  }

  const handleAutoDistribute = () => {
    const perMonth = editingMonthly.aggregation === 'sum' 
      ? Math.round((editingMonthly.target / 12) * 100) / 100 
      : editingMonthly.target

    const newMonthly = editingMonthly.monthly.map(m => ({
      ...m,
      target: perMonth
    }))

    setEditingMonthly({
      ...editingMonthly,
      monthly: newMonthly
    })
  }

  // Cálculos de Totais para exibição
  let totalCurrent = 0
  let totalTarget = 0
  let validCurrentMonths = 0
  let validTargetMonths = 0

  editingMonthly.monthly.forEach(m => {
    totalCurrent += (m.current || 0)
    totalTarget += (m.target || 0)
    if (m.current > 0) validCurrentMonths++
    if (m.target > 0) validTargetMonths++
  })
  
  const finalCurrent = editingMonthly.aggregation === 'sum' 
    ? totalCurrent 
    : (validCurrentMonths > 0 ? totalCurrent / validCurrentMonths : 0)
  
  const finalTarget = editingMonthly.aggregation === 'sum' 
    ? totalTarget 
    : (validTargetMonths > 0 ? totalTarget / validTargetMonths : 0)

  const isTargetMismatch = Math.abs(finalTarget - editingMonthly.target) > 0.01

  // Prepara os dados pro gráfico.
  const chartData = editingMonthly.monthly.map(m => ({
    name: MONTH_NAMES[m.monthIndex],
    Realizado: m.current || 0,
    Meta: m.target || 0
  }))

  return (
    <Dialog open={!!editingMonthly} onOpenChange={(open) => !open && setEditingMonthly(null)}>
      <DialogContent className="sm:max-w-6xl bg-slate-50 border-slate-200 p-6 w-[95vw] max-h-[90vh] overflow-y-auto rounded-[40px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-slate-900 border-b pb-4 flex items-center gap-2">
            <BarChart3 className="text-[#006838] w-6 h-6" /> Gráficos e Evolução Mensal
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-500 pt-4 flex flex-col gap-2 text-left">
            <span>Acompanhe o indicador <strong className="text-slate-800">"{editingMonthly.kpiName}"</strong> mês a mês.</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          
          {/* Lado Esquerdo: Tabela de Meses */}
          <div className="space-y-4 col-span-1 border border-slate-200 bg-white rounded-[24px] p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Lançamento</h3>
                <button 
                  onClick={handleAutoDistribute}
                  className="flex items-center gap-1.5 text-[9px] font-black text-[#006838] hover:text-[#00522a] uppercase tracking-widest bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-all border border-emerald-100 shadow-sm"
                  title="Redistribuir a Meta Anual proporcionalmente entre os meses"
                >
                  <RefreshCw className="w-3 h-3" /> Auto-Distribuir
                </button>
              </div>
              <span className="text-[10px] font-black text-slate-500 bg-slate-100 flex items-center justify-center px-2 py-0.5 rounded-full self-start">{editingMonthly.unit}</span>
            </div>
            
            <div className="space-y-2">
              <div className="grid grid-cols-5 text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b">
                <span className="col-span-1">Mês</span>
                <span className="col-span-2 text-center">Meta</span>
                <span className="col-span-2 text-center text-[#006838]">Realizado</span>
              </div>
              {editingMonthly.monthly.map(m => (
                <div key={m.monthIndex} className="grid grid-cols-5 gap-2 items-center hover:bg-slate-50 p-1 -mx-1 rounded-lg transition-colors">
                  <span className="col-span-1 font-bold text-slate-600 text-xs text-center">{MONTH_NAMES[m.monthIndex]}</span>
                  <div className="col-span-2 relative">
                    <Input type="number" value={m.target || ''} onChange={e => handleMonthChange(m.monthIndex, 'target', e.target.value)} className="h-8 text-xs font-bold text-center pl-1 pr-6" />
                  </div>
                  <div className="col-span-2 relative">
                    <Input type="number" value={m.current || ''} onChange={e => handleMonthChange(m.monthIndex, 'current', e.target.value)} className="h-8 text-xs font-black text-center text-[#006838] border-[#006838]/30 bg-emerald-50/30 pl-1 pr-6" />
                  </div>
                </div>
              ))}

              {/* Linha de Total na Tabela */}
              <div className="grid grid-cols-5 gap-2 items-center pt-3 border-t mt-2">
                <span className="col-span-1 font-black text-slate-400 text-[9px] text-center uppercase">Total</span>
                <div className="col-span-2 text-center text-xs font-bold text-slate-400">
                  {finalTarget.toLocaleString('pt-BR')}
                </div>
                <div className="col-span-2 text-center text-xs font-black text-[#006838]">
                  {finalCurrent.toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          </div>

          {/* Lado Direito: Gráfico */}
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
            <div className="border border-slate-200 bg-white rounded-[24px] p-6 shadow-sm flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Visão Gráfica</h3>
                
                <div className="flex gap-8">
                  {/* Meta de Referência (Anual) */}
                  <div className="text-right flex flex-col items-end border-r pr-6 border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Meta de Referência (Anual)</p>
                    <p className="text-sm font-black text-slate-500">
                      {editingMonthly.target.toLocaleString('pt-BR')} <span className="text-[10px]">{editingMonthly.unit}</span>
                    </p>
                  </div>

                  {/* Meta Atual (Soma dos Meses) */}
                  <div className="text-right flex flex-col items-end">
                    <div className="flex items-center gap-1.5">
                      {isTargetMismatch && (
                        <div className="p-1 bg-rose-100 text-rose-600 rounded-md animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                        </div>
                      )}
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Meta Atual (Meses)</p>
                    </div>
                    <p className={cn("text-sm font-black transition-colors", isTargetMismatch ? "text-rose-500" : "text-slate-600")}>
                      {finalTarget.toLocaleString('pt-BR')} <span className="text-[10px]">{editingMonthly.unit}</span>
                    </p>
                    {isTargetMismatch && <span className="text-[8px] font-bold text-rose-400 uppercase tracking-tighter">Divergência Detectada</span>}
                  </div>

                  {/* Realizado */}
                  <div className="text-right">
                    <p className="text-[9px] font-black text-[#006838] uppercase tracking-widest">Realizado {editingMonthly.aggregation === 'sum' ? 'Total' : 'Médio'}</p>
                    <p className="text-lg font-black text-[#006838] leading-none mt-1">{finalCurrent.toLocaleString('pt-BR')} <span className="text-xs">{editingMonthly.unit}</span></p>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '13px' }} 
                      itemStyle={{ fontWeight: 900 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                    <Line type="monotone" dataKey="Meta" stroke="#94A3B8" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Realizado" stroke="#006838" strokeWidth={4} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#006838]/5 border border-[#006838]/20 rounded-[20px] p-5">
              <h4 className="text-[11px] font-black uppercase text-[#006838] tracking-widest mb-1 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> O Cálculo Automático
              </h4>
              <p className="text-sm font-medium text-slate-600 mt-2">
                O "Realizado" no total anual passará a ser obrigatoriamente a {editingMonthly.aggregation === 'sum' ? 'SOMA' : 'MÉDIA'} exata dos meses preenchidos acima. Ao salvar, fecharemos aquela digitação manual por cima!
              </p>
            </div>
          </div>

        </div>

        <DialogFooter className="flex gap-3 justify-end mt-4 pt-4 border-t">
          <Button variant="ghost" onClick={() => setEditingMonthly(null)} className="h-12 w-full sm:w-auto font-bold rounded-xl text-slate-500 hover:text-slate-700">
            Cancelar e Fechar
          </Button>
          <Button onClick={() => onSave(editingMonthly)} className="h-12 w-full sm:w-auto font-black bg-[#006838] hover:bg-[#00522a] text-white shadow-lg rounded-xl px-10 gap-2">
            <Save className="w-4 h-4" /> Salvar Entradas Mensais
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
