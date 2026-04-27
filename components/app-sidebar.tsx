'use client'

import { FolderKanban, Plus, Settings, LayoutDashboard, ChevronRight, LogOut, UserCog, Shield, BarChart3, Power } from 'lucide-react'
import { useProjectStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LogoPrincesa } from '@/components/logo-princesa'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

interface AppSidebarProps {
  onNewProject: () => void
}

export function AppSidebar({ onNewProject }: AppSidebarProps) {
  const {
    projects,
    selectedProjectId,
    selectProject,
    calculateProjectProgress,
    user,
    logout,
    activeView,
    setActiveView
  } = useProjectStore()

  const canCreateProject = user?.role === 'admin' || user?.role === 'gerencia'

  const filteredProjects = projects.filter(project => {
    if (!user) return false
    if (['admin', 'conselho', 'diretoria'].includes(user.role)) return true
    if (project.ownerId === user.id) return true
    if (project.memberIds?.includes(user.id)) return true
    return false
  })

  return (
    <Sidebar variant="inset" className="border-r border-sidebar-border shadow-2xl">
      <SidebarHeader className="h-24 border-b border-sidebar-border flex flex-row items-center px-4 gap-3 bg-sidebar">
        <LogoPrincesa className="h-12 w-auto" />
        <div className="flex flex-col">
          <span className="font-black text-lg tracking-tight text-sidebar-foreground">ProjectFlow</span>
          <span className="text-[9px] text-primary uppercase font-bold tracking-widest">Princesa dos Campos</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4 space-y-6 bg-sidebar/95">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-sidebar-foreground/50 mb-2 px-2">Navegação Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    selectProject(null)
                    setActiveView('main')
                  }}
                  className={cn("gap-3 transition-colors", activeView === 'main' && !selectedProjectId ? "bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90 hover:text-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard Principal</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {(user?.role === 'admin' || user?.role === 'gerencia' || user?.role === 'conselho' || user?.role === 'diretoria') && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveView('consolidated')}
                    className={cn("gap-3 transition-colors", activeView === 'consolidated' ? "bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90 hover:text-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Painel Consolidado</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <div className="flex items-center justify-between px-2 mb-2">
            <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-sidebar-foreground/50">Projetos Ativos</SidebarGroupLabel>
            {canCreateProject && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-primary"
                onClick={onNewProject}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredProjects.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton
                    onClick={() => selectProject(project.id)}
                    className={cn(
                      "gap-3 group transition-colors",
                      selectedProjectId === project.id ? "bg-sidebar-accent text-primary font-bold shadow-sm" : "hover:bg-sidebar-accent/50"
                    )}
                  >
                    <div
                      className="h-2 w-2 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate flex-1 uppercase text-[11px] tracking-tight">{project.name}</span>
                    <span className="text-[9px] font-black opacity-40 group-hover:opacity-100">
                      {Math.round(calculateProjectProgress(project.id))}%
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(user?.role === 'admin') && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-sidebar-foreground/50 mb-2 px-2">Sistema</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveView('users')}
                    className={cn("gap-3 transition-colors", activeView === 'users' ? "bg-sidebar-accent text-primary font-bold" : "hover:bg-sidebar-accent")}
                  >
                    <UserCog className="h-4 w-4" />
                    <span>Gestão de Usuários</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-3 p-2 bg-sidebar-accent/50 rounded-xl border border-sidebar-border mb-4">
          <Avatar className="h-8 w-8 border-2 border-sidebar-border shadow-sm">
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
              {user?.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-sidebar-foreground truncate uppercase tracking-tighter">{user?.name}</span>
            <Badge variant="outline" className="w-fit text-[8px] h-3 uppercase font-black px-1 border-primary/30 text-primary bg-primary/10">
              {user?.role}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
            onClick={logout}
          >
            <Power className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="text-[9px] text-center text-sidebar-foreground/40 font-medium uppercase tracking-widest pb-2">
          Desenvolvido por Weslen Rian e William Kutz
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
