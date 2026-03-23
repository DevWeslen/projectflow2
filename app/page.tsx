'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Dashboard } from '@/components/dashboard'
import { ProjectView } from '@/components/project-view'
import { ProjectFormDialog } from '@/components/project-form-dialog'

export default function Home() {
  const { selectedProjectId } = useProjectStore()
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)

  return (
    <SidebarProvider>
      <AppSidebar onNewProject={() => setProjectDialogOpen(true)} />
      <SidebarInset className="flex flex-col min-h-screen bg-background">
        {selectedProjectId ? (
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
