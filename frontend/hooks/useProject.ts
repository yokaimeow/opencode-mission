import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { projectApi } from '@/lib/projects'
import { memberApi } from '@/lib/members'
import { agentApi } from '@/lib/agents'
import { showError } from '@/lib/toast'
import { Project, ProjectMember, ProjectAgent } from '@/lib/types'

interface UseProjectResult {
  project: Project | null
  members: ProjectMember[]
  projectAgents: ProjectAgent[]
  isLoading: boolean
  refetch: () => void
}

export function useProject(projectId: string | null): UseProjectResult {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [projectAgents, setProjectAgents] = useState<ProjectAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const loadingRef = useRef(false)

  const loadProject = useCallback(async () => {
    if (!projectId) return

    try {
      const data = await projectApi.get(projectId)
      setProject(data)
      const memberData = await memberApi.list(projectId)
      setMembers(memberData)
      const agentData = await agentApi.listProjectAgents(projectId)
      setProjectAgents(agentData)
    } catch (error) {
      showError(error)
      router.push('/projects')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, router])

  useEffect(() => {
    if (projectId && !loadingRef.current) {
      loadingRef.current = true
      loadProject()
    }
  }, [projectId, loadProject])

  const refetch = useCallback(() => {
    loadingRef.current = false
    setIsLoading(true)
    loadProject()
  }, [loadProject])

  return {
    project,
    members,
    projectAgents,
    isLoading,
    refetch,
  }
}
