'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agentApi } from '@/lib/agents'
import { showError, showSuccess } from '@/lib/toast'
import { Agent, CreateAgentRequest, UpdateAgentRequest } from '@/lib/types'

interface UseAgentsReturn {
  agents: Agent[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createAgent: (data: CreateAgentRequest) => Promise<Agent | null>
  updateAgent: (id: string, data: UpdateAgentRequest) => Promise<Agent | null>
  deleteAgent: (id: string) => Promise<boolean>
}

export function useAgents(): UseAgentsReturn {
  const queryClient = useQueryClient()

  const { data: agents = [], isLoading, error, refetch } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateAgentRequest) => agentApi.create(data),
    onSuccess: (newAgent) => {
      queryClient.setQueryData<Agent[]>(['agents'], (old) => 
        old ? [...old, newAgent] : [newAgent]
      )
      showSuccess('Agent created');
    },
    onError: (error) => showError(error),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgentRequest }) => 
      agentApi.update(id, data),
    onSuccess: (updatedAgent) => {
      queryClient.setQueryData<Agent[]>(['agents'], (old) =>
        old ? old.map((a) => (a.id === updatedAgent.id ? updatedAgent : a)) : [updatedAgent]
      )
      showSuccess('Agent updated');
    },
    onError: (error) => showError(error),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<Agent[]>(['agents'], (old) =>
        old ? old.filter((a) => a.id !== deletedId) : []
      )
      showSuccess('Agent deleted');
    },
    onError: (error) => showError(error),
  })

  const createAgent = async (data: CreateAgentRequest): Promise<Agent | null> => {
    try {
      return await createMutation.mutateAsync(data)
    } catch {
      return null
    }
  }

  const updateAgent = async (id: string, data: UpdateAgentRequest): Promise<Agent | null> => {
    try {
      return await updateMutation.mutateAsync({ id, data })
    } catch {
      return null
    }
  }

  const deleteAgent = async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id)
      return true
    } catch {
      return false
    }
  }

  return {
    agents,
    isLoading,
    error: error?.message ?? null,
    refetch: async () => {
      await refetch()
    },
    createAgent,
    updateAgent,
    deleteAgent,
  }
}

export type { Agent, CreateAgentRequest, UpdateAgentRequest }
