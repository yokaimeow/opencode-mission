"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { projectApi } from '@/lib/projects'
import { memberApi } from '@/lib/members'
import { agentApi } from '@/lib/agents'
import { useTasks, taskApi } from '@/features/tasks'
import { Project, ProjectMember, ProjectAgent } from '@/lib/types'
import type { Task, TaskStatus, TaskPriority } from '@/features/tasks'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AddMemberDialog } from "@/components/add-member-dialog"
import { AddTaskDialog } from "@/components/add-task-dialog"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import { TaskTable } from "@/components/task-table"
import {
  SettingsIcon,
  UserIcon,
  PlusIcon,
  GripVerticalIcon,
  CircleIcon,
  LoaderIcon,
  CircleCheckIcon,
  MoreHorizontalIcon,
  LayoutGridIcon,
  ListIcon,
  BotIcon,
  EyeIcon,
  XCircleIcon,
} from "lucide-react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loading } from "@/components/loading"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isLoading: authLoading, isAuthenticated } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [projectAgents, setProjectAgents] = useState<ProjectAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false)
  const [showEditTaskDialog, setShowEditTaskDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const loadingRef = useRef(false)

  const { tasks, isLoading: tasksLoading, refetch: refetchTasks } = useTasks(params.id as string)

  const loadProject = useCallback(async () => {
    try {
      const data = await projectApi.get(params.id as string)
      setProject(data)
      const memberData = await memberApi.list(params.id as string)
      setMembers(memberData)
      const agentData = await agentApi.listProjectAgents(params.id as string)
      setProjectAgents(agentData)
    } catch (error) {
      console.error('Failed to load project:', error)
      router.push('/projects')
    } finally {
      setIsLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    } else if (isAuthenticated && params.id && !loadingRef.current) {
      loadingRef.current = true
      loadProject()
    }
  }, [isAuthenticated, authLoading, params.id, router, loadProject])

  const handleAddSuccess = () => {
    loadProject()
  }

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
    } catch (error) {
      console.error('Failed to delete task:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await taskApi.update(task.id, { status: newStatus })
      refetchTasks()
    } catch (error) {
      console.error('Failed to update task status:', error)
    }
  }

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status)
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return <CircleIcon className="h-4 w-4 text-muted-foreground" />
      case 'in_progress':
        return <LoaderIcon className="h-4 w-4 text-blue-500 animate-spin" />
      case 'in_review':
        return <EyeIcon className="h-4 w-4 text-purple-500" />
      case 'done':
        return <CircleCheckIcon className="h-4 w-4 text-green-500" />
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: TaskPriority) => {
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

  const getRoleBadge = (role: ProjectMember['role']) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="text-xs">Admin</Badge>
      case 'member':
        return <Badge variant="secondary" className="text-xs">Member</Badge>
      case 'agent':
        return <Badge variant="outline" className="text-xs">Agent</Badge>
      case 'guest':
        return <Badge variant="outline" className="text-xs">Guest</Badge>
    }
  }

  const statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    { value: 'done', label: 'Done' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  const renderTaskMenu = (task: Task) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
          <MoreHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => handleEditTask(task)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {statusOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleStatusChange(task, option.value)}
                disabled={task.status === option.value}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
<DropdownMenuItem 
          variant="destructive"
          onClick={() => handleDeleteClick(task)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const renderMembersList = (isCompact: boolean = false) => {
    const totalMembers = members.length + projectAgents.length
    
    return (
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Members</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {totalMembers}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-3 pt-0">
          <div className={isCompact ? "max-h-[300px] pr-2 overflow-y-auto" : "h-[400px] pr-2 overflow-y-auto"}>
            <div className="space-y-2">
              {members.map((member) => (
                <Card
                  key={member.user_id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <GripVerticalIcon className="h-4 w-4 text-muted-foreground mt-0.5 cursor-grab" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-5 w-5 shrink-0">
                              <AvatarImage src={member.user?.avatar_url} />
                              <AvatarFallback className="text-[10px]">
                                {member.user?.username?.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-medium truncate">
                              {member.user?.username || 'Unknown'}
                            </p>
                          </div>
                          {getRoleBadge(member.role)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {projectAgents.map((pa) => (
                <Card
                  key={pa.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <GripVerticalIcon className="h-4 w-4 text-muted-foreground mt-0.5 cursor-grab" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-5 w-5 shrink-0 rounded-full bg-muted flex items-center justify-center">
                              <BotIcon className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium truncate">
                              {pa.agent?.name || 'Unknown Agent'}
                            </p>
                          </div>
                          {getRoleBadge(pa.role)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-4"
            onClick={() => setShowAddDialog(true)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (authLoading || isLoading) {
    return <Loading />
  }

  if (!isAuthenticated || !project) {
    return null
  }

  const columns = [
    { id: 'todo', title: 'To Do', status: 'todo' as TaskStatus },
    { id: 'in_progress', title: 'In Progress', status: 'in_progress' as TaskStatus },
    { id: 'in_review', title: 'In Review', status: 'in_review' as TaskStatus },
    { id: 'done', title: 'Done', status: 'done' as TaskStatus },
  ]

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
                        {columns.map((column) => (
                          <Card key={column.id} className="flex flex-col">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(column.status)}
                                  <CardTitle className="text-sm font-medium">
                                    {column.title}
                                  </CardTitle>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {getTasksByStatus(column.status).length}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-3 pt-0">
                              <div className="h-[400px] pr-2 overflow-y-auto">
                                <div className="space-y-2">
                                  {getTasksByStatus(column.status).map((task) => (
                                    <Card
                                      key={task.id}
                                      className="cursor-pointer hover:shadow-md transition-shadow"
                                    >
                                      <CardContent className="p-3">
                                        <div className="flex items-start gap-2">
                                          <GripVerticalIcon className="h-4 w-4 text-muted-foreground mt-0.5 cursor-grab" />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                              <p className="text-sm font-medium truncate">
                                                {task.title}
                                              </p>
                                              {renderTaskMenu(task)}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                              <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                              </span>
                                              {task.assignee && (
                                                <Avatar className="h-5 w-5">
                                                  <AvatarImage src={task.assignee.avatar_url} />
                                                  <AvatarFallback className="text-[10px]">
                                                    {task.assignee.username.charAt(0).toUpperCase()}
                                                  </AvatarFallback>
                                                </Avatar>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <div className="w-72 shrink-0 hidden xl:block self-start">
                        {renderMembersList()}
                      </div>
                    </div>
                    <div className="mt-4 xl:hidden">
                      {renderMembersList(true)}
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
        onSuccess={handleAddSuccess}
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
