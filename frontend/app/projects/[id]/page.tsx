"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { projectApi } from '@/lib/projects'
import { Project } from '@/lib/types'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loading } from "@/components/loading"

// Mock tasks data - will be replaced with real API
interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high'
  assignee?: {
    id: string
    username: string
    avatar_url?: string
  }
  created_at: string
}

const mockTasks: Task[] = [
  { id: '1', title: 'Setup project structure', status: 'done', priority: 'high', created_at: '2024-01-15' },
  { id: '2', title: 'Implement authentication', status: 'done', priority: 'high', created_at: '2024-01-16' },
  { id: '3', title: 'Create dashboard UI', status: 'in_progress', priority: 'medium', created_at: '2024-01-17' },
  { id: '4', title: 'Add task management', status: 'in_progress', priority: 'high', created_at: '2024-01-18' },
  { id: '5', title: 'Write documentation', status: 'todo', priority: 'low', created_at: '2024-01-19' },
  { id: '6', title: 'Setup CI/CD pipeline', status: 'todo', priority: 'medium', created_at: '2024-01-20' },
  { id: '7', title: 'Add unit tests', status: 'todo', priority: 'high', created_at: '2024-01-21' },
  { id: '8', title: 'Code review: API endpoints', status: 'review', priority: 'high', created_at: '2024-01-22' },
  { id: '9', title: 'Security audit review', status: 'review', priority: 'medium', created_at: '2024-01-23' },
]

// Mock members data
interface Member {
  id: string
  username: string
  email: string
  avatar_url?: string
  role: 'owner' | 'admin' | 'member'
}

const mockMembers: Member[] = [
  { id: '1', username: 'john_doe', email: 'john@example.com', role: 'owner' },
  { id: '2', username: 'jane_smith', email: 'jane@example.com', role: 'admin' },
  { id: '3', username: 'bob_wilson', email: 'bob@example.com', role: 'member' },
]

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isLoading: authLoading, isAuthenticated } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tasks] = useState<Task[]>(mockTasks)
  const [members] = useState<Member[]>(mockMembers)
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    } else if (isAuthenticated && params.id) {
      loadProject()
    }
  }, [isAuthenticated, authLoading, params.id, router])

  const loadProject = async () => {
    try {
      const data = await projectApi.get(params.id as string)
      setProject(data)
    } catch (error) {
      console.error('Failed to load project:', error)
      router.push('/projects')
    } finally {
      setIsLoading(false)
    }
  }

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status)
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return <CircleIcon className="h-4 w-4 text-muted-foreground" />
      case 'in_progress':
        return <LoaderIcon className="h-4 w-4 text-blue-500 animate-spin" />
      case 'review':
        return <CircleIcon className="h-4 w-4 text-orange-500 fill-orange-500" />
      case 'done':
        return <CircleCheckIcon className="h-4 w-4 text-green-500" />
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-500'
      case 'medium':
        return 'text-yellow-500'
      case 'low':
        return 'text-gray-500'
    }
  }

  const getStatusBadge = (status: Task['status']) => {
    const config = {
      todo: { label: 'To Do', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
      review: { label: 'Review', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
      done: { label: 'Done', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    }
    const { label, className } = config[status]
    return <Badge variant="outline" className={className}>{label}</Badge>
  }

  const getRoleBadge = (role: Member['role']) => {
    switch (role) {
      case 'owner':
        return <Badge variant="default" className="text-xs">Owner</Badge>
      case 'admin':
        return <Badge variant="secondary" className="text-xs">Admin</Badge>
      case 'member':
        return <Badge variant="outline" className="text-xs">Member</Badge>
    }
  }

  if (authLoading || isLoading) {
    return <Loading />
  }

  if (!isAuthenticated || !project) {
    return null
  }

  const columns = [
    { id: 'todo', title: 'To Do', status: 'todo' as const },
    { id: 'in_progress', title: 'In Progress', status: 'in_progress' as const },
    { id: 'review', title: 'Review', status: 'review' as const },
    { id: 'done', title: 'Done', status: 'done' as const },
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
                  <Button size="sm">
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
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                                    <MoreHorizontalIcon className="h-4 w-4" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                  <DropdownMenuItem>Edit</DropdownMenuItem>
                                                  <DropdownMenuItem>Change Status</DropdownMenuItem>
                                                  <DropdownMenuItem>Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
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
                      <Card className="w-72 shrink-0 hidden xl:flex flex-col self-start">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-muted-foreground" />
                              <CardTitle className="text-sm font-medium">Members</CardTitle>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {members.length}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-3 pt-0">
                          <div className="h-[400px] pr-2 overflow-y-auto">
                            <div className="space-y-2">
                              {members.map((member) => (
                                <Card
                                  key={member.id}
                                  className="cursor-pointer hover:shadow-md transition-shadow"
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-center gap-2">
                                      <GripVerticalIcon className="h-4 w-4 text-muted-foreground mt-0.5 cursor-grab" />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <Avatar className="h-5 w-5 shrink-0">
                                              <AvatarImage src={member.avatar_url} />
                                              <AvatarFallback className="text-[10px]">
                                                {member.username.charAt(0).toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                            <p className="text-sm font-medium truncate">
                                              {member.username}
                                            </p>
                                          </div>
                                          {getRoleBadge(member.role)}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full mt-4">
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Invite Member
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="mt-4 xl:hidden">
                      <Card className="flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-muted-foreground" />
                              <CardTitle className="text-sm font-medium">Members</CardTitle>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {members.length}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-3 pt-0">
                          <div className="max-h-[300px] pr-2 overflow-y-auto">
                            <div className="space-y-2">
                              {members.map((member) => (
                                <Card
                                  key={member.id}
                                  className="cursor-pointer hover:shadow-md transition-shadow"
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-center gap-2">
                                      <GripVerticalIcon className="h-4 w-4 text-muted-foreground mt-0.5 cursor-grab" />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <Avatar className="h-5 w-5 shrink-0">
                                              <AvatarImage src={member.avatar_url} />
                                              <AvatarFallback className="text-[10px]">
                                                {member.username.charAt(0).toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                            <p className="text-sm font-medium truncate">
                                              {member.username}
                                            </p>
                                          </div>
                                          {getRoleBadge(member.role)}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full mt-4">
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Invite Member
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                    </>
                  ) : (
                    <div className="overflow-hidden rounded-lg border">
                      <Table>
                        <TableHeader className="sticky top-0 z-10 bg-muted">
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox aria-label="Select all" />
                            </TableHead>
                            <TableHead>Task</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Assignee</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tasks.map((task) => (
                            <TableRow key={task.id} className="cursor-pointer">
                              <TableCell>
                                <Checkbox aria-label="Select row" />
                              </TableCell>
                              <TableCell className="font-medium">{task.title}</TableCell>
                              <TableCell>{getStatusBadge(task.status)}</TableCell>
                              <TableCell>
                                <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                </span>
                              </TableCell>
                              <TableCell>
                                {task.assignee ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={task.assignee.avatar_url} />
                                      <AvatarFallback className="text-xs">
                                        {task.assignee.username.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{task.assignee.username}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Unassigned</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(task.created_at).toLocaleDateString()}
                                </span>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                                      size="icon"
                                    >
                                      <MoreHorizontalIcon />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-32">
                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                    <DropdownMenuItem>Change Status</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
