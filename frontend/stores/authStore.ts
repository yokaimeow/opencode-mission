'use client';

import { create } from 'zustand';
import { getCookie, setCookie, deleteCookie } from '@/lib/cookies';
import { authApi } from '@/features/auth/api/authApi';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  Tokens,
} from '@/features/auth/types';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  initialize: () => Promise<void>;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (credentials: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  verifyToken: () => Promise<void>;
  refetchUser: () => Promise<void>;
  fetchCurrentUser: () => Promise<User | null>;
}

type AuthStore = AuthState & AuthActions;

function extractTokens(data: Tokens): { access_token: string; refresh_token: string; expires_in: number } {
  return {
    access_token: (data as unknown as { token?: string; access_token?: string }).token || data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

function setTokenCookies(access_token: string, refresh_token: string, expires_in: number) {
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';

  setCookie(ACCESS_TOKEN_KEY, access_token, {
    maxAge: expires_in || 3600,
    secure: isSecure,
    sameSite: 'lax',
  });

  setCookie(REFRESH_TOKEN_KEY, refresh_token, {
    maxAge: 604800,
    secure: isSecure,
    sameSite: 'lax',
  });
}

function clearTokenCookies() {
  deleteCookie(ACCESS_TOKEN_KEY);
  deleteCookie(REFRESH_TOKEN_KEY);
}

let initializationPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    if (initializationPromise) {
      return initializationPromise;
    }

    initializationPromise = (async () => {
      try {
        const accessToken = getCookie(ACCESS_TOKEN_KEY);
        const refreshTokenValue = getCookie(REFRESH_TOKEN_KEY);

        if (accessToken) {
          try {
            await authApi.verifyToken();
            const userData = await get().fetchCurrentUser();
            if (userData) {
              set({
                user: userData,
                isLoading: false,
                isAuthenticated: true,
              });
              return;
            }
          } catch {
            console.log('[Auth] Access token expired, attempting refresh');
          }
        }

        if (refreshTokenValue) {
          try {
            const response = await authApi.refreshToken(refreshTokenValue);
            if (response.success && response.data) {
              const { access_token, refresh_token, expires_in } = extractTokens(response.data);
              setTokenCookies(access_token, refresh_token, expires_in);

              const userData = await get().fetchCurrentUser();
              set({
                user: userData,
                isLoading: false,
                isAuthenticated: !!userData,
              });
              return;
            }
          } catch {
            clearTokenCookies();
          }
        }

        set({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      } catch (error) {
        console.error('[Auth] Init error:', error);
        set({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    })();

    return initializationPromise;
  },

  login: async (credentials: LoginRequest) => {
    const response = await authApi.login(credentials);

    if (response.success && response.data) {
      const { access_token, refresh_token, expires_in } = extractTokens(response.data);
      setTokenCookies(access_token, refresh_token, expires_in);

      const userData = await get().fetchCurrentUser();
      set({
        user: userData,
        isLoading: false,
        isAuthenticated: true,
      });
    }
  },

  register: async (credentials: RegisterRequest) => {
    const response = await authApi.register(credentials);

    if (response.success && response.data) {
      const { access_token, refresh_token, expires_in } = extractTokens(response.data);
      setTokenCookies(access_token, refresh_token, expires_in);

      const userData = await get().fetchCurrentUser();
      set({
        user: userData,
        isLoading: false,
        isAuthenticated: true,
      });
    }
  },

  logout: async () => {
    try {
      const refreshToken = getCookie(REFRESH_TOKEN_KEY);
      await authApi.logout(refreshToken || undefined);
    } finally {
      clearTokenCookies();
      set({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  },

  refreshToken: async () => {
    const refreshTk = getCookie(REFRESH_TOKEN_KEY);
    if (!refreshTk) {
      throw new Error('No refresh token');
    }

    const response = await authApi.refreshToken(refreshTk);
    if (response.success && response.data) {
      const { access_token, refresh_token, expires_in } = extractTokens(response.data);
      setTokenCookies(access_token, refresh_token, expires_in);

      const userData = await get().fetchCurrentUser();
      set({
        user: userData,
        isLoading: false,
        isAuthenticated: true,
      });
    }
  },

  verifyToken: async () => {
    await authApi.verifyToken();
  },

  refetchUser: async () => {
    const userData = await get().fetchCurrentUser();
    set({ user: userData });
  },

  fetchCurrentUser: async () => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error('[Auth] Failed to fetch user:', error);
    }
    return null;
  },
}));

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const verifyToken = useAuthStore((state) => state.verifyToken);
  const refetchUser = useAuthStore((state) => state.refetchUser);
  const initialize = useAuthStore((state) => state.initialize);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    verifyToken,
    refetchUser,
    initialize,
  };
};
