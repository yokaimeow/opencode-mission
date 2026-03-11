"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/features/auth'
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { UserIcon, MailIcon, CalendarIcon, HashIcon, PencilIcon } from "lucide-react"
import { Loading } from "@/components/loading"

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  
  const initialFormData = useMemo(() => ({
    username: user?.username || '',
    email: user?.email || '',
  }), [user])
  
  const [formData, setFormData] = useState(initialFormData)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    setFormData(initialFormData)
  }, [initialFormData])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Update profile:', formData)
    setIsEditDialogOpen(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (passwordData.new_password.length < 6) {
      setPasswordError('Password must be at least 6 characters long')
      return
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('Passwords do not match')
      return
    }

    setIsUpdatingPassword(true)
    try {
      await authApi.changePassword({
        new_password: passwordData.new_password,
      })
      setPasswordSuccess('Password changed successfully')
      setPasswordData({ new_password: '', confirm_password: '' })
      setTimeout(() => {
        setIsPasswordDialogOpen(false)
        setPasswordSuccess('')
      }, 2000)
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  if (authLoading) {
    return <Loading />
  }

  if (!isAuthenticated || !user) {
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
          <SiteHeader title="Settings" />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Account Settings</h1>
                    <p className="text-muted-foreground">
                      Manage your account information and preferences
                    </p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Your public profile information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <UserIcon className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <Label className="text-muted-foreground">Username</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="px-3 py-1">
                                {user.username}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Email</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <MailIcon className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm">{user.email}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => setIsEditDialogOpen(true)}>
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Account Details</CardTitle>
                      <CardDescription>
                        Technical information about your account
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground">User ID</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <HashIcon className="h-4 w-4 text-muted-foreground" />
                          <code className="text-xs bg-muted p-2 rounded font-mono flex-1">
                            {user.id}
                          </code>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Account Created</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="px-2 cursor-pointer">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                {new Date(user.created_at).toLocaleDateString()}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{new Date(user.created_at).toLocaleString()}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Last Updated</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="px-2 cursor-pointer">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                {new Date(user.updated_at).toLocaleDateString()}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{new Date(user.updated_at).toLocaleString()}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Security</CardTitle>
                      <CardDescription>
                        Manage your account security settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Password</p>
                          <p className="text-sm text-muted-foreground">
                            Change your account password
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
                          Change Password
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-destructive/50">
                    <CardHeader>
                      <CardTitle className="text-destructive">Danger Zone</CardTitle>
                      <CardDescription>
                        Irreversible actions for your account
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
                        <div>
                          <p className="font-medium">Delete Account</p>
                          <p className="text-sm text-muted-foreground">
                            Permanently delete your account and all associated data.
                          </p>
                        </div>
                        <Button variant="destructive" disabled>
                          Delete Account
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Account deletion functionality coming soon...
                      </p>
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
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information. Changes will be reflected immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username *</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="johndoe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed at this time
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled>
                Save Changes
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Profile update functionality coming soon...
            </p>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-5 mt-4">
            {passwordError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 text-sm text-green-600 bg-green-100 rounded-lg">
                {passwordSuccess}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password *</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                placeholder="Enter new password (min 6 characters)"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password *</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                placeholder="Confirm your new password"
                required
                minLength={6}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPasswordDialogOpen(false)
                  setPasswordError('')
                  setPasswordSuccess('')
                  setPasswordData({ new_password: '', confirm_password: '' })
                }}
                disabled={isUpdatingPassword}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
