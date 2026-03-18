"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CircleIcon,
  LoaderIcon,
  CircleCheckIcon,
  EyeIcon,
  XCircleIcon,
} from "lucide-react"
import type { Task, TaskStatus, TaskPriority } from "@/features/tasks"
import { TaskCard } from "./task-card"

interface BoardColumnProps {
  title: string
  status: TaskStatus
  tasks: Task[]
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
  getPriorityColor: (priority: TaskPriority) => string
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

export function BoardColumn({
  title,
  status,
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  getPriorityColor,
}: BoardColumnProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-3 pt-0">
        <div className="h-[400px] pr-2 overflow-y-auto">
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onStatusChange={onStatusChange}
                getPriorityColor={getPriorityColor}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
