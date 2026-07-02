'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/lib/store'
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
  ArrowRight,
  Flame,
  CalendarClock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Notification {
  id: string
  taskId: string
  title: string
  projectName: string
  projectColor: string
  type: 'danger' | 'warning'
  message: string
  diffDays: number
  read: boolean
}

export function Notifications() {
  const { tasks, projects, user, selectProject } = useProjectStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hasShownToast, setHasShownToast] = useState(false)

  useEffect(() => {
    if (!user) return

    const now = new Date()
    const notifs: Notification[] = tasks
      .filter(task => {
        if (task.status === 'done') return false
        const isOwner = task.ownerId === user.id
        const isStakeholder = Array.isArray(task.stakeholderIds) && task.stakeholderIds.includes(user.id)
        if (!isOwner && !isStakeholder) return false
        if (!task.deadline) return false

        const diffTime = new Date(task.deadline).getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays <= 2
      })
      .map(task => {
        const project = projects.find(p => p.id === task.projectId)
        const diffTime = new Date(task.deadline!).getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        let type: 'danger' | 'warning' = 'warning'
        let message = diffDays === 1 ? 'Vence amanhã' : `Vence em ${diffDays} dia(s)`

        if (diffDays < 0) {
          type = 'danger'
          message = `Atrasada há ${Math.abs(diffDays)}d`
        } else if (diffDays === 0) {
          type = 'danger'
          message = 'Vence hoje!'
        }

        return {
          id: task.id,
          taskId: task.id,
          title: task.title,
          projectName: project?.name || 'Projeto',
          projectColor: project?.color || '#006838',
          type,
          message,
          diffDays,
          read: false
        }
      })
      .sort((a, b) => a.diffDays - b.diffDays)

    setNotifications(notifs)

    if (notifs.length > 0 && !hasShownToast) {
      const overdue = notifs.filter(n => n.diffDays < 0).length
      toast.warning(
        overdue > 0 ? `${overdue} tarefa(s) atrasadas!` : `${notifs.length} tarefa(s) vencem em breve!`,
        { description: 'Clique no sino para detalhes.' }
      )
      setHasShownToast(true)
    }
  }, [tasks, projects, user, hasShownToast])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  const dismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleClick = (notif: Notification) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
    const task = tasks.find(t => t.id === notif.taskId)
    if (task) {
      selectProject(task.projectId)
      setIsOpen(false)
    }
  }

  if (!user) return null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative h-8 w-8 rounded-full transition-all',
            isOpen
              ? 'bg-primary/20 text-primary'
              : 'hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-primary'
          )}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-black text-white ring-2 ring-sidebar">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="end"
        sideOffset={8}
        className="w-[min(340px,calc(100vw-2rem))] p-0 border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
              <Bell className="h-3 w-3 text-primary" />
            </div>
            <span className="text-sm font-black text-foreground">Alertas</span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-red-500/15 text-red-500 text-[9px] font-black px-1.5 py-0.5 min-w-[18px]">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-6 px-2 text-[10px] font-bold text-muted-foreground hover:text-primary rounded-md"
            >
              Marcar todas
            </Button>
          )}
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 px-6 text-center">
            <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground">Tudo em dia!</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Sem atividades com prazo urgente.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-h-[360px] overflow-y-auto overflow-x-hidden custom-scrollbar">
            <div className="p-2 space-y-1">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={cn(
                    'group relative flex gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 select-none',
                    !notif.read
                      ? notif.type === 'danger'
                        ? 'bg-red-500/8 hover:bg-red-500/14 border border-red-500/20'
                        : 'bg-amber-500/8 hover:bg-amber-500/14 border border-amber-500/20'
                      : 'bg-transparent hover:bg-muted/60 border border-transparent'
                  )}
                >
                  {/* Unread bar */}
                  {!notif.read && (
                    <div className={cn(
                      'absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full',
                      notif.type === 'danger' ? 'bg-red-500' : 'bg-amber-500'
                    )} />
                  )}

                  {/* Icon */}
                  <div className={cn(
                    'mt-0.5 shrink-0 h-8 w-8 rounded-xl flex items-center justify-center',
                    notif.type === 'danger' ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500'
                  )}>
                    {notif.type === 'danger'
                      ? <Flame className="h-4 w-4" />
                      : <CalendarClock className="h-4 w-4" />
                    }
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={cn(
                        'text-[12px] font-semibold leading-snug line-clamp-2',
                        !notif.read ? 'text-foreground' : 'text-foreground/60'
                      )}>
                        {notif.title}
                      </p>
                      <button
                        onClick={(e) => dismiss(e, notif.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {/* Project */}
                      <div className="flex items-center gap-1 min-w-0">
                        <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: notif.projectColor }} />
                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{notif.projectName}</span>
                      </div>
                      <span className="text-muted-foreground/30 text-[10px]">·</span>
                      {/* Badge */}
                      <span className={cn(
                        'inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md',
                        notif.type === 'danger' ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500'
                      )}>
                        {notif.type === 'danger' ? <AlertTriangle className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                        {notif.message}
                      </span>
                    </div>

                    {/* Go to project — hover */}
                    <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-bold text-primary">Ir para o projeto</span>
                      <ArrowRight className="h-2.5 w-2.5 text-primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-border/20 bg-muted/20">
            <p className="text-[9px] text-center text-muted-foreground/50 font-medium">
              Prazo ≤ 2 dias · Clique para ir ao projeto
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
