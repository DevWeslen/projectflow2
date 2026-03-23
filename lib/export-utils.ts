import { Project, Task } from './types'

export function exportProjectToCSV(project: Project, tasks: Task[]) {
  const headers = ['ID', 'Titulo', 'Descricao', 'Status', 'Progresso', 'Prazo', 'ID Pai']
  
  const rows = tasks.map(task => [
    task.id,
    task.title,
    task.description || '',
    task.status,
    `${task.progress}%`,
    task.deadline ? new Date(task.deadline).toLocaleDateString('pt-BR') : '',
    task.parentId || 'Macro'
  ])

  const csvContent = [
    [`RELATORIO DE TAREFAS - ${project.name}`],
    [project.description || ''],
    [],
    headers,
    ...rows
  ].map(e => e.join(';')).join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `Projeto_${project.name.replace(/\s+/g, '_')}.csv`)
  link.click()
}

export function exportRiskToCSV(project: Project, type: string, data: any) {
    let csvContent = `Analise de Risco:;${type.toUpperCase()}\nProjeto:;${project.name}\n\n`
    
    if (type === '5w2h') {
        csvContent += `What;Why;Where;When;Who;How;How Much\n`
        csvContent += `${data.what};${data.why};${data.where};${data.when};${data.who};${data.how};${data.howMuch}`
    } else if (type === 'swot') {
        csvContent += `Forcas;Fraquezas;Oportunidades;Aameacas\n`
        const maxLen = Math.max(data.strengths.length, data.weaknesses.length, data.opportunities.length, data.threats.length)
        for (let i = 0; i < maxLen; i++) {
            csvContent += `${data.strengths[i] || ''};${data.weaknesses[i] || ''};${data.opportunities[i] || ''};${data.threats[i] || ''}\n`
        }
    } else if (type === 'five-whys') {
        csvContent += `Problema:;${data.issue}\n\nPor ques:;\n`
        data.whys.forEach((w: string, i: number) => {
            csvContent += `${i + 1};${w}\n`
        })
        csvContent += `\nCausa Raiz:;${data.rootCause}`
    } else if (type === 'fishbone') {
        csvContent += `Problema:;${data.problem}\n\nCategorias;Causas\n`
        Object.entries(data.categories).forEach(([cat, items]: [string, any]) => {
            csvContent += `${cat};${items.join(', ')}\n`
        })
    } else if (type === 'pareto') {
        csvContent += `Item;Ocorrencias\n`
        data.problems.forEach((p: any) => {
            csvContent += `${p.name};${p.occurrence}\n`
        })
    }

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Risco_${type}_${project.name.replace(/\s+/g, '_')}.csv`)
    link.click()
}

export function exportFullProjectToCSV(project: Project, tasks: Task[], riskAnalyses: any[]) {
  let csvContent = '\ufeff' // UTF-8 BOM
  
  csvContent += `RELATORIO COMPLETO DO PROJETO\n`
  csvContent += `Projeto:;${project.name}\n`
  csvContent += `Descricao:;${project.description || ''}\n`
  csvContent += `Status do Progresso:;${Math.round((project as any).progress || 0)}%\n`
  csvContent += `Data de Emissão:;${new Date().toLocaleDateString('pt-BR')}\n\n`

  csvContent += `ESTRUTURA DE TAREFAS\n`
  csvContent += `ID;Titulo;Descricao;Status;Progresso;Prazo;ID Pai\n`
  tasks.forEach(task => {
    csvContent += `${task.id};${task.title};${task.description || ''};${task.status};${task.progress}%;${task.deadline ? new Date(task.deadline).toLocaleDateString('pt-BR') : ''};${task.parentId || 'Macro'}\n`
  })
  csvContent += `\n`

  if (riskAnalyses.length > 0) {
    csvContent += `ANALISES DE RISCO\n`
    riskAnalyses.forEach(analysis => {
      csvContent += `---;---;---;---;---;---;---\n`
      csvContent += `Ferramenta:;${analysis.type.toUpperCase()};Titulo:;${analysis.title}\n`
      
      const data = analysis.data
      if (analysis.type === '5w2h') {
        csvContent += `What;Why;Where;When;Who;How;How Much\n`
        csvContent += `${data.what};${data.why};${data.where};${data.when};${data.who};${data.how};${data.howMuch}\n`
      } else if (analysis.type === 'swot') {
        csvContent += `Forcas;Fraquezas;Oportunidades;Ameacas\n`
        const maxLen = Math.max(data.strengths.length, data.weaknesses.length, data.opportunities.length, data.threats.length)
        for (let i = 0; i < maxLen; i++) {
          csvContent += `${data.strengths[i] || ''};${data.weaknesses[i] || ''};${data.opportunities[i] || ''};${data.threats[i] || ''}\n`
        }
      } else if (analysis.type === 'five-whys') {
        csvContent += `Problema:;${data.issue}\n`
        data.whys.forEach((w: string, i: number) => {
          csvContent += `Por que ${i+1}:;${w}\n`
        })
        csvContent += `Causa Raiz:;${data.rootCause}\n`
      } else if (analysis.type === 'fishbone') {
        csvContent += `Problema:;${data.problem}\n`
        Object.entries(data.categories).forEach(([cat, items]: [string, any]) => {
          csvContent += `${cat}:;${items.join(', ')}\n`
        })
      } else if (analysis.type === 'pareto') {
        csvContent += `Item;Ocorrencias\n`
        data.problems.forEach((p: any) => {
          csvContent += `${p.name};${p.occurrence}\n`
        })
      }
      csvContent += `\n`
    })
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `RELATORIO_COMPLETO_${project.name.replace(/\s+/g, '_')}.csv`)
  link.click()
}
