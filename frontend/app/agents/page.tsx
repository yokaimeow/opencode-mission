"use client"

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useAgents } from '@/features/agents'
import { CreateAgentRequest, UpdateAgentRequest, Agent } from '@/lib/types'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AgentDialog } from "@/components/agent-dialog"
import { PlusIcon, EllipsisVerticalIcon, ChevronLeftIcon, ChevronRightIcon, BotIcon, CalendarIcon } from "lucide-react"
import { Loading } from "@/components/loading"

const AGENT_TYPE_LABELS: Record<string, string> = {
  assistant: 'Assistant',
  bot: 'Bot',
  webhook: 'Webhook',
  custom: 'Custom',
}

export default function AgentsPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const {
    agents,
    isLoading: agentsLoading,
    loadAgents,
    createAgent,
    updateAgent,
    deleteAgent,
  } = useAgents()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    } else if (isAuthenticated && !hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadAgents()
    }
  }, [isAuthenticated, authLoading, router, loadAgents])

  const handleCreateAgent = async (data: CreateAgentRequest | UpdateAgentRequest) => {
    setIsSubmitting(true)
    try {
      await createAgent(data as CreateAgentRequest)
      setIsDialogOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (agent: Agent) => {
    setSelectedAgent(agent)
    setIsEditDialogOpen(true)
  }

  const handleUpdateAgent = async (data: UpdateAgentRequest) => {
    if (!selectedAgent) return
    setIsSubmitting(true)
    try {
      await updateAgent(selectedAgent.id, data)
      setIsEditDialogOpen(false)
      setSelectedAgent(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (agent: Agent) => {
    setSelectedAgent(agent)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteAgent = async () => {
    if (!selectedAgent) return
    const success = await deleteAgent(selectedAgent.id)
    if (success) {
      setIsDeleteDialogOpen(false)
      setSelectedAgent(null)
    }
  }

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    )
  }

  const toggleAll = () => {
    if (selectedAgents.length === agents.length) {
      setSelectedAgents([])
    } else {
      setSelectedAgents(agents.map(a => a.id))
    }
  }

  if (authLoading || agentsLoading) {
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
          <SiteHeader title="Agents" />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="flex items-center justify-between px-4 lg:px-6">
                  <h2 className="text-lg font-semibold">All Agents</h2>
                  <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                    <PlusIcon />
                    <span className="hidden lg:inline">Create Agent</span>
                  </Button>

                  <AgentDialog
                    key="create-agent"
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSubmit={handleCreateAgent}
                    isLoading={isSubmitting}
                  />

                  <AgentDialog
                    key={selectedAgent?.id || 'edit-agent'}
                    open={isEditDialogOpen}
                    onOpenChange={(open) => {
                      setIsEditDialogOpen(open)
                      if (!open) setSelectedAgent(null)
                    }}
                    agent={selectedAgent}
                    onSubmit={handleUpdateAgent}
                    isLoading={isSubmitting}
                  />

                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Agent</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &ldquo;{selectedAgent?.name}&rdquo;? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedAgent(null)}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAgent}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {agents.length === 0 ? (
                  <div className="px-4 lg:px-6">
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-16">
                        <BotIcon className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No agents yet</h3>
                        <p className="text-muted-foreground mb-6 text-center">
                          Get started by creating your first agent
                        </p>
                        <Button onClick={() => setIsDialogOpen(true)}>
                          <PlusIcon />
                          Create Your First Agent
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <>
                    <div className="overflow-hidden rounded-lg border mx-4 lg:mx-6">
                      <Table>
                        <TableHeader className="sticky top-0 z-10 bg-muted">
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={selectedAgents.length === agents.length}
                                onCheckedChange={toggleAll}
                                aria-label="Select all"
                              />
                            </TableHead>
                            <TableHead>Agent Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {agents.map((agent) => (
                            <TableRow
                              key={agent.id}
                              data-state={selectedAgents.includes(agent.id) && "selected"}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selectedAgents.includes(agent.id)}
                                  onCheckedChange={() => toggleAgent(agent.id)}
                                  aria-label="Select row"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-primary/10 rounded">
                                    <BotIcon className="h-4 w-4 text-primary" />
                                  </div>
                                  <span className="font-medium">
                                    {agent.name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {AGENT_TYPE_LABELS[agent.type] || agent.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="px-1.5 text-muted-foreground">
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  {new Date(agent.created_at).toLocaleDateString()}
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
                                    <DropdownMenuItem onClick={() => handleEditClick(agent)}>
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() => handleDeleteClick(agent)}
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
                        {selectedAgents.length} of {agents.length} agent(s) selected.
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
                  </>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
