"use client"

import { useState, useEffect, useRef } from 'react'
import { UserIcon, BotIcon, Loader2Icon, SearchIcon } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { agentApi } from '@/lib/agents'
import { memberApi } from '@/lib/members'
import { userApi } from '@/lib/users'
import { showError, showSuccess } from '@/lib/toast'
import { Agent, User, ProjectRole } from '@/lib/types'

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onSuccess?: () => void
}

export function AddMemberDialog({ open, onOpenChange, projectId, onSuccess }: AddMemberDialogProps) {
  const [activeTab, setActiveTab] = useState('user')
  const [isLoading, setIsLoading] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<User[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [userForm, setUserForm] = useState({
    userId: '',
    role: 'member' as ProjectRole,
  })
  
  const [agentForm, setAgentForm] = useState({
    agentId: '',
    role: 'member' as ProjectRole,
  })

  useEffect(() => {
    if (open && activeTab === 'agent') {
      loadAgents()
    }
  }, [open, activeTab])

  useEffect(() => {
    if (!open) {
      setUserSearchQuery('')
      setUserSearchResults([])
      setSelectedUser(null)
      setUserForm({ userId: '', role: 'member' })
      setAgentForm({ agentId: '', role: 'member' })
    }
  }, [open])

  const loadAgents = async () => {
    try {
      const data = await agentApi.list()
      setAgents(data)
    } catch (error) {
      showError(error)
    }
  }

  const handleUserSearch = async (query: string) => {
    setUserSearchQuery(query)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    if (!query.trim()) {
      setUserSearchResults([])
      return
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingUsers(true)
      try {
        const results = await userApi.search(query)
        setUserSearchResults(results)
      } catch (error) {
        showError(error)
        setUserSearchResults([])
      } finally {
        setIsSearchingUsers(false)
      }
    }, 300)
  }

  const handleSelectUser = (user: User) => {
    setUserForm({ ...userForm, userId: user.id })
    setSelectedUser(user)
    setUserSearchQuery('')
    setUserSearchResults([])
  }

  const handleAddUser = async () => {
    if (!userForm.userId) return
    
    setIsLoading(true)
    try {
      await memberApi.add(projectId, {
        user_id: userForm.userId,
        role: userForm.role,
      })
      setUserForm({ userId: '', role: 'member' })
      onOpenChange(false)
      onSuccess?.()
      showSuccess('Member added')
    } catch (error) {
      showError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAgent = async () => {
    if (!agentForm.agentId) return
    
    setIsLoading(true)
    try {
      await agentApi.addToProject(projectId, {
        agent_id: agentForm.agentId,
        role: agentForm.role,
      })
      setAgentForm({ agentId: '', role: 'member' })
      onOpenChange(false)
      onSuccess?.()
      showSuccess('Agent added')
    } catch (error) {
      showError(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Project</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="user" className="flex-1">
              <UserIcon className="h-4 w-4 mr-2" />
              User
            </TabsTrigger>
            <TabsTrigger value="agent" className="flex-1">
              <BotIcon className="h-4 w-4 mr-2" />
              Agent
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="user" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Users</label>
              <div className="relative">
                <Input
                  placeholder="Search by email, username, or ID..."
                  value={userSearchQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                />
                <SearchIcon className="absolute right-3 top-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              
              {isSearchingUsers && (
                <div className="flex items-center justify-center py-4">
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Searching...</span>
                </div>
              )}
              
              {!isSearchingUsers && userSearchResults.length > 0 && (
                <div className="border rounded-md max-h-[200px] overflow-y-auto">
                  {userSearchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left"
                      onClick={() => handleSelectUser(user)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {user.username?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {!isSearchingUsers && userSearchQuery && userSearchResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
              )}
            </div>
            
            {userForm.userId && selectedUser && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedUser.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {selectedUser.username?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedUser.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setUserForm({ ...userForm, userId: '' })
                    setSelectedUser(null)
                  }}
                >
                  Change
                </button>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={userForm.role}
                onValueChange={(value) => setUserForm({ ...userForm, role: value as ProjectRole })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleAddUser}
              disabled={!userForm.userId || isLoading}
            >
              {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin mr-2" /> : null}
              Add User
            </Button>
          </TabsContent>
          
          <TabsContent value="agent" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Agent</label>
              <Select
                value={agentForm.agentId}
                onValueChange={(value) => setAgentForm({ ...agentForm, agentId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <BotIcon className="h-4 w-4" />
                        <span>{agent.name}</span>
                        <span className="text-xs text-muted-foreground">({agent.type})</span>
                      </div>
                    </SelectItem>
                  ))}
                  {agents.length === 0 && (
                    <SelectItem value="_none" disabled>
                      No agents available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={agentForm.role}
                onValueChange={(value) => setAgentForm({ ...agentForm, role: value as ProjectRole })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleAddAgent}
              disabled={!agentForm.agentId || isLoading}
            >
              {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Agent
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
