// Enhanced API service with proper backend integration
import axios from "axios";
import type { AxiosError, AxiosInstance } from "axios";

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

        if (
          error.response?.status === 401 &&
          this.authTokens?.refresh_token &&
          originalRequest
        ) {
          try {
            const newTokens = await this.refreshToken(
              this.authTokens.refresh_token
            );
            this.setAuthTokens(newTokens);
            originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            this.clearAuthTokens();
            window.location.href = "/signin";
            throw refreshError;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private loadStoredTokens() {
    const storedTokens = localStorage.getItem("auth_tokens");
    if (storedTokens) {
      try {
        this.authTokens = JSON.parse(storedTokens);
      } catch (error) {
        console.error("Failed to parse stored tokens:", error);
        localStorage.removeItem("auth_tokens");
      }
    }
  }

  private setAuthTokens(tokens: AuthTokens) {
    this.authTokens = tokens;
    localStorage.setItem("auth_tokens", JSON.stringify(tokens));
  }

  private clearAuthTokens() {
    this.authTokens = null;
    localStorage.removeItem("auth_tokens");
  }

  private async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await this.api.post<AuthTokens>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return response.data;
  }

  private handleError(error: AxiosError): Error {
    if (error.response?.data) {
      const apiError = error.response.data as ApiResponse<any>;
      return new Error(
        apiError.detail || apiError.message || "An error occurred"
      );
    } else if (error.request) {
      return new Error("Network error - please check your connection");
    } else {
      return new Error("Request failed");
    }
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await this.api.post<AuthTokens>(
      "/auth/login",
      credentials
    );
    this.setAuthTokens(response.data);
    const userResponse = await this.getCurrentUser();
    return userResponse;
  }

  async register(data: RegisterData): Promise<User> {
    const response = await this.api.post<User>("/auth/register", data);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post("/auth/logout");
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
  // Enhanced generateQuestions method for debugging
  // Add this to your api.ts file in the ApiService class

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
    return !!this.authTokens?.access_token;
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
