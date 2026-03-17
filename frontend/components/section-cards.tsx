"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon, FolderIcon, CheckCircle2Icon, BotIcon, ActivityIcon } from "lucide-react"
import { useProjects } from "@/hooks/useProjects"
import { useAgents } from "@/features/agents"
import type { Task } from "@/features/tasks"

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

interface SectionCardsProps {
  tasks?: Task[]
  tasksLoading?: boolean
}

export function SectionCards({ tasks = [], tasksLoading = false }: SectionCardsProps) {
  const { projects, isLoading } = useProjects()
  const { agents, isLoading: isLoadingAgents } = useAgents()

  const newThisWeek = useMemo(() => {
    const weekStart = getWeekStart(new Date())
    weekStart.setHours(0, 0, 0, 0)
    return projects.filter((p) => new Date(p.created_at) >= weekStart).length
  }, [projects])

  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'done').length
  }, [tasks])

  const totalTasks = tasks.length

  const successRate = useMemo(() => {
    if (totalTasks === 0) return 0
    return Math.round((completedTasks / totalTasks) * 100 * 10) / 10
  }, [completedTasks, totalTasks])

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Projects</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? '-' : projects.length}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              +{isLoading ? 0 : newThisWeek}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isLoading ? 'Loading...' : `${newThisWeek} new this week`}{" "}
            <FolderIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Total active projects
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Completed Tasks</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {tasksLoading ? '-' : completedTasks}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              {tasksLoading ? 0 : (totalTasks > 0 ? `+${Math.round((completedTasks / Math.max(totalTasks, 1)) * 100)}%` : '0%')}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {tasksLoading ? 'Loading...' : `${completedTasks} of ${totalTasks} completed`}{" "}
            <CheckCircle2Icon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Tasks completed this month
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>AI Agents Active</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoadingAgents ? '-' : agents.length}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ActivityIcon />
              {isLoadingAgents ? 'Loading' : (agents.length > 0 ? 'Active' : 'No agents')}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isLoadingAgents ? 'Loading...' : `${agents.length} agents configured`}{" "}
            <BotIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Currently available agents
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Success Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {tasksLoading ? '-' : `${successRate}%`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              {tasksLoading ? '-' : `${successRate}%`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {tasksLoading ? 'Loading...' : (successRate >= 50 ? 'On track' : 'Needs improvement')}{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Task completion success rate
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
