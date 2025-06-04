import type { RecommendationResponse } from "../services/api";

const RECOMMENDATIONS_KEY = "smartadvisor_recommendations";
const MAX_STORED_RECOMMENDATIONS = 10; // Keep last 10 recommendations

interface StoredRecommendation {
  id: string;
  data: RecommendationResponse;
  timestamp: number;
  title: string;
}

export const recommendationStorage = {
  // Store a recommendation in localStorage
  store: (recommendation: RecommendationResponse): void => {
    try {
      const stored = recommendationStorage.getAll();

      // Create title based on content
      const movieCount = recommendation.movies?.length || 0;
      const bookCount = recommendation.books?.length || 0;
      let title = "";

      if (movieCount > 0 && bookCount > 0) {
        title = `Movies & Books - ${movieCount + bookCount} recommendations`;
      } else if (movieCount > 0) {
        title = `Movies - ${movieCount} recommendation${movieCount > 1 ? "s" : ""}`;
      } else if (bookCount > 0) {
        title = `Books - ${bookCount} recommendation${bookCount > 1 ? "s" : ""}`;
      } else {
        title = "Recommendation Session";
      }

      const newItem: StoredRecommendation = {
        id: recommendation.id,
        data: recommendation,
        timestamp: Date.now(),
        title,
      };

      // Remove existing item with same ID if exists
      const filtered = stored.filter((item) => item.id !== recommendation.id);

      // Add new item to the beginning
      const updated = [newItem, ...filtered];

      // Keep only the most recent items
      const limited = updated.slice(0, MAX_STORED_RECOMMENDATIONS);

      localStorage.setItem(RECOMMENDATIONS_KEY, JSON.stringify(limited));

      console.log(
        "📱 Stored recommendation in localStorage:",
        recommendation.id,
      );
    } catch (error) {
      console.warn("Failed to store recommendation in localStorage:", error);
    }
  },

  // Get a specific recommendation by ID
  get: (id: string): RecommendationResponse | null => {
    try {
      const stored = recommendationStorage.getAll();
      const item = stored.find((item) => item.id === id);
      return item ? item.data : null;
    } catch (error) {
      console.warn("Failed to get recommendation from localStorage:", error);
      return null;
    }
  },

  // Get all stored recommendations
  getAll: (): StoredRecommendation[] => {
    try {
      const stored = localStorage.getItem(RECOMMENDATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Failed to get recommendations from localStorage:", error);
      return [];
    }
  },

  // Get recommendation history for display
  getHistory: (): Array<{ id: string; title: string; created_at: string }> => {
    try {
      const stored = recommendationStorage.getAll();
      return stored.map((item) => ({
        id: item.id,
        title: item.title,
        created_at: new Date(item.timestamp).toISOString(),
      }));
    } catch (error) {
      console.warn("Failed to get recommendation history:", error);
      return [];
    }
  },

  // Remove a specific recommendation
  remove: (id: string): void => {
    try {
      const stored = recommendationStorage.getAll();
      const filtered = stored.filter((item) => item.id !== id);
      localStorage.setItem(RECOMMENDATIONS_KEY, JSON.stringify(filtered));
      console.log("🗑️ Removed recommendation from localStorage:", id);
    } catch (error) {
      console.warn("Failed to remove recommendation from localStorage:", error);
    }
  },

  // Clear all stored recommendations
  clear: (): void => {
    try {
      localStorage.removeItem(RECOMMENDATIONS_KEY);
      console.log("🧹 Cleared all recommendations from localStorage");
    } catch (error) {
      console.warn("Failed to clear recommendations from localStorage:", error);
    }
  },

  // Check if we have a recommendation stored locally
  has: (id: string): boolean => {
    try {
      const stored = recommendationStorage.getAll();
      return stored.some((item) => item.id === id);
    } catch (error) {
      return false;
    }
  },
};

// Updated RecommendationContext.tsx to use localStorage as backup
export const useRecommendationContextUpdates = `
// Add this to your RecommendationContext.tsx

import { recommendationStorage } from '../utils/recommendationStorage';

// In submitAnswers function, add localStorage storage:
const submitAnswers = useCallback(async (): Promise<void> => {
  try {
    setLoading(true);
    setError(null);

    if (!state.currentSession.id) {
      throw new Error("No active recommendation session");
    }

    console.log("Submitting answers:", {
      sessionId: state.currentSession.id,
      answers: state.currentSession.answers,
    });

    const recommendations = await api.submitAnswers(
      state.currentSession.id,
      state.currentSession.answers
    );

    console.log("Received recommendations:", recommendations);

    // Validate recommendations response
    if (!recommendations || !recommendations.id) {
      throw new Error("Invalid recommendations response from server");
    }

    // Store in localStorage as backup
    recommendationStorage.store(recommendations);

    // Check if we actually got recommendations
    const hasMovies = recommendations.movies && recommendations.movies.length > 0;
    const hasBooks = recommendations.books && recommendations.books.length > 0;

    if (!hasMovies && !hasBooks) {
      console.warn("No recommendations returned, but continuing...");
    }

    setState((prev) => ({
      ...prev,
      recommendations,
      currentSession: {
        ...prev.currentSession,
        isComplete: true,
      },
      isLoading: false,
    }));
  } catch (error) {
    console.error("Error submitting answers:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to submit answers";
    setError(errorMessage);
    setLoading(false);
    throw error;
  }
}, [state.currentSession.id, state.currentSession.answers, setLoading, setError]);

// In loadRecommendation function, try localStorage first:
const loadRecommendation = useCallback(
  async (recommendationId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Try localStorage first
      const localRecommendation = recommendationStorage.get(recommendationId);
      if (localRecommendation) {
        console.log("📱 Loaded recommendation from localStorage:", recommendationId);

        setState((prev) => ({
          ...prev,
          recommendations: localRecommendation,
          currentSession: {
            id: recommendationId,
            type: localRecommendation.type,
            questions: localRecommendation.questions || [],
            currentQuestionIndex: localRecommendation.questions?.length || 0,
            answers: [],
            isComplete: true,
            selectedQuestionCount: localRecommendation.questions?.length || 5,
          },
          isLoading: false,
        }));
        return;
      }

      // Fallback to API if not in localStorage
      console.log("🌐 Loading recommendation from API:", recommendationId);
      const recommendations = await api.getRecommendation(recommendationId);

      // Store in localStorage for future use
      recommendationStorage.store(recommendations);

      setState((prev) => ({
        ...prev,
        recommendations,
        currentSession: {
          id: recommendationId,
          type: recommendations.type,
          questions: recommendations.questions || [],
          currentQuestionIndex: recommendations.questions?.length || 0,
          answers: [],
          isComplete: true,
          selectedQuestionCount: recommendations.questions?.length || 5,
        },
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load recommendation";
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  },
  [setLoading, setError]
);

// Add localStorage history to loadRecommendationHistory:
const loadRecommendationHistory = useCallback(async (): Promise<void> => {
  try {
    setLoading(true);
    setError(null);

    let history = [];

    // Try to get from API first (for authenticated users)
    try {
      const response = await api.getRecommendationHistory();
      history = response.items;
    } catch (error) {
      console.log("API history failed, using localStorage:", error);
      // Fallback to localStorage
      history = recommendationStorage.getHistory();
    }

    setState((prev) => ({
      ...prev,
      history,
      isLoading: false,
    }));
  } catch (error) {
    // Final fallback to localStorage only
    const history = recommendationStorage.getHistory();
    setState((prev) => ({
      ...prev,
      history,
      isLoading: false,
    }));
    console.log("Using localStorage history only");
  }
}, [setLoading, setError]);
`;
