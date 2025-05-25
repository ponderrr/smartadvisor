import axios, { AxiosError, AxiosInstance } from 'axios';

interface ApiConfig {
  baseURL: string;
  timeout?: number;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  username: string | null;
  profile_picture_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

class ApiService {
  private api: AxiosInstance;
  private authTokens: AuthTokens | null = null;

  constructor(config: ApiConfig) {
    this.api = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Add request interceptor for auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.authTokens?.access_token) {
          config.headers.Authorization = `Bearer ${this.authTokens.access_token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && this.authTokens?.refresh_token && originalRequest) {
          try {
            const newTokens = await this.refreshToken(this.authTokens.refresh_token);
            this.setAuthTokens(newTokens);
            originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            this.clearAuthTokens();
            throw refreshError;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private setAuthTokens(tokens: AuthTokens) {
    this.authTokens = tokens;
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  }

  private clearAuthTokens() {
    this.authTokens = null;
    localStorage.removeItem('auth_tokens');
  }

  public async initialize() {
    const storedTokens = localStorage.getItem('auth_tokens');
    if (storedTokens) {
      this.authTokens = JSON.parse(storedTokens);
    }
  }

  // Auth endpoints
  public async login(credentials: LoginCredentials): Promise<ApiResponse<AuthTokens>> {
    const response = await this.api.post<ApiResponse<AuthTokens>>('/auth/login', credentials);
    this.setAuthTokens(response.data.data);
    return response.data;
  }

  public async register(data: RegisterData): Promise<ApiResponse<User>> {
    const response = await this.api.post<ApiResponse<User>>('/auth/register', data);
    return response.data;
  }

  public async logout(): Promise<void> {
    await this.api.post('/auth/logout');
    this.clearAuthTokens();
  }

  private async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await this.api.post<ApiResponse<AuthTokens>>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data.data;
  }

  // User endpoints
  public async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await this.api.get<ApiResponse<User>>('/users/me');
    return response.data;
  }

  public async updateUser(userId: string, data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.api.patch<ApiResponse<User>>(`/users/${userId}`, data);
    return response.data;
  }

  // Questions endpoints
  public async submitQuestions(answers: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await this.api.post('/preferences', { answers });
    return response.data;
  }

  // Recommendations endpoints
  public async getRecommendations(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/recommendations');
    return response.data;
  }

  // Generic HTTP methods
  public async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.get<ApiResponse<T>>(url);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  public async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.post<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  public async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.put<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  public async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.patch<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  public async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.delete<ApiResponse<T>>(url);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Error handler
  private handleError(error: any) {
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.message || 'An error occurred');
    } else if (error.request) {
      // Request was made but no response
      throw new Error('No response from server');
    } else {
      // Something else went wrong
      throw new Error('Request failed');
    }
  }
}

// Create and export API instance
const api = new ApiService({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
});

export default api;