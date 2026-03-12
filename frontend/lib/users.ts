import { apiClient } from './apiClient';
import { User } from './types';

export const userApi = {
  search: async (query: string): Promise<User[]> => {
    if (!query.trim()) return [];
    const response = await apiClient.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data || [];
  },
};
