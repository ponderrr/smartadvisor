import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  Check,
  Star,
  Zap,
  CreditCard,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X,
  Loader2,
} from "lucide-react";
import { useSubscription } from "../../../context/SubscriptionContext";
import "./AccountComponents.css";

const SubscriptionTab: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentSubscription,
    availablePlans,
    error,
    cancelSubscription,
    resumeSubscription,
    getCurrentPlan,
    getMaxQuestions,
    isFeatureLimited,
    getSubscriptionStatusText,
  } = useSubscription();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentPlan = getCurrentPlan();
  const maxQuestions = getMaxQuestions();
  const isLimited = isFeatureLimited();
  const statusText = getSubscriptionStatusText();

  const handleUpgrade = () => {
    navigate("/subscription");
  };

  const handleManageBilling = () => {
    // TODO: Implement Stripe customer portal
    console.log("Navigate to billing portal");
  };

  const handleCancelSubscription = async () => {
    try {
      setIsProcessing(true);
      await cancelSubscription();
      setShowCancelModal(false);
    } catch (error) {
      console.error("Cancellation failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      setIsProcessing(true);
      await resumeSubscription();
    } catch (error) {
      console.error("Resume failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="form-section">
      {/* Section Header */}
      <div className="section-header">
        <h2 className="section-title">Subscription</h2>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Current Plan Status */}
      <div className="subscription-card">
        <h3 className="card-title">
          <Crown size={20} />
          Current Plan
        </h3>

        <div className="subscription-details">
          <div className="detail-section">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                marginBottom: "var(--space-3)",
              }}
            >
              <span className={`badge ${isLimited ? 'badge-success' : 'badge-warning'}`}>
                {isLimited ? <Star size={16} /> : <Crown size={16} />}
                {currentPlan?.name || "Free Plan"}
              </span>

              <span className={`status-badge ${currentSubscription?.status === "active" ? 'status-active' : 'status-inactive'}`}>
                {statusText}
              </span>
            </div>

            <div className="subscription-info">
              <div className="detail-row">
                <span className="detail-label">Questions per session:</span>
                <span className="detail-value">
                  {maxQuestions}
                </span>
              </div>

              {currentSubscription &&
                currentSubscription.current_period_end && (
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>
                      {currentSubscription.cancel_at_period_end
                        ? "Expires on:"
                        : "Renews on:"}
                    </span>
                    <span
                      style={{
                        fontWeight: "var(--weight-medium)",
                        color: "var(--neutral-800)",
                      }}
                    >
                      {new Date(
                        currentSubscription.current_period_end,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Price:</span>
                <span
                  style={{
                    fontWeight: "var(--weight-medium)",
                    color: "var(--neutral-800)",
                  }}
                >
                  {currentPlan
                    ? `$${currentPlan.price}/${currentPlan.interval}`
                    : "Free"}
                </span>
              </div>
            </div>
          </div>

          <div className="actions-container">
            {isLimited ? (
              <button
                onClick={handleUpgrade}
                className="btn-save"
                style={{ width: "100%" }}
              >
                <Zap size={16} />
                Upgrade Plan
              </button>
            ) : (
              <>
                <button
                  onClick={handleManageBilling}
                  className="btn-edit"
                  style={{ width: "100%" }}
                >
                  <CreditCard size={16} />
                  Manage Billing
                </button>

                {currentSubscription?.cancel_at_period_end ? (
                  <button
                    onClick={handleResumeSubscription}
                    disabled={isProcessing}
                    className="btn-save"
                    style={{ width: "100%" }}
                  >
                    {isProcessing ? (
                      <Loader2 size={16} className="loading-spinner" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    Resume Subscription
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="btn-cancel"

                  >
                    <X size={16} />
                    Cancel Plan
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Plan Features Comparison */}
      <div className="subscription-card">
        <h3
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--neutral-800)",
            marginBottom: "var(--space-6)",
          }}
        >
          Plan Features
        </h3>

        <div
          className="plans-grid"
        >
          {availablePlans.map((plan) => {
            const isCurrent = currentPlan?.id === plan.id;
            const isFree = plan.price === 0;

            return (
              <div
                key={plan.id}
                style={{
                  padding: "var(--space-6)",
                  background: isCurrent
                    ? "var(--glass-primary)"
                    : "var(--glass-white)",
                  border: `1px solid ${isCurrent ? "rgba(16, 183, 127, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
                  borderRadius: "var(--radius-lg)",
                  position: "relative",
                }}
              >
                {isCurrent && (
                  <div
                    style={{
                      position: "absolute",
                      top: "var(--space-4)",
                      right: "var(--space-4)",
                      background: "var(--primary-500)",
                      color: "white",
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--weight-semibold)",
                      padding: "var(--space-1) var(--space-3)",
                      borderRadius: "var(--radius-full)",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-1)",
                    }}
                  >
                    <Check size={12} />
                    Current
                  </div>
                )}

                <div style={{ marginBottom: "var(--space-4)" }}>
                  <h4
                    style={{
                      fontSize: "var(--text-xl)",
                      fontWeight: "var(--weight-bold)",
                      color: "var(--neutral-800)",
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    {plan.name}
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "var(--space-1)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--text-3xl)",
                        fontWeight: "var(--weight-bold)",
                        color: "var(--neutral-800)",
                      }}
                    >
                      ${plan.price}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--text-base)",
                        color: "var(--neutral-600)",
                      }}
                    >
                      /{plan.interval}
                    </span>
                  </div>
                </div>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "grid",
                    gap: "var(--space-3)",
                  }}
                >
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        fontSize: "var(--text-sm)",
                        color: "var(--neutral-700)",
                      }}
                    >
                      <Check
                        size={16}
                        style={{ color: "var(--primary-500)", flexShrink: 0 }}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                {!isCurrent && !isFree && (
                  <button
                    onClick={handleUpgrade}
                    style={{
                      width: "100%",
                      marginTop: "var(--space-6)",
                      padding: "var(--space-3) var(--space-4)",
                      background:
                        "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
                      border: "none",
                      borderRadius: "var(--radius-md)",
                      color: "white",
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--weight-medium)",
                      cursor: "pointer",
                      transition: "all var(--transition-normal)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "var(--space-2)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, var(--primary-600), var(--primary-700))";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, var(--primary-500), var(--primary-600))";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <ExternalLink size={16} />
                    Upgrade to {plan.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History Link */}
      {!isLimited && (
        <div className="subscription-card">
          <h3
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: "var(--weight-semibold)",
              color: "var(--neutral-800)",
              marginBottom: "var(--space-4)",
            }}
          >
            Billing & Invoices
          </h3>
          <p
            style={{
              color: "var(--neutral-600)",
              marginBottom: "var(--space-4)",
              fontSize: "var(--text-sm)",
            }}
          >
            View your billing history, download invoices, and update payment
            methods.
          </p>
          <button onClick={handleManageBilling} className="btn-edit">
            <CreditCard size={16} />
            Manage Billing
          </button>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3
              style={{
                fontSize: "var(--text-xl)",
                fontWeight: "var(--weight-semibold)",
                color: "var(--neutral-800)",
                marginBottom: "var(--space-4)",
                textAlign: "center",
              }}
            >
              Cancel Subscription?
            </h3>
            <p
              style={{
                color: "var(--neutral-600)",
                lineHeight: 1.6,
                marginBottom: "var(--space-8)",
                textAlign: "center",
              }}
            >
              Are you sure you want to cancel your subscription? You'll lose
              access to premium features at the end of your current billing
              period.
            </p>
            <div
              style={{
                display: "flex",
                gap: "var(--space-4)",
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isProcessing}
                className="btn-edit"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isProcessing}
                style={{
                  padding: "var(--space-3) var(--space-6)",
                  background: "#ef4444",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  color: "white",
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--weight-medium)",
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  opacity: isProcessing ? 0.6 : 1,
                  transition: "all var(--transition-normal)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                }}
                onMouseEnter={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.background = "#dc2626";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.background = "#ef4444";
                  }
                }}
              >
                {isProcessing ? (
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

export default SubscriptionTab;
