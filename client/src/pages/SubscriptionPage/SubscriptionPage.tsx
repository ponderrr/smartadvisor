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
import { loadStripe } from "@stripe/stripe-js";
import "./SubscriptionPage.css";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
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

    try {
      const { client_secret } = await createSubscription(priceId);

      // Redirect to Stripe Checkout or handle payment confirmation
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe failed to load");
      }

      // For demo purposes, we'll simulate successful payment
      // In real implementation, you'd handle the payment confirmation here
      console.log("Payment intent created:", client_secret);

      // Show success message or redirect
      navigate("/account?tab=subscription&success=true");
    } catch (error) {
      console.error("Subscription creation failed:", error);
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
                      className={`status-text ${currentSubscription.status === "active" ? "active" : "inactive"}`}
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
          {error && (
            <div className="error-banner">
              <AlertCircle size={20} />
              <span>{error}</span>
              <button onClick={clearError} className="error-close">
                <X size={16} />
              </button>
            </div>
          )}

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
                  className={`plan-card glass ${isPopular ? "featured" : ""} ${isCurrentPlan ? "current" : ""}`}
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
                        className={`plan-button ${isPopular ? "btn-primary featured" : isFree ? "btn-outline" : "btn-primary"}`}
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

          {/* Authentication Notice */}
          {!isAuthenticated && (
            <div className="auth-notice glass">
              <div className="notice-content">
                <Sparkles className="notice-icon" />
                <div className="notice-text">
                  <h3>Ready to get started?</h3>
                  <p>
                    Create your free account to begin getting personalized
                    recommendations
                  </p>
                </div>
                <button
                  onClick={() => navigate("/signup")}
                  className="btn-primary notice-cta"
                >
                  Sign Up Free
                </button>
              </div>
            </div>
          )}

          {/* Features Comparison */}
          <div className="features-comparison">
            <h2 className="comparison-title">Why Choose Premium?</h2>
            <div className="comparison-grid">
              <div className="comparison-item">
                <div className="comparison-icon glass-primary">
                  <Zap size={24} />
                </div>
                <h4>3x More Questions</h4>
                <p>
                  Get 15 personalized questions instead of 5 for deeper AI
                  analysis
                </p>
              </div>
              <div className="comparison-item">
                <div className="comparison-icon glass-primary">
                  <Star size={24} />
                </div>
                <h4>Enhanced Recommendations</h4>
                <p>
                  Premium AI models provide more accurate and diverse
                  suggestions
                </p>
              </div>
              <div className="comparison-item">
                <div className="comparison-icon glass-primary">
                  <Crown size={24} />
                </div>
                <h4>Priority Support</h4>
                <p>Get help when you need it with dedicated customer support</p>
              </div>
            </div>
          </div>

          {/* Guarantee */}
          <div className="guarantee-section">
            <div className="guarantee-content glass">
              <Check className="guarantee-icon" />
              <div className="guarantee-text">
                <h3>30-Day Money-Back Guarantee</h3>
                <p>
                  Try Premium risk-free. If you're not completely satisfied,
                  we'll refund your money.
                </p>
              </div>
            </div>
          </div>
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
