// client/src/context/SubscriptionContext.tsx
import React, { createContext, useState, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import api from "../services/api";
import type {
  SubscriptionPlan,
  SubscriptionStatus,
  QuestionLimits,
} from "../services/api";

interface SubscriptionState {
  currentSubscription: SubscriptionStatus | null;
  availablePlans: SubscriptionPlan[];
  questionLimits: QuestionLimits | null;
  isLoading: boolean;
  error: string | null;
  isProcessingPayment: boolean;
}

interface SubscriptionContextType extends SubscriptionState {
  loadSubscriptionData: () => Promise<void>;
  loadQuestionLimits: () => Promise<void>;
  createSubscription: (
    priceId: string
  ) => Promise<{ client_secret: string; subscription_id: string }>;
  cancelSubscription: () => Promise<void>;
  resumeSubscription: () => Promise<void>;
  clearError: () => void;
  getMaxQuestions: () => number;
  getMinQuestions: () => number;
  canSelectQuestions: (count: number) => boolean;
  hasFeature: (feature: string) => boolean;
  isFeatureLimited: () => boolean;

  // Additional helper methods
  getPlanByTier: (tier: string) => SubscriptionPlan | undefined;
  getCurrentPlan: () => SubscriptionPlan | undefined;
  getUpgradePlans: () => SubscriptionPlan[];
  getSubscriptionStatusText: () => string;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
}) => {
  const { isAuthenticated, user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    currentSubscription: null,
    availablePlans: [],
    questionLimits: null,
    isLoading: false,
    error: null,
    isProcessingPayment: false,
  });

  const setLoading = (isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  };

  const setProcessingPayment = (isProcessingPayment: boolean) => {
    setState((prev) => ({ ...prev, isProcessingPayment }));
  };

  const clearError = () => {
    setError(null);
  };

  // Load subscription data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSubscriptionData();
      loadQuestionLimits();
    } else {
      // Reset subscription data when user logs out
      setState((prev) => ({
        ...prev,
        currentSubscription: null,
        availablePlans: [],
        questionLimits: null,
        error: null,
      }));
    }
  }, [isAuthenticated, user]);

  const loadSubscriptionData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const [plansResponse, statusResponse] = await Promise.all([
        api.getSubscriptionPlans(),
        api.getSubscriptionStatus(),
      ]);

      setState((prev) => ({
        ...prev,
        availablePlans: plansResponse.plans,
        currentSubscription: statusResponse,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load subscription data";
      setError(errorMessage);
      console.error("Subscription data loading failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionLimits = async (): Promise<void> => {
    try {
      const limits = await api.getQuestionLimits();
      console.log("📊 Loaded question limits:", limits);

      // Validate the limits data
      if (
        limits &&
        typeof limits.current_limit === "number" &&
        limits.current_limit > 0
      ) {
        setState((prev) => ({
          ...prev,
          questionLimits: limits,
        }));
      } else {
        console.warn("⚠️ Invalid question limits received, using defaults");
        // Set default limits if API returns invalid data
        setState((prev) => ({
          ...prev,
          questionLimits: {
            min_questions: 3,
            max_questions: isAuthenticated ? 5 : 3,
            subscription_tier: "free",
            current_limit: isAuthenticated ? 5 : 3,
          },
        }));
      }
    } catch (error) {
      console.error("Failed to load question limits:", error);
      // Set safe defaults if API call fails
      setState((prev) => ({
        ...prev,
        questionLimits: {
          min_questions: 3,
          max_questions: isAuthenticated ? 5 : 3,
          subscription_tier: "free",
          current_limit: isAuthenticated ? 5 : 3,
        },
      }));
    }
  };

  const createSubscription = async (
    priceId: string
  ): Promise<{ client_secret: string; subscription_id: string }> => {
    try {
      setProcessingPayment(true);
      setError(null);

      const result = await api.createSubscription(priceId);

      // After successful payment setup, reload subscription data
      await loadSubscriptionData();
      await loadQuestionLimits();

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create subscription";
      setError(errorMessage);
      throw error;
    } finally {
      setProcessingPayment(false);
    }
  };

  const cancelSubscription = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await api.cancelSubscription();

      // Reload subscription data to reflect the cancellation
      await loadSubscriptionData();
      await loadQuestionLimits();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to cancel subscription";
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resumeSubscription = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await api.resumeSubscription();

      // Reload subscription data to reflect the resumption
      await loadSubscriptionData();
      await loadQuestionLimits();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to resume subscription";
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper functions - Fixed with proper validation and fallbacks
  const getMaxQuestions = (): number => {
    // First, try to use question limits from API
    if (
      state.questionLimits &&
      typeof state.questionLimits.current_limit === "number" &&
      state.questionLimits.current_limit > 0
    ) {
      return state.questionLimits.current_limit;
    }

    // Fallback to subscription-based limits
    if (state.currentSubscription) {
      switch (state.currentSubscription.tier) {
        case "premium-monthly":
        case "premium-annual":
          return 15;
        case "free":
          return 5;
        default:
          return 5;
      }
    }

    // Final fallback based on authentication
    return isAuthenticated ? 5 : 3;
  };

  const getMinQuestions = (): number => {
    if (
      state.questionLimits &&
      typeof state.questionLimits.min_questions === "number" &&
      state.questionLimits.min_questions > 0
    ) {
      return state.questionLimits.min_questions;
    }
    return 3; // Safe default minimum
  };

  const canSelectQuestions = (count: number): boolean => {
    // Validate input
    if (!count || isNaN(count) || count < 1) return false;

    const min = getMinQuestions();
    const max = getMaxQuestions();

    // Ensure min and max are valid numbers
    if (isNaN(min) || isNaN(max)) return false;

    return count >= min && count <= max;
  };

  const hasFeature = (feature: string): boolean => {
    if (!state.currentSubscription) return false;

    const premiumFeatures = [
      "priority-support",
      "advanced-analytics",
      "unlimited-history",
      "enhanced-recommendations",
      "early-access",
    ];

    if (premiumFeatures.includes(feature)) {
      return ["premium-monthly", "premium-annual"].includes(
        state.currentSubscription.tier
      );
    }

    return true; // Basic features available to all
  };

  const isFeatureLimited = (): boolean => {
    return (
      !state.currentSubscription || state.currentSubscription.tier === "free"
    );
  };

  const getPlanByTier = (tier: string): SubscriptionPlan | undefined => {
    return state.availablePlans.find((plan) => plan.id === tier);
  };

  const getCurrentPlan = (): SubscriptionPlan | undefined => {
    if (!state.currentSubscription) {
      // Return a default free plan if no subscription
      return {
        id: "free",
        name: "Free Plan",
        price: 0,
        currency: "usd",
        interval: "forever",
        features: ["Up to 5 questions", "Basic recommendations"],
      };
    }
    return getPlanByTier(state.currentSubscription.tier);
  };

  const getUpgradePlans = (): SubscriptionPlan[] => {
    if (!state.currentSubscription) return state.availablePlans;

    if (state.currentSubscription.tier === "free") {
      return state.availablePlans.filter((plan) => plan.id !== "free");
    }

    if (state.currentSubscription.tier === "premium-monthly") {
      return state.availablePlans.filter(
        (plan) => plan.id === "premium-annual"
      );
    }

    return []; // Already on highest tier
  };

  const getSubscriptionStatusText = (): string => {
    if (!state.currentSubscription) return "Free Plan";

    const { status, cancel_at_period_end, current_period_end } =
      state.currentSubscription;

    if (cancel_at_period_end && current_period_end) {
      const endDate = new Date(current_period_end).toLocaleDateString();
      return `Cancels on ${endDate}`;
    }

    switch (status) {
      case "active":
        return "Active subscription";
      case "past_due":
        return "Payment overdue";
      case "canceled":
        return "Subscription cancelled";
      case "trialing":
        return "Free trial active";
      default:
        return "Subscription status unknown";
    }
  };

  const contextValue: SubscriptionContextType = {
    ...state,
    loadSubscriptionData,
    loadQuestionLimits,
    createSubscription,
    cancelSubscription,
    resumeSubscription,
    clearError,
    getMaxQuestions,
    getMinQuestions,
    canSelectQuestions,
    hasFeature,
    isFeatureLimited,

    // Additional helper methods
    getPlanByTier,
    getCurrentPlan,
    getUpgradePlans,
    getSubscriptionStatusText,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
};

export default SubscriptionContext;
