import { apiClient } from '@/lib/apiClient';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../types';

export const taskApi = {
  listByUser: async (): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>('/tasks');
    return response.data || [];
  },

  listByProject: async (projectId: string): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>(`/projects/${projectId}/tasks`);
    return response.data || [];
  },

  get: async (taskId: string): Promise<Task> => {
    const response = await apiClient.get<Task>(`/tasks/${taskId}`);
    if (!response.data) throw new Error('Failed to get task');
    return response.data;
  },

  create: async (projectId: string, data: CreateTaskRequest): Promise<Task> => {
    const response = await apiClient.post<Task>(`/projects/${projectId}/tasks`, data);
    if (!response.data) throw new Error('Failed to create task');
    return response.data;
  },

  update: async (taskId: string, data: UpdateTaskRequest): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${taskId}`, data);
    if (!response.data) throw new Error('Failed to update task');
    return response.data;
  },

  delete: async (taskId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}`);
  },
};
