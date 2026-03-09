'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCookie, setCookie, deleteCookie } from '@/lib/cookies';
import { authApi } from '../api/authApi';
import type {
  AuthContextValue,
  AuthState,
  LoginRequest,
  RegisterRequest,
  User,
  Tokens,
} from '../types';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

function extractTokens(data: Tokens): { access_token: string; refresh_token: string; expires_in: number } {
  return {
    access_token: (data as unknown as { token?: string; access_token?: string }).token || data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  const fetchUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error('[Auth] Failed to fetch user:', error);
    }
    return null;
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = getCookie(ACCESS_TOKEN_KEY);
        const refreshTokenValue = getCookie(REFRESH_TOKEN_KEY);

        if (accessToken) {
          try {
            await authApi.verifyToken();
            const userData = await fetchUser();
            if (userData) {
              setState({
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
              const { access_token, refresh_token: new_refresh_token, expires_in } = extractTokens(response.data);

              const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
              setCookie(ACCESS_TOKEN_KEY, access_token, {
                maxAge: expires_in || 3600,
                secure: isSecure,
                sameSite: 'lax',
              });

              if (new_refresh_token) {
                setCookie(REFRESH_TOKEN_KEY, new_refresh_token, {
                  maxAge: 604800,
                  secure: isSecure,
                  sameSite: 'lax',
                });
              }

              const userData = await fetchUser();
              setState({
                user: userData,
                isLoading: false,
                isAuthenticated: !!userData,
              });
              return;
            }
          } catch {
            deleteCookie(ACCESS_TOKEN_KEY);
            deleteCookie(REFRESH_TOKEN_KEY);
          }
        }

        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      } catch (error) {
        console.error('[Auth] Init error:', error);
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    initializeAuth();
  }, [fetchUser]);

  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await authApi.login(credentials);

    if (response.success && response.data) {
      const { access_token, refresh_token, expires_in } = extractTokens(response.data);

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

      const userData = await fetchUser();
      setState({
        user: userData,
        isLoading: false,
        isAuthenticated: true,
      });
    }
  }, [fetchUser]);

  const register = useCallback(async (credentials: RegisterRequest) => {
    const response = await authApi.register(credentials);

    if (response.success && response.data) {
      const { access_token, refresh_token, expires_in } = extractTokens(response.data);

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

      const userData = await fetchUser();
      setState({
        user: userData,
        isLoading: false,
        isAuthenticated: true,
      });
    }
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = getCookie(REFRESH_TOKEN_KEY);
      await authApi.logout(refreshToken || undefined);
    } finally {
      deleteCookie(ACCESS_TOKEN_KEY);
      deleteCookie(REFRESH_TOKEN_KEY);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  const refreshToken = useCallback(async () => {
    const refreshTk = getCookie(REFRESH_TOKEN_KEY);
    if (!refreshTk) {
      throw new Error('No refresh token');
    }

    const response = await authApi.refreshToken(refreshTk);
    if (response.success && response.data) {
      const { access_token, refresh_token: new_refresh_token, expires_in } = extractTokens(response.data);

      const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
      setCookie(ACCESS_TOKEN_KEY, access_token, {
        maxAge: expires_in || 3600,
        secure: isSecure,
        sameSite: 'lax',
      });

      if (new_refresh_token) {
        setCookie(REFRESH_TOKEN_KEY, new_refresh_token, {
          maxAge: 604800,
          secure: isSecure,
          sameSite: 'lax',
        });
      }

      const userData = await fetchUser();
      setState({
        user: userData,
        isLoading: false,
        isAuthenticated: true,
      });
    }
  }, [fetchUser]);

  const verifyToken = useCallback(async () => {
    await authApi.verifyToken();
  }, []);

  const refetchUser = useCallback(async () => {
    const userData = await fetchUser();
    setState((prev) => ({
      ...prev,
      user: userData,
    }));
  }, [fetchUser]);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    verifyToken,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
