const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (typeof window !== 'undefined') {
      const token = getCookie('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async refreshToken(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.subscribeTokenRefresh((token) => {
          resolve(token);
        });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = getCookie('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const result = await response.json();
      const data = result.data || result;

      const accessExpires = new Date();
      accessExpires.setTime(accessExpires.getTime() + data.expires_in * 1000);
      document.cookie = `access_token=${data.token};expires=${accessExpires.toUTCString()};path=/;SameSite=Strict;Secure`;

      const refreshExpires = new Date();
      refreshExpires.setTime(refreshExpires.getTime() + 7 * 24 * 60 * 60 * 1000);
      document.cookie = `refresh_token=${data.refresh_token};expires=${refreshExpires.toUTCString()};path=/;SameSite=Strict;Secure`;

      this.onTokenRefreshed(data.token);
      this.isRefreshing = false;

      return data.token;
    } catch (error) {
      this.isRefreshing = false;
      document.cookie = 'access_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      document.cookie = 'refresh_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
      return null;
    }
  }

  private async handleResponse<T>(response: Response, request: () => Promise<T>): Promise<T> {
    if (response.status === 401) {
      const newToken = await this.refreshToken();
      if (newToken) {
        return request();
      }
      throw new Error('Authentication failed');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || error.message || 'Request failed');
    }

    const result = await response.json();
    return result.data || result;
  }

  async get<T>(endpoint: string): Promise<T> {
    const request = async (): Promise<T> => {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return this.handleResponse(response, request);
    };
    return request();
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const request = async (): Promise<T> => {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      return this.handleResponse(response, request);
    };
    return request();
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const request = async (): Promise<T> => {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      return this.handleResponse(response, request);
    };
    return request();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const request = async (): Promise<T> => {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return this.handleResponse(response, request);
    };
    return request();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
