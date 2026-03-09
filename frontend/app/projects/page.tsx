"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { projectApi } from '@/lib/projects'
import { Project } from '@/lib/types'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusIcon, FolderIcon } from "lucide-react"

export default function ProjectsPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    } else if (isAuthenticated) {
      loadProjects()
    }
  }, [isAuthenticated, authLoading, router])

  const loadProjects = async () => {
    try {
      const data = await projectApi.list()
      setProjects(data)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await projectApi.create(formData)
      setIsDialogOpen(false)
      setFormData({ name: '', description: '' })
      loadProjects()
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
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
          <SiteHeader title="Projects" />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="flex items-center justify-between px-4 lg:px-6">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage and track your mission projects
                    </p>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusIcon />
                        Create Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                      <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        <DialogDescription>
                          Set up a new project to manage your mission tasks and track progress.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateProject} className="space-y-5 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Project Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="My Awesome Project"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe your project goals and objectives..."
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">
                            Create Project
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {projects.length === 0 ? (
                  <div className="px-4 lg:px-6">
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-16">
                        <FolderIcon className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                        <p className="text-muted-foreground mb-6 text-center">
                          Get started by creating your first project
                        </p>
                        <Button onClick={() => setIsDialogOpen(true)}>
                          <PlusIcon />
                          Create Your First Project
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 lg:px-6">
                    {projects.map((project) => (
                      <Card
                        key={project.id}
                        className="hover:shadow-lg transition-all duration-300 cursor-pointer"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <FolderIcon className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg font-semibold">
                                  {project.name}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  Created {new Date(project.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="line-clamp-2">
                            {project.description || 'No description provided'}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    ))}
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
