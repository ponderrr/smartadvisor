// client/src/context/RecommendationContext.tsx
import React, { createContext, useState, useContext, useCallback } from "react";
import type { ReactNode } from "react";
import api, {
  type Question,
  type Answer,
  type RecommendationResponse,
  type QuestionGenerationRequest,
} from "../services/api";

interface RecommendationState {
  currentSession: {
    id: string | null;
    type: "movie" | "book" | "both" | null;
    questions: Question[];
    currentQuestionIndex: number;
    answers: Answer[];
    isComplete: boolean;
    selectedQuestionCount: number; // Add this to track user's choice
  };
  recommendations: RecommendationResponse | null;
  history: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

interface RecommendationContextType extends RecommendationState {
  startRecommendationSession: (
    type: "movie" | "book" | "both",
    numQuestions?: number
  ) => Promise<void>;
  answerQuestion: (answer: string) => void;
  goToPreviousQuestion: () => void;
  goToNextQuestion: () => void;
  submitAnswers: () => Promise<void>;
  loadRecommendation: (recommendationId: string) => Promise<void>;
  loadRecommendationHistory: () => Promise<void>;
  resetSession: () => void;
  clearError: () => void;
  getCurrentQuestion: () => Question | null;
  getCurrentAnswer: () => string;
  canGoNext: () => boolean;
  canGoBack: () => boolean;
  getProgress: () => number;
}

const RecommendationContext = createContext<
  RecommendationContextType | undefined
>(undefined);

interface RecommendationProviderProps {
  children: ReactNode;
}

export const RecommendationProvider: React.FC<RecommendationProviderProps> = ({
  children,
}) => {
  const [state, setState] = useState<RecommendationState>({
    currentSession: {
      id: null,
      type: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
      isComplete: false,
      selectedQuestionCount: 5, // Default value
    },
    recommendations: null,
    history: [],
    isLoading: false,
    error: null,
  });

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const startRecommendationSession = useCallback(
    async (
      type: "movie" | "book" | "both",
      numQuestions: number = 5
    ): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const request: QuestionGenerationRequest = {
          type,
          num_questions: numQuestions,
        };

        console.log("Starting recommendation session with:", request);

        const response = await api.generateQuestions(request);

        console.log("Generated questions response:", response);

        // Validate the response
        if (
          !response.recommendation_id ||
          !response.questions ||
          response.questions.length === 0
        ) {
          throw new Error(
            "Invalid response from server: missing questions or ID"
          );
        }

        setState((prev) => ({
          ...prev,
          currentSession: {
            id: response.recommendation_id,
            type,
            questions: response.questions,
            currentQuestionIndex: 0,
            answers: [],
            isComplete: false,
            selectedQuestionCount: numQuestions,
          },
          recommendations: null,
          isLoading: false,
        }));
      } catch (error) {
        console.error("Error starting recommendation session:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to generate questions";
        setError(errorMessage);
        setLoading(false);
        throw error;
      }
    },
    [setLoading, setError]
  );

  const answerQuestion = useCallback((answer: string) => {
    setState((prev) => {
      const currentQuestion =
        prev.currentSession.questions[prev.currentSession.currentQuestionIndex];
      if (!currentQuestion) return prev;

      const newAnswer: Answer = {
        question_id: currentQuestion.id,
        answer_text: answer,
      };

      // Update or add answer for current question
      const updatedAnswers = prev.currentSession.answers.filter(
        (a) => a.question_id !== currentQuestion.id
      );
      updatedAnswers.push(newAnswer);

      return {
        ...prev,
        currentSession: {
          ...prev.currentSession,
          answers: updatedAnswers,
        },
      };
    });
  }, []);

  const goToPreviousQuestion = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentSession: {
        ...prev.currentSession,
        currentQuestionIndex: Math.max(
          0,
          prev.currentSession.currentQuestionIndex - 1
        ),
      },
    }));
  }, []);

  const goToNextQuestion = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentSession.currentQuestionIndex + 1;
      const isComplete = nextIndex >= prev.currentSession.questions.length;

      return {
        ...prev,
        currentSession: {
          ...prev.currentSession,
          currentQuestionIndex: nextIndex,
          isComplete,
        },
      };
    });
  }, []);

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

      // Check if we actually got recommendations
      const hasMovies =
        recommendations.movies && recommendations.movies.length > 0;
      const hasBooks =
        recommendations.books && recommendations.books.length > 0;

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
  }, [
    state.currentSession.id,
    state.currentSession.answers,
    setLoading,
    setError,
  ]);

  const loadRecommendation = useCallback(
    async (recommendationId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const recommendations = await api.getRecommendation(recommendationId);

        setState((prev) => ({
          ...prev,
          recommendations,
          currentSession: {
            id: recommendationId,
            type: recommendations.type,
            questions: recommendations.questions || [],
            currentQuestionIndex: recommendations.questions?.length || 0,
            answers: [], // We don't get the original answers back
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

  const loadRecommendationHistory = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.getRecommendationHistory();

      setState((prev) => ({
        ...prev,
        history: response.items,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load recommendation history";
      setError(errorMessage);
      setLoading(false);
      // Don't throw here as this is often called in background
    }
  }, [setLoading, setError]);

  const resetSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentSession: {
        id: null,
        type: null,
        questions: [],
        currentQuestionIndex: 0,
        answers: [],
        isComplete: false,
        selectedQuestionCount: 5,
      },
      recommendations: null,
      error: null,
    }));
  }, []);

  // Helper functions for the context
  const getCurrentQuestion = useCallback((): Question | null => {
    const { questions, currentQuestionIndex } = state.currentSession;
    return questions[currentQuestionIndex] || null;
  }, [state.currentSession]);

  const getCurrentAnswer = useCallback((): string => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return "";

    const answer = state.currentSession.answers.find(
      (a) => a.question_id === currentQuestion.id
    );
    return answer?.answer_text || "";
  }, [getCurrentQuestion, state.currentSession.answers]);

  const canGoNext = useCallback((): boolean => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return false;

    const hasAnswer = state.currentSession.answers.some(
      (a) => a.question_id === currentQuestion.id && a.answer_text.trim()
    );
    return hasAnswer;
  }, [getCurrentQuestion, state.currentSession.answers]);

  const canGoBack = useCallback((): boolean => {
    return state.currentSession.currentQuestionIndex > 0;
  }, [state.currentSession.currentQuestionIndex]);

  const getProgress = useCallback((): number => {
    const total = state.currentSession.questions.length;
    const current = state.currentSession.currentQuestionIndex;
    return total > 0 ? (current / total) * 100 : 0;
  }, [state.currentSession]);

  const contextValue: RecommendationContextType = {
    ...state,
    startRecommendationSession,
    answerQuestion,
    goToPreviousQuestion,
    goToNextQuestion,
    submitAnswers,
    loadRecommendation,
    loadRecommendationHistory,
    resetSession,
    clearError,
    getCurrentQuestion,
    getCurrentAnswer,
    canGoNext,
    canGoBack,
    getProgress,
  };

  return (
    <RecommendationContext.Provider value={contextValue}>
      {children}
    </RecommendationContext.Provider>
  );
};

export const useRecommendations = (): RecommendationContextType => {
  const context = useContext(RecommendationContext);
  if (context === undefined) {
    throw new Error(
      "useRecommendations must be used within a RecommendationProvider"
    );
  }
  return context;
};

export default RecommendationContext;
