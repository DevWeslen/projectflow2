'use client'

import { FolderKanban, Plus, Settings, LayoutDashboard, ChevronRight } from 'lucide-react'
import { useProjectStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LogoPrincesa } from '@/components/logo-princesa'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

interface AppSidebarProps {
  onNewProject: () => void
}

export function AppSidebar({ onNewProject }: AppSidebarProps) {
  const { projects, selectedProjectId, selectProject, calculateProjectProgress } = useProjectStore()

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <LogoPrincesa className="h-10 w-10 shrink-0" />
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">ProjectFlow</h1>
            <p className="text-xs text-sidebar-foreground/60">Princesa dos Campos</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => selectProject(null)}
                  isActive={selectedProjectId === null}
                  className="gap-3"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between px-2">
            <span>Projetos</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={onNewProject}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs text-sidebar-foreground/50">
                    Nenhum projeto ainda
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={onNewProject}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Criar primeiro projeto
                  </Button>
                </div>
              ) : (
                projects.map((project) => {
                  const progress = calculateProjectProgress(project.id)
                  return (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton
                        onClick={() => selectProject(project.id)}
                        isActive={selectedProjectId === project.id}
                        className="gap-3"
                      >
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="flex-1 truncate">{project.name}</span>
                        <span className="text-xs text-sidebar-foreground/50">
                          {Math.round(progress)}%
                        </span>
                        <ChevronRight className="h-3 w-3 text-sidebar-foreground/30" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="gap-3">
              <Settings className="h-4 w-4" />
              <span>Configuracoes</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
