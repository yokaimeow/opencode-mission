import { apiClient } from './apiClient';
import { Agent, CreateAgentRequest, UpdateAgentRequest, ProjectAgent, AddProjectAgentRequest } from './types';

export const agentApi = {
  list: async (): Promise<Agent[]> => {
    const response = await apiClient.get<Agent[]>('/agents');
    return response.data || [];
  },

  get: async (agentId: string): Promise<Agent> => {
    const response = await apiClient.get<Agent>(`/agents/${agentId}`);
    if (!response.data) throw new Error('Failed to get agent');
    return response.data;
  },

  create: async (data: CreateAgentRequest): Promise<Agent> => {
    const response = await apiClient.post<Agent>('/agents', data);
    if (!response.data) throw new Error('Failed to create agent');
    return response.data;
  },

  update: async (agentId: string, data: UpdateAgentRequest): Promise<Agent> => {
    const response = await apiClient.patch<Agent>(`/agents/${agentId}`, data);
    if (!response.data) throw new Error('Failed to update agent');
    return response.data;
  },

  delete: async (agentId: string): Promise<void> => {
    await apiClient.delete(`/agents/${agentId}`);
  },

  listProjectAgents: async (projectId: string): Promise<ProjectAgent[]> => {
    const response = await apiClient.get<ProjectAgent[]>(`/projects/${projectId}/agents`);
    return response.data || [];
  },

  addToProject: async (projectId: string, data: AddProjectAgentRequest): Promise<ProjectAgent> => {
    const response = await apiClient.post<ProjectAgent>(`/projects/${projectId}/agents`, data);
    if (!response.data) throw new Error('Failed to add agent to project');
    return response.data;
  },

  removeFromProject: async (projectId: string, agentId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/agents/${agentId}`);
  },
};
