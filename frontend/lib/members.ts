import { apiClient } from './apiClient';
import { ProjectMember, AddMemberRequest, UpdateMemberRoleRequest } from './types';

export const memberApi = {
  list: async (projectId: string): Promise<ProjectMember[]> => {
    const response = await apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`);
    return response.data || [];
  },

  add: async (projectId: string, data: AddMemberRequest): Promise<ProjectMember> => {
    const response = await apiClient.post<ProjectMember>(`/projects/${projectId}/members`, data);
    if (!response.data) throw new Error('Failed to add member');
    return response.data;
  },

  updateRole: async (projectId: string, userId: string, data: UpdateMemberRoleRequest): Promise<ProjectMember> => {
    const response = await apiClient.patch<ProjectMember>(`/projects/${projectId}/members/${userId}`, data);
    if (!response.data) throw new Error('Failed to update member role');
    return response.data;
  },

  remove: async (projectId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  },
};
