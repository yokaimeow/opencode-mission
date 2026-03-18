import { getCookie, setCookie, deleteCookie } from './cookies';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: Record<string, string>;
}

interface ApiError {
  success: false;
  error: string;
  details?: Record<string, string>;
}

interface RefreshTokenRequest {
  refresh_token: string;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private refreshQueue: Array<() => void> = [];

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authorization headers
   * Reads token from httpOnly cookie for Authorization header
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Get token from httpOnly cookie for Authorization header
    const token = getCookie(ACCESS_TOKEN_KEY);

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    const refreshToken = getCookie(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken } as RefreshTokenRequest),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();

    if (data.success && data.data) {
      // Backend returns "token" not "access_token"
      const tokenData = data.data as { token?: string; access_token?: string; refresh_token: string; expires_in: number };
      const accessToken = tokenData.token || tokenData.access_token;

      if (!accessToken) {
        throw new Error('No access token in refresh response');
      }

      const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';

      // Update access token in cookie
      setCookie(ACCESS_TOKEN_KEY, accessToken, {
        maxAge: tokenData.expires_in || 3600,
        secure: isSecure,
        sameSite: 'lax',
      });

      // Update refresh token in cookie if returned
      if (tokenData.refresh_token) {
        setCookie(REFRESH_TOKEN_KEY, tokenData.refresh_token, {
          maxAge: 604800, // 7 days
          secure: isSecure,
          sameSite: 'lax',
        });
      }

      console.log('[ApiClient] Token refreshed successfully');
    } else {
      throw new Error('Invalid refresh response');
    }
  }

  /**
   * Handle 401 error with automatic token refresh
   */
  private async handle401Error(): Promise<void> {
    // If already refreshing, queue this request
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshQueue.push(() => {
          resolve();
        });
      });
    }

    // Start refresh process
    this.isRefreshing = true;

    try {
      await this.refreshAccessToken();

      // Refresh succeeded, process queued requests
      this.refreshQueue.forEach((callback) => callback());
      this.refreshQueue = [];
    } catch (_error) {
      // Refresh failed, clear tokens and reject queued requests
      console.error('[ApiClient] Token refresh failed, clearing tokens');
      deleteCookie(ACCESS_TOKEN_KEY);
      deleteCookie(REFRESH_TOKEN_KEY);

      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }

      this.refreshQueue = [];
      throw _error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Make HTTP request with automatic retry on 401
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const makeRequest = (): Promise<Response> => {
      return fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
    };

    let response = await makeRequest();

    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      try {
        await this.handle401Error();

        // Retry the original request with new token
        response = await makeRequest();
      } catch {
        throw {
          success: false,
          error: 'Authentication failed. Please login again.',
        } as ApiError;
      }
    }

    // Process response
    const data = await response.json();

    if (!response.ok) {
      throw {
        success: false,
        error: data.error || 'An error occurred',
        details: data.details,
      } as ApiError;
    }

    return data;
  }

  /**
   * Perform GET request
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint);
  }

  /**
   * Perform POST request
   */
  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body);
  }

  /**
   * Perform PUT request
   */
  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body);
  }

  /**
   * Perform PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, body);
  }

  /**
   * Perform DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types
export type { ApiResponse, ApiError };
