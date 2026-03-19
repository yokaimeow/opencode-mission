"use client"

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { projectApi } from '@/lib/projects'
import { showError, showSuccess } from '@/lib/toast'
import { Project } from '@/lib/types'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { PlusIcon, EllipsisVerticalIcon, ChevronLeftIcon, ChevronRightIcon, FolderIcon, CalendarIcon } from "lucide-react"
import { Loading } from "@/components/loading"

export default function ProjectsPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    } else if (isAuthenticated && !hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadProjects()
    }
  }, [isAuthenticated, authLoading, router])

  const loadProjects = async () => {
    try {
      const data = await projectApi.list()
      setProjects(data)
    } catch (error) {
      showError(error)
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
      showSuccess('Project created')
    } catch (error) {
      showError(error)
    }
  }

  const handleEditClick = (project: Project) => {
    setSelectedProject(project)
    setFormData({
      name: project.name,
      description: project.description || '',
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return

    try {
      await projectApi.update(selectedProject.id, formData)
      setIsEditDialogOpen(false)
      setSelectedProject(null)
      setFormData({ name: '', description: '' })
      loadProjects()
      showSuccess('Project updated')
    } catch (error) {
      showError(error)
    }
  }

  const handleDeleteClick = (project: Project) => {
    setSelectedProject(project)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteProject = async () => {
    if (!selectedProject) return

    try {
      await projectApi.delete(selectedProject.id)
      setIsDeleteDialogOpen(false)
      setSelectedProject(null)
      loadProjects()
      showSuccess('Project deleted')
    } catch (error) {
      showError(error)
    }
  }

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const toggleAll = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([])
    } else {
      setSelectedProjects(projects.map(p => p.id))
    }
  }

  if (authLoading || isLoading) {
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
          <SiteHeader title="Projects" />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="flex items-center justify-between px-4 lg:px-6">
                  <h2 className="text-lg font-semibold">Recent Projects</h2>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <PlusIcon />
                        <span className="hidden lg:inline">Create Project</span>
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

                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="sm:max-w-[525px]">
                      <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription>
                          Update your project details.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleUpdateProject} className="space-y-5 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-name">Project Name *</Label>
                          <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="My Awesome Project"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-description">Description</Label>
                          <Textarea
                            id="edit-description"
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
                            onClick={() => {
                              setIsEditDialogOpen(false)
                              setSelectedProject(null)
                              setFormData({ name: '', description: '' })
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">
                            Update Project
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &ldquo;{selectedProject?.name}&rdquo;? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedProject(null)}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteProject}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
                  <>
                    <div className="overflow-hidden rounded-lg border mx-4 lg:mx-6">
                      <Table>
                        <TableHeader className="sticky top-0 z-10 bg-muted">
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={selectedProjects.length === projects.length}
                                onCheckedChange={toggleAll}
                                aria-label="Select all"
                              />
                            </TableHead>
                            <TableHead>Project Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projects.map((project) => (
                            <TableRow
                              key={project.id}
                              data-state={selectedProjects.includes(project.id) && "selected"}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selectedProjects.includes(project.id)}
                                  onCheckedChange={() => toggleProject(project.id)}
                                  aria-label="Select row"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-primary/10 rounded">
                                    <FolderIcon className="h-4 w-4 text-primary" />
                                  </div>
                                  <span
                                    className="font-medium cursor-pointer hover:text-primary"
                                    onClick={() => router.push(`/projects/${project.id}`)}
                                  >
                                    {project.name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {project.description || 'No description provided'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="px-1.5 text-muted-foreground">
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  {new Date(project.created_at).toLocaleDateString()}
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
                                    <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}`)}>
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}/settings`)}>
                                      Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditClick(project)}>
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() => handleDeleteClick(project)}
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
                        {selectedProjects.length} of {projects.length} project(s) selected.
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
