"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EllipsisVerticalIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, CircleCheckIcon, LoaderIcon, EyeIcon, ClockIcon, XCircleIcon } from "lucide-react"
import { taskApi } from "@/features/tasks"
import type { Task, TaskStatus, TaskPriority } from "@/features/tasks"
import { useRouter } from "next/navigation"

const statusConfig: Record<TaskStatus, { icon: React.ReactNode; text: string; className: string }> = {
  todo: { icon: null, text: "To Do", className: "text-muted-foreground" },
  in_progress: { icon: <ClockIcon className="size-3" />, text: "In Progress", className: "text-blue-600 dark:text-blue-400" },
  in_review: { icon: <EyeIcon className="size-3" />, text: "In Review", className: "text-purple-600 dark:text-purple-400" },
  done: { icon: <CircleCheckIcon className="size-3 fill-green-500 dark:fill-green-400" />, text: "Done", className: "text-green-600 dark:text-green-400" },
  cancelled: { icon: <XCircleIcon className="size-3" />, text: "Cancelled", className: "text-gray-500" },
}

const priorityConfig: Record<TaskPriority, { text: string; className: string }> = {
  low: { text: "Low", className: "text-gray-600 dark:text-gray-400" },
  medium: { text: "Medium", className: "text-yellow-600 dark:text-yellow-400" },
  high: { text: "High", className: "text-orange-600 dark:text-orange-400" },
  urgent: { text: "Urgent", className: "text-red-600 dark:text-red-400" },
}

interface TaskTableProps {
  tasks?: Task[]
  isLoading?: boolean
  onDelete?: (taskId: string) => void
}

export function TaskTable({ tasks: externalTasks, isLoading: externalLoading, onDelete }: TaskTableProps) {
  const [selectedTasks, setSelectedTasks] = React.useState<string[]>([])
  const [deleting, setDeleting] = React.useState<string | null>(null)
  const [taskToDelete, setTaskToDelete] = React.useState<Task | null>(null)
  const router = useRouter()

  const tasks = externalTasks || []
  const isLoading = externalLoading || false

  const toggleTask = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const toggleAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([])
    } else {
      setSelectedTasks(tasks.map(t => t.id))
    }
  }

  const handleDelete = async (taskId: string) => {
    setDeleting(taskId)
    try {
      await taskApi.delete(taskId)
      if (onDelete) {
        onDelete(taskId)
      }
      setTaskToDelete(null)
    } catch (err) {
      console.error('Failed to delete task:', err)
    } finally {
      setDeleting(null)
    }
  }

  const confirmDelete = (task: Task) => {
    setTaskToDelete(task)
  }

  const getStatusBadge = (status: TaskStatus) => {
    const config = statusConfig[status] || statusConfig.todo
    return (
      <Badge variant="outline" className={`px-1.5 ${config.className}`}>
        {config.icon}
        {config.text}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: TaskPriority) => {
    const config = priorityConfig[priority] || priorityConfig.medium
    return (
      <span className={`text-sm font-medium ${config.className}`}>
        {config.text}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
        <p>No tasks yet</p>
        <Button variant="outline" size="sm" onClick={() => router.push('/projects')}>
          Go to Projects
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <h2 className="text-lg font-semibold">Recent Tasks</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/projects')}>
            <PlusIcon />
            <span className="hidden lg:inline">Add Task</span>
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border mx-4 lg:mx-6">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTasks.length === tasks.length && tasks.length > 0}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow
                key={task.id}
                data-state={selectedTasks.includes(task.id) && "selected"}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedTasks.includes(task.id)}
                    onCheckedChange={() => toggleTask(task.id)}
                    aria-label="Select row"
                  />
                </TableCell>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{getStatusBadge(task.status)}</TableCell>
                <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                <TableCell>
                  {task.assignee ? task.assignee.username : '-'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                        size="icon"
                        disabled={deleting === task.id}
                      >
                        {deleting === task.id ? (
                          <LoaderIcon className="size-4 animate-spin" />
                        ) : (
                          <EllipsisVerticalIcon />
                        )}
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem onClick={() => router.push(`/projects/${task.project_id}`)}>
                        View Project
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        variant="destructive"
                        onClick={() => confirmDelete(task)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="text-sm text-muted-foreground">
          {selectedTasks.length} of {tasks.length} task(s) selected.
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-8">
            <ChevronLeftIcon />
            <span className="sr-only">Previous page</span>
          </Button>
          <Button variant="outline" size="icon" className="size-8">
            <ChevronRightIcon />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>

      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => taskToDelete && handleDelete(taskToDelete.id)}
              disabled={deleting === taskToDelete?.id}
            >
              {deleting === taskToDelete?.id ? (
                <LoaderIcon className="size-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}