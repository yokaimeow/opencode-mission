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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EllipsisVerticalIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, CircleCheckIcon, LoaderIcon } from "lucide-react"

interface Task {
  id: number
  title: string
  status: "todo" | "in_progress" | "done"
  priority: "low" | "medium" | "high"
  assignee: string
  project: string
}

const mockTasks: Task[] = [
  { id: 1, title: "Implement user authentication", status: "done", priority: "high", assignee: "Alice", project: "Frontend" },
  { id: 2, title: "Design dashboard layout", status: "in_progress", priority: "medium", assignee: "Bob", project: "UI/UX" },
  { id: 3, title: "Setup database migrations", status: "todo", priority: "high", assignee: "Charlie", project: "Backend" },
  { id: 4, title: "Write API documentation", status: "in_progress", priority: "low", assignee: "Diana", project: "Docs" },
  { id: 5, title: "Implement task filtering", status: "todo", priority: "medium", assignee: "Eve", project: "Frontend" },
]

export function TaskTable() {
  const [tasks, setTasks] = React.useState<Task[]>(mockTasks)
  const [selectedTasks, setSelectedTasks] = React.useState<number[]>([])

  const toggleTask = (taskId: number) => {
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

  const getStatusBadge = (status: Task["status"]) => {
    const variants = {
      todo: { variant: "outline" as const, icon: null, text: "To Do" },
      in_progress: { variant: "outline" as const, icon: <LoaderIcon className="size-3" />, text: "In Progress" },
      done: { variant: "outline" as const, icon: <CircleCheckIcon className="size-3 fill-green-500 dark:fill-green-400" />, text: "Done" },
    }
    const config = variants[status]
    return (
      <Badge variant={config.variant} className="px-1.5 text-muted-foreground">
        {config.icon}
        {config.text}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: Task["priority"]) => {
    const colors = {
      low: "text-gray-600 dark:text-gray-400",
      medium: "text-yellow-600 dark:text-yellow-400",
      high: "text-red-600 dark:text-red-400",
    }
    return (
      <span className={`text-sm font-medium ${colors[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <h2 className="text-lg font-semibold">Recent Tasks</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
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
                  checked={selectedTasks.length === tasks.length}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Project</TableHead>
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
                <TableCell>{task.assignee}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="px-1.5 text-muted-foreground">
                    {task.project}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                        size="icon"
                      >
                        <EllipsisVerticalIcon />
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
    </div>
  )
}
