import React, { createContext, useState, useContext, ReactNode } from "react";
import api, {
  Question,
  Answer,
  RecommendationResponse,
  QuestionGenerationRequest,
} from "../services/api";

interface RecommendationState {
  currentSession: {
    id: string | null;
    type: "movie" | "book" | "both" | null;
    questions: Question[];
    currentQuestionIndex: number;
    answers: Answer[];
    isComplete: boolean;
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
    numQuestions?: number,
  ) => Promise<void>;
  answerQuestion: (answer: string) => void;
  goToPreviousQuestion: () => void;
  submitAnswers: () => Promise<void>;
  loadRecommendation: (recommendationId: string) => Promise<void>;
  loadRecommendationHistory: () => Promise<void>;
  resetSession: () => void;
  clearError: () => void;
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
    },
    recommendations: null,
    history: [],
    isLoading: false,
    error: null,
  });

  const setLoading = (isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  };

  const clearError = () => {
    setError(null);
  };

  const startRecommendationSession = async (
    type: "movie" | "book" | "both",
    numQuestions: number = 5,
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const request: QuestionGenerationRequest = {
        type,
        num_questions: numQuestions,
      };

      const response = await api.generateQuestions(request);

      setState((prev) => ({
        ...prev,
        currentSession: {
          id: response.recommendation_id,
          type,
          questions: response.questions,
          currentQuestionIndex: 0,
          answers: [],
          isComplete: false,
        },
        recommendations: null,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate questions";
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const answerQuestion = (answer: string) => {
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
        (a) => a.question_id !== currentQuestion.id,
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
  };

  const goToPreviousQuestion = () => {
    setState((prev) => ({
      ...prev,
      currentSession: {
        ...prev.currentSession,
        currentQuestionIndex: Math.max(
          0,
          prev.currentSession.currentQuestionIndex - 1,
        ),
      },
    }));
  };

  const goToNextQuestion = () => {
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
  };

  const submitAnswers = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!state.currentSession.id) {
        throw new Error("No active recommendation session");
      }

      const recommendations = await api.submitAnswers(
        state.currentSession.id,
        state.currentSession.answers,
      );

      setState((prev) => ({
        ...prev,
        recommendations,
        currentSession: {
          ...prev.currentSession,
          isComplete: true,
        },
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit answers";
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendation = async (
    recommendationId: string,
  ): Promise<void> => {
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
          questions: recommendations.questions,
          currentQuestionIndex: recommendations.questions.length,
          answers: [], // We don't get the original answers back
          isComplete: true,
        },
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load recommendation";
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendationHistory = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.getRecommendationHistory();

      setState((prev) => ({
        ...prev,
        history: response.items,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load recommendation history";
      setError(errorMessage);
      // Don't throw here as this is often called in background
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    setState((prev) => ({
      ...prev,
      currentSession: {
        id: null,
        type: null,
        questions: [],
        currentQuestionIndex: 0,
        answers: [],
        isComplete: false,
      },
      recommendations: null,
      error: null,
    }));
  };

  // Helper functions for the context
  const getCurrentQuestion = (): Question | null => {
    const { questions, currentQuestionIndex } = state.currentSession;
    return questions[currentQuestionIndex] || null;
  };

  const getCurrentAnswer = (): string => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return "";

    const answer = state.currentSession.answers.find(
      (a) => a.question_id === currentQuestion.id,
    );
    return answer?.answer_text || "";
  };

  const canGoNext = (): boolean => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return false;

    const hasAnswer = state.currentSession.answers.some(
      (a) => a.question_id === currentQuestion.id && a.answer_text.trim(),
    );
    return hasAnswer;
  };

  const canGoBack = (): boolean => {
    return state.currentSession.currentQuestionIndex > 0;
  };

  const getProgress = (): number => {
    const total = state.currentSession.questions.length;
    const current = state.currentSession.currentQuestionIndex;
    return total > 0 ? (current / total) * 100 : 0;
  };

  const contextValue: RecommendationContextType = {
    ...state,
    startRecommendationSession,
    answerQuestion,
    goToPreviousQuestion,
    submitAnswers,
    loadRecommendation,
    loadRecommendationHistory,
    resetSession,
    clearError,

    // Helper methods (add these to the interface above)
    getCurrentQuestion,
    getCurrentAnswer,
    canGoNext,
    canGoBack,
    getProgress,
    goToNextQuestion,
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
      "useRecommendations must be used within a RecommendationProvider",
    );
  }
  return context;
};

export default RecommendationContext;
