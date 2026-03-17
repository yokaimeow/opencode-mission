"use client"

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { TaskTable } from "@/components/task-table"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Loading } from "@/components/loading"
import { useUserTasks } from "@/features/tasks"

export default function TasksPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const { tasks, isLoading: tasksLoading, refetch } = useUserTasks()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  if (authLoading) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title="Tasks" />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <TaskTable 
                  tasks={tasks} 
                  isLoading={tasksLoading} 
                  onDelete={() => refetch()} 
                />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
