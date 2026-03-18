"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserIcon, PlusIcon, GripVerticalIcon, BotIcon } from "lucide-react"
import type { ProjectMember, ProjectAgent, ProjectRole } from "@/lib/types"

interface MembersListProps {
  members: ProjectMember[]
  projectAgents: ProjectAgent[]
  isCompact?: boolean
  onAddMember: () => void
}

const getRoleBadge = (role: ProjectRole) => {
  switch (role) {
    case 'admin':
      return <Badge variant="default" className="text-xs">Admin</Badge>
    case 'member':
      return <Badge variant="secondary" className="text-xs">Member</Badge>
    case 'agent':
      return <Badge variant="outline" className="text-xs">Agent</Badge>
    case 'guest':
      return <Badge variant="outline" className="text-xs">Guest</Badge>
  }
}

export function MembersList({
  members,
  projectAgents,
  isCompact = false,
  onAddMember,
}: MembersListProps) {
  const totalMembers = members.length + projectAgents.length

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Members</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {totalMembers}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-3 pt-0">
        <div className={isCompact ? "max-h-[300px] pr-2 overflow-y-auto" : "h-[400px] pr-2 overflow-y-auto"}>
          <div className="space-y-2">
            {members.map((member) => (
              <Card
                key={member.user_id}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <GripVerticalIcon className="h-4 w-4 text-muted-foreground mt-0.5 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-5 w-5 shrink-0">
                            <AvatarImage src={member.user?.avatar_url} />
                            <AvatarFallback className="text-[10px]">
                              {member.user?.username?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium truncate">
                            {member.user?.username || 'Unknown'}
                          </p>
                        </div>
                        {getRoleBadge(member.role)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {projectAgents.map((pa) => (
              <Card
                key={pa.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <GripVerticalIcon className="h-4 w-4 text-muted-foreground mt-0.5 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-5 w-5 shrink-0 rounded-full bg-muted flex items-center justify-center">
                            <BotIcon className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium truncate">
                            {pa.agent?.name || 'Unknown Agent'}
                          </p>
                        </div>
                        {getRoleBadge(pa.role)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={onAddMember}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </CardContent>
    </Card>
  )
}
