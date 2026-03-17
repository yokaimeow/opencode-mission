"use client"

import { useState, useEffect } from 'react'
import { Loader2Icon, BotIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { taskApi } from '@/features/tasks'
import type { Task, TaskStatus, TaskPriority } from '@/features/tasks'
import type { ProjectMember, ProjectAgent } from '@/lib/types'

interface EditTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  members: ProjectMember[]
  projectAgents: ProjectAgent[]
  onSuccess?: () => void
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export function EditTaskDialog({ 
  open, 
  onOpenChange, 
  task,
  members, 
  projectAgents, 
  onSuccess 
}: EditTaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    assignee_id: '_unassigned',
    due_date: '',
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assignee_id: task.assignee_id || '_unassigned',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
      })
      setError(null)
    }
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.title.trim() || !task) {
      setError('Title is required')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      await taskApi.update(task.id, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        priority: form.priority,
        assignee_id: form.assignee_id && form.assignee_id !== '_unassigned' ? form.assignee_id : undefined,
        due_date: form.due_date ? `${form.due_date}T23:59:59Z` : undefined,
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('Failed to update task:', err)
      setError(err instanceof Error ? err.message : 'Failed to update task')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return
    
    setIsDeleting(true)
    try {
      await taskApi.delete(task.id)
      setShowDeleteConfirm(false)
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('Failed to delete task:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!task) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter task title..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value as TaskStatus })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(value) => setForm({ ...form, priority: value as TaskPriority })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                value={form.assignee_id}
                onValueChange={(value) => setForm({ ...form, assignee_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_unassigned">Unassigned</SelectItem>
                  
                  {members.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Users
                      </div>
                      {members.map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={member.user?.avatar_url} />
                              <AvatarFallback className="text-[10px]">
                                {member.user?.username?.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span>{member.user?.username || 'Unknown'}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  
                  {projectAgents.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Agents
                      </div>
                      {projectAgents.map((pa) => (
                        <SelectItem key={pa.id} value={pa.id}>
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                              <BotIcon className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <span>{pa.agent?.name || 'Unknown Agent'}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {members.length === 0 && projectAgents.length === 0 && (
                    <SelectItem value="_none" disabled>
                      No members available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
              >
                Delete
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
                  Save
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
