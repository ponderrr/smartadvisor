// client/src/pages/SubscriptionPage/SubscriptionPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
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
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { classNames } from "primereact/utils";
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
          "/account?tab=subscription&message=Payment processing requires Stripe configuration",
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
        <div className="subscription-background"></div>

        <div className="container">
          <Card className="loading-card glass">
            <div className="loading-content">
              <ProgressSpinner />
              <h2 className="loading-title">Loading Subscription Plans</h2>
              <p className="loading-description">
                Please wait while we fetch the latest pricing...
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      <div className="subscription-background"></div>

      <div className="container">
        <div className="subscription-container">
          {/* Header */}
          <div className="subscription-header">
            <h1 className="subscription-title">Choose Your Plan</h1>
            <p className="subscription-subtitle">
              Unlock the full potential of AI-powered recommendations with our
              flexible plans
            </p>
          </div>

          {/* Error Display */}
          {(error || stripeError) && (
            <Message
              severity="error"
              text={error || stripeError}
              className="w-full mb-4"
              closable
              onClose={() => {
                clearError();
                setStripeError(null);
              }}
            />
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
                <Card
                  key={plan.id}
                  className={classNames("plan-card glass", {
                    featured: isPopular,
                    current: isCurrentPlan,
                  })}
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
                          <Button
                            label="Cancel Plan"
                            onClick={() => setShowCancelConfirm(true)}
                            className="p-button-outlined p-button-danger cancel-btn"
                            disabled={isLoading}
                          />
                        ) : (
                          <div className="current-plan-text">
                            <Check size={16} />
                            Active Plan
                          </div>
                        )}
                      </>
                    ) : (
                      <Button
                        onClick={() =>
                          handleSelectPlan(plan.id, plan.stripe_price_id)
                        }
                        className={classNames("plan-button", {
                          featured: isPopular,
                          "p-button-outlined": isFree && !isPopular,
                        })}
                        disabled={
                          isProcessing ||
                          isLoading ||
                          (!isAuthenticated && !isFree)
                        }
                        icon={
                          isProcessing ? (
                            <Loader2 className="loading-spinner" size={16} />
                          ) : isFree ? (
                            <Sparkles size={16} />
                          ) : isUpgrade ? (
                            <Zap size={16} />
                          ) : (
                            <ArrowRight size={16} />
                          )
                        }
                        label={
                          isProcessing
                            ? "Processing..."
                            : isFree
                              ? "Get Started Free"
                              : isUpgrade
                                ? "Upgrade Now"
                                : "Select Plan"
                        }
                      />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Dialog
        visible={showCancelConfirm}
        onHide={() => setShowCancelConfirm(false)}
        header="Cancel Subscription?"
        modal
        className="glass"
        footer={
          <div className="modal-actions">
            <Button
              label="Keep Subscription"
              onClick={() => setShowCancelConfirm(false)}
              className="p-button-outlined"
              disabled={isProcessingCancel}
            />
            <Button
              label={isProcessingCancel ? "Canceling..." : "Yes, Cancel"}
              onClick={handleCancelSubscription}
              className="p-button-danger"
              disabled={isProcessingCancel}
              icon={isProcessingCancel ? "pi pi-spin pi-spinner" : undefined}
            />
          </div>
        }
      >
        <p className="modal-description">
          Are you sure you want to cancel your subscription? You'll lose access
          to premium features at the end of your current billing period.
        </p>
      </Dialog>
    </div>
  );
};

export default SubscriptionPage;
