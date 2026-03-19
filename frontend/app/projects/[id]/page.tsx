"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useProject } from '@/hooks/useProject'
import { useTasks, taskApi } from '@/features/tasks'
import { showError, showSuccess } from '@/lib/toast'
import type { Task, TaskStatus, TaskPriority } from '@/features/tasks'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/loading"
import { BoardColumn } from "@/components/board-column"
import { MembersList } from "@/components/members-list"
import { TaskTable } from "@/components/task-table"
import { AddMemberDialog } from "@/components/add-member-dialog"
import { AddTaskDialog } from "@/components/add-task-dialog"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  SettingsIcon,
  PlusIcon,
  LoaderIcon,
  LayoutGridIcon,
  ListIcon,
} from "lucide-react"

const COLUMNS = [
  { id: 'todo', title: 'To Do', status: 'todo' as TaskStatus },
  { id: 'in_progress', title: 'In Progress', status: 'in_progress' as TaskStatus },
  { id: 'in_review', title: 'In Review', status: 'in_review' as TaskStatus },
  { id: 'done', title: 'Done', status: 'done' as TaskStatus },
]

const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case 'urgent':
      return 'text-red-600 dark:text-red-400'
    case 'high':
      return 'text-orange-600 dark:text-orange-400'
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'low':
      return 'text-gray-600 dark:text-gray-400'
  }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isLoading: authLoading, isAuthenticated } = useAuth()
  const projectId = params.id as string

  const { project, members, projectAgents, isLoading: projectLoading, refetch: refetchProject } = useProject(projectId)
  const { tasks, isLoading: tasksLoading, refetch: refetchTasks } = useTasks(projectId)

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false)
  const [showEditTaskDialog, setShowEditTaskDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setShowEditTaskDialog(true)
  }

  const handleDeleteClick = (task: Task) => {
    setSelectedTask(task)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedTask) return
    setIsDeleting(true)
    try {
      await taskApi.delete(selectedTask.id)
      setShowDeleteConfirm(false)
      setSelectedTask(null)
      refetchTasks()
      showSuccess('Task deleted')
    } catch (error) {
      showError(error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await taskApi.update(task.id, { status: newStatus })
      refetchTasks()
      showSuccess('Status updated')
    } catch (error) {
      showError(error)
    }
  }

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status)
  }

  if (authLoading || projectLoading) {
    return <Loading />
  }

  if (!isAuthenticated || !project) {
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
          <SiteHeader title={project.name} />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex items-center justify-between px-4 lg:px-6 py-4 bg-background border-b shadow-sm">
                <div>
                  <h1 className="text-xl font-semibold">{project.name}</h1>
                  {project.description && (
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border rounded-lg p-1">
                    <Button
                      variant={viewMode === 'board' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 px-3"
                      onClick={() => setViewMode('board')}
                    >
                      <LayoutGridIcon className="h-4 w-4 mr-1" />
                      Board
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 px-3"
                      onClick={() => setViewMode('list')}
                    >
                      <ListIcon className="h-4 w-4 mr-1" />
                      List
                    </Button>
                  </div>
                  <Button size="sm" onClick={() => setShowAddTaskDialog(true)}>
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/projects/${project.id}/settings`)}
                  >
                    <SettingsIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="px-4 lg:px-6 py-6">
                {viewMode === 'board' ? (
                  <>
                    <div className="flex gap-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {COLUMNS.map((column) => (
                          <BoardColumn
                            key={column.id}
                            title={column.title}
                            status={column.status}
                            tasks={getTasksByStatus(column.status)}
                            onEditTask={handleEditTask}
                            onDeleteTask={handleDeleteClick}
                            onStatusChange={handleStatusChange}
                            getPriorityColor={getPriorityColor}
                          />
                        ))}
                      </div>
                      <div className="w-72 shrink-0 hidden xl:block self-start">
                        <MembersList
                          members={members}
                          projectAgents={projectAgents}
                          onAddMember={() => setShowAddDialog(true)}
                        />
                      </div>
                    </div>
                    <div className="mt-4 xl:hidden">
                      <MembersList
                        members={members}
                        projectAgents={projectAgents}
                        isCompact
                        onAddMember={() => setShowAddDialog(true)}
                      />
                    </div>
                  </>
                ) : (
                  <TaskTable
                    tasks={tasks}
                    isLoading={tasksLoading}
                    onDelete={() => refetchTasks()}
                  />
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <AddMemberDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        projectId={project.id}
        onSuccess={refetchProject}
      />

      <AddTaskDialog
        open={showAddTaskDialog}
        onOpenChange={setShowAddTaskDialog}
        projectId={project.id}
        members={members}
        projectAgents={projectAgents}
        onSuccess={refetchTasks}
      />

      <EditTaskDialog
        open={showEditTaskDialog}
        onOpenChange={setShowEditTaskDialog}
        task={selectedTask}
        members={members}
        projectAgents={projectAgents}
        onSuccess={refetchTasks}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{selectedTask?.title}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting && <LoaderIcon className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
