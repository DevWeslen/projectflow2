'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Dashboard } from '@/components/dashboard'
import { ProjectView } from '@/components/project-view'
import { ProjectFormDialog } from '@/components/project-form-dialog'
import { LoginScreen } from '@/components/login-screen'
import { ConsolidatedDashboard } from '@/components/consolidated-dashboard'
import { UserManagement } from '@/components/user-management'

export default function Home() {
  const { selectedProjectId, user, activeView } = useProjectStore()
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)

  if (!user) {
    return <LoginScreen />
  }

  // Conselho vê apenas o consolidado (sem sidebar)
  if (user.role === 'conselho') {
    return <ConsolidatedDashboard />
  }

  return (
    <SidebarProvider>
      <AppSidebar onNewProject={() => setProjectDialogOpen(true)} />
      <SidebarInset className="flex flex-col min-h-screen bg-background">
        {activeView === 'users' ? (
          <UserManagement />
        ) : activeView === 'consolidated' ? (
          <ConsolidatedDashboard />
        ) : selectedProjectId ? (
          <ProjectView projectId={selectedProjectId} />
        ) : (
          <Dashboard onNewProject={() => setProjectDialogOpen(true)} />
        )}
      </SidebarInset>

      <ProjectFormDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
      />
    </SidebarProvider>
  )
}
