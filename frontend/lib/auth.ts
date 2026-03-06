import { apiClient } from './api';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from './types';

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    if (typeof window !== 'undefined') {
      this.setTokens(response);
    }
    return response;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    if (typeof window !== 'undefined') {
      this.setTokens(response);
    }
    return response;
  },

  setTokens(response: AuthResponse): void {
    const accessExpires = new Date();
    accessExpires.setTime(accessExpires.getTime() + response.expires_in * 1000);
    document.cookie = `access_token=${response.token};expires=${accessExpires.toUTCString()};path=/;SameSite=Strict;Secure`;

    const refreshExpires = new Date();
    refreshExpires.setTime(refreshExpires.getTime() + 7 * 24 * 60 * 60 * 1000);
    document.cookie = `refresh_token=${response.refresh_token};expires=${refreshExpires.toUTCString()};path=/;SameSite=Strict;Secure`;

    localStorage.setItem('user', JSON.stringify(response.user));
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getStoredRefreshToken();
      await apiClient.post('/auth/logout', refreshToken ? { refresh_token: refreshToken } : {});
    } finally {
      if (typeof window !== 'undefined') {
        document.cookie = 'access_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        document.cookie = 'refresh_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        localStorage.removeItem('user');
      }
    }
  },

  async refreshToken(): Promise<AuthResponse | null> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await apiClient.post<AuthResponse>('/auth/refresh', {
        refresh_token: refreshToken,
      });
      if (typeof window !== 'undefined') {
        this.setTokens(response);
      }
      return response;
    } catch {
      this.logout();
      return null;
    }
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  },

  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; access_token=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  },

  getStoredRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; refresh_token=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  },

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  },
};
