import { apiClient } from '@/lib/apiClient';
import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  TokensResponse,
  UserResponse,
  VerifyTokenResponse,
  User,
  Tokens,
} from '../types';

export const authApi = {
  async register(credentials: RegisterRequest): Promise<TokensResponse> {
    const response = await apiClient.post<Tokens>('/auth/register', credentials);
    return response as TokensResponse;
  },

  async login(credentials: LoginRequest): Promise<TokensResponse> {
    const response = await apiClient.post<Tokens>('/auth/login', credentials);
    return response as TokensResponse;
  },

  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await apiClient.post('/auth/logout', { refresh_token: refreshToken });
    } else {
      await apiClient.post('/auth/logout');
    }
  },

  async refreshToken(refreshToken: string): Promise<TokensResponse> {
    const request: RefreshTokenRequest = {
      refresh_token: refreshToken,
    };
    const response = await apiClient.post<Tokens>('/auth/refresh', request);
    return response as TokensResponse;
  },

  async verifyToken(): Promise<VerifyTokenResponse> {
    const response = await apiClient.get<{ user_id: string }>('/auth/verify');
    return response as VerifyTokenResponse;
  },

  async getCurrentUser(): Promise<UserResponse> {
    const response = await apiClient.get<User>('/auth/me');
    return response as UserResponse;
  },
};
