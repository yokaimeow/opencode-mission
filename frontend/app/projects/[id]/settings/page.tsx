"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { projectApi } from '@/lib/projects'
import { memberApi } from '@/lib/members'
import { Project, ProjectMember } from '@/lib/types'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { ArrowLeftIcon, PencilIcon, TrashIcon, CalendarIcon, UserIcon } from "lucide-react"
import { Loading } from "@/components/loading"

export default function ProjectSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { isLoading: authLoading, isAuthenticated } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const loadingRef = useRef(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    } else if (isAuthenticated && params.id && !loadingRef.current) {
      loadingRef.current = true
      loadProject()
    }
  }, [isAuthenticated, authLoading, params.id, router])

  const loadProject = async () => {
    try {
      const data = await projectApi.get(params.id as string)
      setProject(data)
      setFormData({
        name: data.name,
        description: data.description || '',
      })
      const memberData = await memberApi.list(params.id as string)
      setMembers(memberData)
    } catch (error) {
      console.error('Failed to load project:', error)
      router.push('/projects')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return

    try {
      const updated = await projectApi.update(project.id, formData)
      setProject(updated)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const handleDeleteProject = async () => {
    if (!project) return

    try {
      await projectApi.delete(project.id)
      router.push('/projects')
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  if (authLoading || isLoading) {
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
          <SiteHeader title={`${project.name} - Settings`} />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <ArrowLeftIcon />
                    Back to Project
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Project Settings</h1>
                    <p className="text-muted-foreground">
                      Manage your project configuration and preferences
                    </p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Information</CardTitle>
                      <CardDescription>
                        Basic information about your project
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground">Name</Label>
                        <p className="text-lg font-medium">{project.name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Description</Label>
                        <p className="text-sm">
                          {project.description || 'No description provided'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Owner</Label>
                        {project.owner ? (
                          <div className="mt-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="px-2 cursor-pointer">
                                  <UserIcon className="h-3 w-3 mr-1" />
                                  {project.owner.username}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{project.owner.email}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        ) : (
                          <Badge variant="outline" className="px-2 mt-1">
                            <UserIcon className="h-3 w-3 mr-1" />
                            {project.owner_id}
                          </Badge>
                        )}
                      </div>
                      <Button onClick={() => setIsEditDialogOpen(true)}>
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Edit Project
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Metadata</CardTitle>
                      <CardDescription>
                        Project metadata and timestamps
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground">Created</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="px-2">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {new Date(project.created_at).toLocaleDateString()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            at {new Date(project.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Last Updated</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="px-2">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {new Date(project.updated_at).toLocaleDateString()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            at {new Date(project.updated_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Project ID</Label>
                        <code className="block text-xs bg-muted p-2 rounded mt-1 font-mono">
                          {project.id}
                        </code>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Project Members</CardTitle>
                      <CardDescription>
                        Manage who has access to this project
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 p-4 border rounded-lg">
                        {project.owner ? (
                          <>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{project.owner.username}</p>
                              <p className="text-sm text-muted-foreground">{project.owner.email}</p>
                            </div>
                            <Badge>Owner</Badge>
                          </>
                        ) : (
                          <p className="text-muted-foreground">Owner information not available</p>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-4">
                        Member management coming soon...
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-destructive/50">
                    <CardHeader>
                      <CardTitle className="text-destructive">Danger Zone</CardTitle>
                      <CardDescription>
                        Irreversible actions for this project
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
                        <div>
                          <p className="font-medium">Delete this project</p>
                          <p className="text-sm text-muted-foreground">
                            Once deleted, this project and all its tasks will be permanently removed.
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => setIsDeleteDialogOpen(true)}
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete Project
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

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
                onClick={() => setIsEditDialogOpen(false)}
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
              Are you sure you want to delete "{project.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
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
    </TooltipProvider>
  )
}
