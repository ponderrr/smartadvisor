import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./SubscriptionPage.css";

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  stripe_price_id?: string;
  features: string[];
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface SubscriptionStatus {
  tier: string;
  status: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

const SubscriptionPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionStatus | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansResponse, statusResponse] = await Promise.all<[ApiResponse<{plans: Plan[]}>, ApiResponse<SubscriptionStatus> | null]>([
          api.get("/subscriptions/plans"),
          isAuthenticated ? api.get("/subscriptions/status") : Promise.resolve(null),
        ]);

        setPlans(plansResponse.data.plans);
        if (statusResponse) {
          setCurrentSubscription(statusResponse.data);
        }
      } catch (err) {
        setError("Failed to load subscription information");
        console.error("Error fetching subscription data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const handlePlanSelect = async (planId: string) => {
    if (!isAuthenticated) {
      navigate("/signin?redirect=/subscription");
      return;
    }

    setProcessingPlan(planId);
    const plan = plans.find((p) => p.id === planId);
    
    if (!plan || !plan.stripe_price_id) return;

    try {
      const response = await api.post("/subscriptions/create", {
        price_id: plan.stripe_price_id,
      });

      // Assuming you have Stripe.js loaded
      const stripe = (window as { Stripe?: (key: string) => any }).Stripe?.(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      if (!stripe) {
        throw new Error('Stripe.js not loaded');
      }
      
      const { client_secret } = response.data;
      const result = await stripe.confirmCardPayment(client_secret);

      if (result.error) {
        setError(result.error.message || "Payment failed");
      } else {
        navigate("/account");
      }
    } catch (err) {
      setError("Failed to process subscription");
      console.error("Subscription error:", err);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await api.put("/subscriptions/cancel");
      const statusResponse = await api.get("/subscriptions/status");
      setCurrentSubscription(statusResponse.data);
    } catch (err) {
      setError("Failed to cancel subscription");
      console.error("Cancel subscription error:", err);
    }
  };

  if (loading) {
    return (
      <div className="subscription-page">
        <div className="container">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      <div className="container">
        <div className="subscription-header">
          <h1>Choose Your Plan</h1>
          <p>Get personalized recommendations tailored to your preferences</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="plans-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${plan.id === 'premium-annual' ? 'featured' : ''}`}
            >
              {plan.id === 'premium-annual' && (
                <div className="featured-badge">Best Value</div>
              )}
              <h2 className="plan-name">{plan.name}</h2>
              <div className="plan-price">
                <span className="currency">{plan.currency === 'USD' ? '$' : plan.currency}</span>
                <span className="amount">{plan.price}</span>
                <span className="interval">/{plan.interval}</span>
              </div>
              <ul className="plan-features">
                {plan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              {currentSubscription?.tier === plan.id ? (
                <div className="current-plan">
                  <span>Current Plan</span>
                  {currentSubscription.cancel_at_period_end ? (
                    <p className="cancellation-notice">
                      Cancels on{" "}
                      {new Date(currentSubscription.current_period_end!).toLocaleDateString()}
                    </p>
                  ) : (
                    <button
                      className="cancel-button"
                      onClick={handleCancelSubscription}
                    >
                      Cancel Plan
                    </button>
                  )}
                </div>
              ) : (
                <button
                  className={`select-plan-button ${
                    plan.id === 'premium-annual' ? 'featured' : ''
                  }`}
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={currentSubscription?.status === 'active' && !currentSubscription.cancel_at_period_end}
                >
                  {plan.price === 0 ? "Get Started" : "Select Plan"}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="subscription-footer">
          <p>All plans include a 14-day money-back guarantee</p>
          <p>Have questions? <a href="/contact">Contact our support team</a></p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;