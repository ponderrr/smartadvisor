// client/src/pages/SubscriptionPage/SubscriptionPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  Check,
  Sparkles,
  Zap,
  Star,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import "./SubscriptionPage.css";

// Safe Stripe initialization with error handling
let stripePromise: Promise<any> | null = null;

const initializeStripe = async () => {
  try {
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    // Only initialize if we have a valid Stripe key
    if (stripeKey && stripeKey !== "undefined" && stripeKey.startsWith("pk_")) {
      const { loadStripe } = await import("@stripe/stripe-js");
      return loadStripe(stripeKey);
    } else {
      console.warn("Stripe publishable key not configured or invalid");
      return null;
    }
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
    return null;
  }
};

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    currentSubscription,
    availablePlans,
    isLoading,
    error,
    isProcessingPayment,
    loadSubscriptionData,
    createSubscription,
    cancelSubscription,
    resumeSubscription,
    clearError,
    getCurrentPlan,
    getUpgradePlans,
    getSubscriptionStatusText,
  } = useSubscription();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    // Load subscription data when component mounts
    if (isAuthenticated) {
      loadSubscriptionData();
    }
  }, [isAuthenticated, loadSubscriptionData]);

  useEffect(() => {
    // Clear error when component mounts
    clearError();
  }, [clearError]);

  // Initialize Stripe lazily
  useEffect(() => {
    if (!stripePromise) {
      stripePromise = initializeStripe();
    }
  }, []);

  const handleSelectPlan = async (planId: string, priceId?: string) => {
    if (!isAuthenticated) {
      navigate("/signin?redirect=/subscription");
      return;
    }

    if (planId === "free" || !priceId) {
      // Free plan or invalid price ID
      return;
    }

    setSelectedPlanId(planId);
    setStripeError(null);

    try {
      // Check if Stripe is available
      if (!stripePromise) {
        throw new Error("Stripe is not properly configured");
      }

      const { client_secret } = await createSubscription(priceId);

      // Try to get Stripe instance
      const stripe = await stripePromise;
      if (!stripe) {
        // Fallback: redirect to account page with message
        navigate(
          "/account?tab=subscription&message=Payment processing requires Stripe configuration"
        );
        return;
      }

      // For demo purposes, we'll simulate successful payment
      // In real implementation, you'd handle the payment confirmation here
      console.log("Payment intent created:", client_secret);

      // Show success message or redirect
      navigate("/account?tab=subscription&success=true");
    } catch (error) {
      console.error("Subscription creation failed:", error);
      if (error instanceof Error) {
        setStripeError(error.message);
      }
    } finally {
      setSelectedPlanId(null);
    }
  };

  const handleCancelSubscription = async () => {
    setIsProcessingCancel(true);
    try {
      await cancelSubscription();
      setShowCancelConfirm(false);
    } catch (error) {
      console.error("Cancellation failed:", error);
    } finally {
      setIsProcessingCancel(false);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      await resumeSubscription();
    } catch (error) {
      console.error("Resume failed:", error);
    }
  };

  const currentPlan = getCurrentPlan();
  const upgradePlans = getUpgradePlans();
  const statusText = getSubscriptionStatusText();

  if (isLoading && !availablePlans.length) {
    return (
      <div className="subscription-page">
        <div className="subscription-background">
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>

        <div className="container">
          <div className="loading-card glass">
            <div className="loading-content">
              <Loader2 className="loading-icon" />
              <h2 className="loading-title">Loading Subscription Plans</h2>
              <p className="loading-description">
                Please wait while we fetch the latest pricing...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      <div className="subscription-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className="container">
        <div className="subscription-container">
          {/* Header */}
          <div className="subscription-header">
            <div className="header-icon glass-primary">
              <Crown size={32} />
            </div>
            <h1 className="subscription-title">Choose Your Plan</h1>
            <p className="subscription-subtitle">
              Unlock the full potential of AI-powered recommendations with our
              flexible plans
            </p>

            {/* Current Subscription Status */}
            {isAuthenticated && currentSubscription && (
              <div className="current-status glass">
                <div className="status-content">
                  <div className="status-info">
                    <span className="status-label">Current Plan:</span>
                    <span
                      className={`status-value ${currentSubscription.tier}`}
                    >
                      {currentPlan?.name || "Free Plan"}
                    </span>
                  </div>
                  <div className="status-details">
                    <span
                      className={`status-text ${
                        currentSubscription.status === "active"
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {statusText}
                    </span>
                  </div>
                </div>

                {currentSubscription.cancel_at_period_end && (
                  <button
                    onClick={handleResumeSubscription}
                    className="btn-outline resume-btn"
                    disabled={isLoading}
                  >
                    <RefreshCw size={16} />
                    Resume Subscription
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Error Display */}
          {(error || stripeError) && (
            <div className="error-banner">
              <AlertCircle size={20} />
              <span>{error || stripeError}</span>
              <button
                onClick={() => {
                  clearError();
                  setStripeError(null);
                }}
                className="error-close"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Demo Notice */}
          <div className="auth-notice glass" style={{ marginBottom: "2rem" }}>
            <div className="notice-content">
              <Sparkles className="notice-icon" />
              <div className="notice-text">
                <h3>Demo Mode</h3>
                <p>
                  This is a demonstration. Payment processing is simulated for
                  development purposes.
                </p>
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="plans-grid">
            {availablePlans.map((plan) => {
              const isCurrentPlan = currentPlan?.id === plan.id;
              const isUpgrade = upgradePlans.some((p) => p.id === plan.id);
              const isProcessing =
                selectedPlanId === plan.id && isProcessingPayment;
              const isFree = plan.price === 0;
              const isPopular = plan.id === "premium-annual";

              return (
                <div
                  key={plan.id}
                  className={`plan-card glass ${isPopular ? "featured" : ""} ${
                    isCurrentPlan ? "current" : ""
                  }`}
                >
                  {isPopular && (
                    <div className="featured-badge">
                      <Star size={16} />
                      Best Value
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="current-badge">
                      <Check size={16} />
                      Current Plan
                    </div>
                  )}

                  <div className="plan-header">
                    <h3 className="plan-name">{plan.name}</h3>
                    <div className="plan-price">
                      <span className="currency">$</span>
                      <span className="amount">{plan.price}</span>
                      <span className="interval">/{plan.interval}</span>
                    </div>
                    {plan.interval === "year" && plan.price > 0 && (
                      <div className="savings-badge">Save 33%</div>
                    )}
                  </div>

                  <div className="plan-features">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="feature-item">
                        <Check size={16} className="feature-check" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="plan-actions">
                    {isCurrentPlan ? (
                      <>
                        {currentSubscription?.status === "active" &&
                        !currentSubscription.cancel_at_period_end ? (
                          <button
                            onClick={() => setShowCancelConfirm(true)}
                            className="btn-outline cancel-btn"
                            disabled={isLoading}
                          >
                            Cancel Plan
                          </button>
                        ) : (
                          <div className="current-plan-text">
                            <Check size={16} />
                            Active Plan
                          </div>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() =>
                          handleSelectPlan(plan.id, plan.stripe_price_id)
                        }
                        className={`plan-button ${
                          isPopular
                            ? "btn-primary featured"
                            : isFree
                            ? "btn-outline"
                            : "btn-primary"
                        }`}
                        disabled={
                          isProcessing ||
                          isLoading ||
                          (!isAuthenticated && !isFree)
                        }
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={16} className="loading-spinner" />
                            Processing...
                          </>
                        ) : isFree ? (
                          <>
                            <Sparkles size={16} />
                            Get Started Free
                          </>
                        ) : isUpgrade ? (
                          <>
                            <Zap size={16} />
                            Upgrade Now
                          </>
                        ) : (
                          <>
                            <ArrowRight size={16} />
                            Select Plan
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rest of your component remains the same... */}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h3 className="modal-title">Cancel Subscription?</h3>
            <p className="modal-description">
              Are you sure you want to cancel your subscription? You'll lose
              access to premium features at the end of your current billing
              period.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="btn-outline"
                disabled={isProcessingCancel}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                className="btn-primary cancel-confirm"
                disabled={isProcessingCancel}
              >
                {isProcessingCancel ? (
                  <>
                    <Loader2 size={16} className="loading-spinner" />
                    Canceling...
                  </>
                ) : (
                  "Yes, Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;
