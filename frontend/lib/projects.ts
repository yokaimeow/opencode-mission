import { apiClient } from './apiClient';
import { Project, CreateProjectRequest, UpdateProjectRequest } from './types';

export const projectApi = {
  list: async (): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>('/projects');
    return response.data || [];
  },

  get: async (id: string): Promise<Project> => {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    if (!response.data) throw new Error('Project not found');
    return response.data;
  },

  create: async (data: CreateProjectRequest): Promise<Project> => {
    const response = await apiClient.post<Project>('/projects', data);
    if (!response.data) throw new Error('Failed to create project');
    return response.data;
  },

  update: async (id: string, data: UpdateProjectRequest): Promise<Project> => {
    const response = await apiClient.put<Project>(`/projects/${id}`, data);
    if (!response.data) throw new Error('Failed to update project');
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },
};
