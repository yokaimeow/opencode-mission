'use client'

import { useState, useCallback } from 'react'
import { agentApi } from '@/lib/agents'
import { Agent, CreateAgentRequest, UpdateAgentRequest, AgentType } from '@/lib/types'

interface UseAgentsState {
  agents: Agent[]
  isLoading: boolean
  error: string | null
}

interface UseAgentsActions {
  loadAgents: () => Promise<void>
  createAgent: (data: CreateAgentRequest) => Promise<Agent | null>
  updateAgent: (id: string, data: UpdateAgentRequest) => Promise<Agent | null>
  deleteAgent: (id: string) => Promise<boolean>
  clearError: () => void
}

export function useAgents(): UseAgentsState & UseAgentsActions {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAgents = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await agentApi.list()
      setAgents(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load agents'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createAgent = useCallback(async (data: CreateAgentRequest): Promise<Agent | null> => {
    setError(null)
    try {
      const agent = await agentApi.create(data)
      setAgents((prev) => [...prev, agent])
      return agent
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create agent'
      setError(message)
      return null
    }
  }, [])

  const updateAgent = useCallback(async (id: string, data: UpdateAgentRequest): Promise<Agent | null> => {
    setError(null)
    try {
      const agent = await agentApi.update(id, data)
      setAgents((prev) => prev.map((a) => (a.id === id ? agent : a)))
      return agent
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update agent'
      setError(message)
      return null
    }
  }, [])

  const deleteAgent = useCallback(async (id: string): Promise<boolean> => {
    setError(null)
    try {
      await agentApi.delete(id)
      setAgents((prev) => prev.filter((a) => a.id !== id))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete agent'
      setError(message)
      return false
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    agents,
    isLoading,
    error,
    loadAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    clearError,
  }
}

export type { Agent, CreateAgentRequest, UpdateAgentRequest, AgentType }
