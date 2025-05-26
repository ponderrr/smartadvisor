// client/src/services/api.ts
import axios from "axios";
import type { AxiosError, AxiosInstance } from "axios";

// Extend AxiosRequestConfig to include _retry
declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// Backend API Response Types
interface ApiResponse<T> {
  data?: T;
  message?: string;
  detail?: string;
}

// Authentication Types
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  username?: string;
  password: string;
  age?: number;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// User Types
interface User {
  id: string;
  email: string;
  username: string | null;
  age: number | null;
  profile_picture_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string | null;
}

// Recommendation Types
interface Question {
  id: string;
  text: string;
  order: number;
}

interface Answer {
  question_id: string;
  answer_text: string;
}

interface QuestionGenerationRequest {
  type: "movie" | "book" | "both";
  num_questions: number;
}

interface MovieRecommendation {
  id: string;
  title: string;
  rating?: number;
  age_rating?: string;
  description?: string;
  poster_path?: string;
  release_date?: string;
  runtime?: number;
  genres: string[];
}

interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  rating?: number;
  age_rating?: string;
  description?: string;
  poster_path?: string;
  published_date?: string;
  page_count?: number;
  publisher?: string;
  genres: string[];
}

interface RecommendationResponse {
  id: string;
  type: "movie" | "book" | "both";
  created_at: string;
  questions: Question[];
  movies: MovieRecommendation[];
  books: BookRecommendation[];
}

// Subscription Types
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  stripe_price_id?: string;
  features: string[];
}

interface SubscriptionStatus {
  id: string;
  tier: "free" | "premium-monthly" | "premium-annual";
  status: "active" | "canceled" | "past_due" | "trialing";
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  created_at: string;
}

class ApiService {
  private api: AxiosInstance;
  private authTokens: AuthTokens | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<AuthTokens> | null = null;

  constructor(baseURL: string) {
    this.api = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
    this.loadStoredTokens();
  }

  private setupInterceptors() {
    // Request interceptor for auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.authTokens?.access_token) {
          config.headers.Authorization = `Bearer ${this.authTokens.access_token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh and error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        // Check if this is a 401 error and we should attempt refresh
        if (
          error.response?.status === 401 &&
          this.authTokens?.refresh_token &&
          originalRequest &&
          !originalRequest._retry && // Prevent infinite loops
          !this.isRefreshTokenExpired() && // Don't try if refresh token is expired
          !originalRequest.url?.includes("/auth/refresh") && // Don't retry refresh endpoint
          !originalRequest.url?.includes("/auth/login") // Don't retry login endpoint
        ) {
          // Mark this request as a retry
          originalRequest._retry = true;

          try {
            // If we're already refreshing, wait for that to complete
            if (this.isRefreshing && this.refreshPromise) {
              console.log("⏳ Waiting for ongoing token refresh...");
              const newTokens = await this.refreshPromise;
              originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
              return this.api(originalRequest);
            }

            // Start refresh process
            console.log("🔄 Starting token refresh...");
            this.isRefreshing = true;
            this.refreshPromise = this.refreshToken(
              this.authTokens.refresh_token
            );

            const newTokens = await this.refreshPromise;
            this.setAuthTokens(newTokens);

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            console.error("🔄 Token refresh failed:", refreshError);
            // Clear tokens and let the user re-authenticate
            this.clearAuthTokens();
            // Don't throw here for login/register endpoints
            if (originalRequest.url?.includes("/auth/")) {
              return Promise.reject(this.handleError(error));
            }
            throw this.handleError(refreshError as AxiosError);
          } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private loadStoredTokens() {
    try {
      const storedTokens = localStorage.getItem("auth_tokens");
      if (storedTokens) {
        const tokens = JSON.parse(storedTokens);
        // Basic validation of token structure
        if (tokens.access_token && tokens.refresh_token && tokens.token_type) {
          this.authTokens = tokens;
          console.log("📱 Loaded stored tokens");
        } else {
          console.warn("🚫 Invalid token structure, clearing storage");
          localStorage.removeItem("auth_tokens");
        }
      }
    } catch (error) {
      console.error("Failed to parse stored tokens:", error);
      localStorage.removeItem("auth_tokens");
    }
  }

  private setAuthTokens(tokens: AuthTokens) {
    this.authTokens = tokens;
    localStorage.setItem("auth_tokens", JSON.stringify(tokens));
    console.log("💾 Tokens stored successfully");
  }

  private clearAuthTokens() {
    this.authTokens = null;
    localStorage.removeItem("auth_tokens");
    console.log("🗑️ Tokens cleared");
  }

  private isRefreshTokenExpired(): boolean {
    if (!this.authTokens?.refresh_token) return true;

    try {
      const payload = JSON.parse(
        atob(this.authTokens.refresh_token.split(".")[1])
      );
      const isExpired = payload.exp * 1000 < Date.now() + 60000; // 1 minute buffer
      if (isExpired) {
        console.log("⏰ Refresh token is expired");
      }
      return isExpired;
    } catch {
      console.log("🚫 Invalid refresh token format");
      return true;
    }
  }

  private async refreshToken(refreshToken: string): Promise<AuthTokens> {
    console.log("🔄 Attempting to refresh access token");

    // Create a new axios instance without interceptors for refresh
    const refreshApi = axios.create({
      baseURL: this.api.defaults.baseURL,
      timeout: 10000,
    });

    const response = await refreshApi.post<AuthTokens>("/auth/refresh", {
      refresh_token: refreshToken,
    });

    console.log("✅ Token refresh successful");
    return response.data;
  }

  private handleError(error: AxiosError): Error {
    if (error.response?.data) {
      const apiError = error.response.data as ApiResponse<any>;
      const message =
        apiError.detail || apiError.message || "An error occurred";
      console.error("🚫 API Error:", message);
      return new Error(message);
    } else if (error.request) {
      console.error("🌐 Network Error:", error.message);
      return new Error("Network error - please check your connection");
    } else {
      console.error("❌ Request Error:", error.message);
      return new Error("Request failed");
    }
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<User> {
    console.log("🔐 API: Attempting login");

    // Clear any existing tokens before login
    this.clearAuthTokens();

    const response = await this.api.post<any>("/auth/login", credentials);

    // Handle different response formats
    let tokens: AuthTokens;
    let user: User;

    if (response.data.access_token) {
      // Direct token response
      tokens = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        token_type: response.data.token_type || "bearer",
      };
      this.setAuthTokens(tokens);

      // Get user info
      user = await this.getCurrentUser();
    } else {
      throw new Error("Invalid login response format");
    }

    console.log("✅ API: Login successful");
    return user;
  }

  async register(data: RegisterData): Promise<User> {
    console.log("📝 API: Attempting registration");

    // Clear any existing tokens before registration
    this.clearAuthTokens();

    const response = await this.api.post<any>("/auth/register", data);

    // Handle registration response - may include tokens
    if (response.data.access_token) {
      const tokens: AuthTokens = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        token_type: response.data.token_type || "bearer",
      };
      this.setAuthTokens(tokens);
      return response.data.user;
    }

    console.log("✅ API: Registration successful");
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      console.log("👋 API: Logging out");
      if (this.authTokens) {
        await this.api.post("/auth/logout");
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Continue with cleanup even if API call fails
    } finally {
      this.clearAuthTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<User>("/users/me");
    return response.data;
  }

  async updateCurrentUser(data: Partial<User>): Promise<User> {
    const response = await this.api.put<User>("/users/me", data);
    return response.data;
  }

  // Recommendation methods
  async generateQuestions(request: QuestionGenerationRequest): Promise<{
    recommendation_id: string;
    questions: Question[];
  }> {
    console.log(
      "Sending request to /recommendations/generate-questions:",
      request
    );

    const response = await this.api.post<{
      recommendation_id: string;
      questions: Question[];
    }>("/recommendations/generate-questions", request);

    console.log("Response from generate-questions:", response.data);
    return response.data;
  }

  async submitAnswers(
    recommendationId: string,
    answers: Answer[]
  ): Promise<RecommendationResponse> {
    console.log("Submitting answers:", { recommendationId, answers });

    const response = await this.api.post<RecommendationResponse>(
      "/recommendations/submit-answers",
      {
        recommendation_id: recommendationId,
        answers,
      }
    );

    console.log("Response from submit-answers:", response.data);
    return response.data;
  }

  async getRecommendationHistory(
    skip = 0,
    limit = 10
  ): Promise<{
    items: Array<{
      id: string;
      title: string;
      created_at: string;
    }>;
    total: number;
    skip: number;
    limit: number;
  }> {
    const response = await this.api.get("/recommendations/history", {
      params: { skip, limit },
    });
    return response.data;
  }

  async getRecommendation(
    recommendationId: string
  ): Promise<RecommendationResponse> {
    const response = await this.api.get<RecommendationResponse>(
      `/recommendations/${recommendationId}`
    );
    return response.data;
  }

  // Subscription methods
  async getSubscriptionPlans(): Promise<{ plans: SubscriptionPlan[] }> {
    const response = await this.api.get<{ plans: SubscriptionPlan[] }>(
      "/subscriptions/plans"
    );
    return response.data;
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const response = await this.api.get<SubscriptionStatus>(
      "/subscriptions/status"
    );
    return response.data;
  }

  async createSubscription(priceId: string): Promise<{
    client_secret: string;
    subscription_id: string;
  }> {
    const response = await this.api.post<{
      client_secret: string;
      subscription_id: string;
    }>("/subscriptions/create", {
      price_id: priceId,
    });
    return response.data;
  }

  async cancelSubscription(): Promise<{ message: string }> {
    const response = await this.api.put<{ message: string }>(
      "/subscriptions/cancel"
    );
    return response.data;
  }

  async resumeSubscription(): Promise<{ message: string }> {
    const response = await this.api.put<{ message: string }>(
      "/subscriptions/resume"
    );
    return response.data;
  }

  // User preferences methods
  async getUserPreferences(): Promise<{
    id: string;
    user_id: string;
    accessibility_require_subtitles: boolean;
    accessibility_require_audio_description: boolean;
    accessibility_require_closed_captions: boolean;
    content_filters_exclude_violent_content: boolean;
    content_filters_exclude_sexual_content: boolean;
    language: string;
    created_at: string;
    updated_at?: string;
  }> {
    const response = await this.api.get("/preferences/");
    return response.data;
  }

  async updateUserPreferences(preferences: {
    accessibility_require_subtitles?: boolean;
    accessibility_require_audio_description?: boolean;
    accessibility_require_closed_captions?: boolean;
    content_filters_exclude_violent_content?: boolean;
    content_filters_exclude_sexual_content?: boolean;
    language?: string;
  }): Promise<any> {
    const response = await this.api.put("/preferences/", preferences);
    return response.data;
  }

  // Utility methods
  get isAuthenticated(): boolean {
    return !!(this.authTokens?.access_token && this.authTokens?.refresh_token);
  }

  get currentUser(): User | null {
    // This would need to be managed by a separate state management solution
    return null;
  }
}

// Create and export API instance
const api = new ApiService(
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
);

// Export the API instance
export default api;
export type {
  User,
  AuthTokens,
  Question,
  Answer,
  RecommendationResponse,
  MovieRecommendation,
  BookRecommendation,
  SubscriptionPlan,
  SubscriptionStatus,
  QuestionGenerationRequest,
};
