import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Film,
  Book,
  Star,
  ChevronRight,
  Loader2,
  RotateCcw,
  Crown,
  Zap,
  Plus,
  Minus,
  Target,
  Clock,
  Heart,
  Brain,
  Sparkles,
} from "lucide-react";
import { useRecommendations } from "../../context/RecommendationContext";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { Badge } from "primereact/badge";
import { ProgressBar } from "primereact/progressbar";
import { Ripple } from "primereact/ripple";
import { classNames } from "primereact/utils";
import "./QuestionsPage.css";

type RecommendationType = "movie" | "book" | "both";

// Rotating tips for different scenarios
const GENERAL_TIPS = [
  {
    icon: Target,
    text: "Be as specific as possible - mention genres, themes, or specific titles you enjoyed!",
  },
  {
    icon: Heart,
    text: "Don't just say what you like - tell us why you like it for better recommendations.",
  },
  {
    icon: Brain,
    text: "Think about your current mood - do you want something familiar or completely new?",
  },
  {
    icon: Clock,
    text: "Consider the time you have available - looking for a quick read or a long series?",
  },
  {
    icon: Sparkles,
    text: "Mention if you prefer newer releases or don't mind classic/older content.",
  },
];

const MOVIE_TIPS = [
  {
    icon: Film,
    text: "Mention specific actors, directors, or cinematography styles you enjoy.",
  },
  {
    icon: Target,
    text: "Tell us about recent movies you loved - we'll find similar gems!",
  },
  {
    icon: Heart,
    text: "Consider your viewing context - movie night with friends or solo experience?",
  },
  {
    icon: Brain,
    text: "Think about runtime preferences - quick watch or epic adventure?",
  },
];

const BOOK_TIPS = [
  {
    icon: Book,
    text: "Mention your favorite authors or specific writing styles you enjoy.",
  },
  {
    icon: Target,
    text: "Tell us about book series vs. standalone novels - what's your preference?",
  },
  {
    icon: Heart,
    text: "Consider the complexity level - light read or something challenging?",
  },
  {
    icon: Brain,
    text: "Think about length preferences - short stories, novels, or epic series?",
  },
];

const BOTH_TIPS = [
  {
    icon: Star,
    text: "Consider how books and movies complement each other in your preferences.",
  },
  {
    icon: Target,
    text: "Tell us if you prefer adaptations or completely original stories.",
  },
  {
    icon: Heart,
    text: "Think about whether you like similar themes across different media.",
  },
  {
    icon: Brain,
    text: "Consider your time balance - more movies or books in your routine?",
  },
];

const QuestionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    getMaxQuestions,
    getMinQuestions,
    canSelectQuestions,
    isFeatureLimited,
    currentSubscription,
    isInitialized,
  } = useSubscription();
  const {
    currentSession,
    recommendations,
    isLoading,
    error,
    startRecommendationSession,
    answerQuestion,
    goToPreviousQuestion,
    goToNextQuestion,
    submitAnswers,
    resetSession,
    clearError,
    getCurrentQuestion,
    getCurrentAnswer,
    canGoNext,
    canGoBack,
    getProgress,
  } = useRecommendations();

  const [isStarting, setIsStarting] = useState(false);
  const [selectedType, setSelectedType] = useState<RecommendationType | null>(
    null,
  );
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(5);
  const [showQuestionSelection, setShowQuestionSelection] = useState(false);

  // State for rotating tips
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Get subscription info with proper fallbacks to prevent NaN
  const maxQuestions = getMaxQuestions() || 5;
  const minQuestions = getMinQuestions() || 3;
  const isLimited = isFeatureLimited();
  const planName =
    currentSubscription?.tier === "free"
      ? "Free Plan"
      : currentSubscription?.tier || "Free Plan";

  // Get appropriate tips based on selected type
  const getTipsArray = () => {
    if (!selectedType) return GENERAL_TIPS;
    switch (selectedType) {
      case "movie":
        return MOVIE_TIPS;
      case "book":
        return BOOK_TIPS;
      case "both":
        return BOTH_TIPS;
      default:
        return GENERAL_TIPS;
    }
  };

  const tips = getTipsArray();

  // Rotate tips every 8 seconds when on question flow
  useEffect(() => {
    if (!currentSession.id || !getCurrentQuestion()) return;

    const interval = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
        setIsAnimating(false);
      }, 200); // Half of animation duration
    }, 8000); // Change tip every 8 seconds

    return () => clearInterval(interval);
  }, [currentSession.id, getCurrentQuestion, tips.length]);

  // Reset tip index when type changes
  useEffect(() => {
    setCurrentTipIndex(0);
    setIsAnimating(false);
  }, [selectedType]);

  // Set default question count based on limits - only update when limits change
  useEffect(() => {
    if (isInitialized && maxQuestions > 0) {
      const defaultCount = Math.min(5, maxQuestions);
      setSelectedQuestionCount(defaultCount);
    }
  }, [isInitialized, maxQuestions]);

  // Reset session when component mounts - only once
  useEffect(() => {
    resetSession();
    clearError();
  }, []); // Empty dependency array to run only once

  // Redirect to results when recommendations are ready
  useEffect(() => {
    if (recommendations && currentSession.isComplete) {
      navigate("/recommendations/results", { replace: true });
    }
  }, [recommendations, currentSession.isComplete, navigate]);

  const handleTypeSelection = (type: RecommendationType) => {
    if (!isAuthenticated) {
      navigate("/signin?redirect=/questions");
      return;
    }

    setSelectedType(type);
    setShowQuestionSelection(true);
  };

  const handleQuestionCountChange = (count: number) => {
    if (canSelectQuestions(count)) {
      setSelectedQuestionCount(count);
    }
  };

  const handleStartSession = async () => {
    if (!selectedType || !isAuthenticated) {
      return;
    }

    try {
      setIsStarting(true);
      clearError();

      console.log(
        "Starting session with type:",
        selectedType,
        "and questions:",
        selectedQuestionCount,
      );

      await startRecommendationSession(selectedType, selectedQuestionCount);
    } catch (error) {
      console.error("Failed to start session:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleAnswerChange = (answer: string) => {
    answerQuestion(answer);
  };

  const handleNext = () => {
    if (canGoNext()) {
      const isLastQuestion =
        currentSession.currentQuestionIndex >=
        currentSession.questions.length - 1;

      if (isLastQuestion) {
        handleSubmit();
      } else {
        goToNextQuestion();
      }
    }
  };

  const handleSubmit = async () => {
    try {
      await submitAnswers();
    } catch (error) {
      console.error("Failed to submit answers:", error);
    }
  };

  const currentQuestion = getCurrentQuestion();
  const currentAnswer = getCurrentAnswer();
  const progress = getProgress();
  const isLastQuestion =
    currentSession.currentQuestionIndex >= currentSession.questions.length - 1;

  // Show loading while subscription data is loading
  if (!isInitialized && isAuthenticated) {
    return (
      <div className="questions-page">
        <div className="container">
          <div className="loading-card glass">
            <div className="loading-content">
              <Loader2 className="loading-icon" />
              <h2 className="loading-title">Loading your subscription...</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Type Selection
  if (!showQuestionSelection && !currentSession.id && !isStarting) {
    return (
      <div className="questions-page">
        <div className="questions-background">
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>

        <div className="container">
          <div className="questions-container">
            {/* Header */}
            <div className="questions-header">
              <h1 className="questions-title">
                Get Personalized Recommendations
              </h1>
              <p className="questions-subtitle">
                Our AI will ask you personalized questions to understand your
                preferences and suggest the perfect content just for you.
              </p>

              {/* Subscription Status */}
              <div className="subscription-status">
                <div
                  className={`status-badge ${
                    currentSubscription?.tier || "free"
                  }`}
                >
                  {isLimited ? (
                    <>{planName}</>
                  ) : (
                    <>
                      <Crown size={16} />
                      {planName}
                    </>
                  )}
                </div>
                <span className="status-text">
                  {minQuestions}-{maxQuestions} questions • Enhanced AI
                  recommendations
                </span>
              </div>
            </div>

            {/* Type Selection */}
            <div className="type-selection glass">
              <h2 className="selection-title">
                What would you like recommendations for?
              </h2>

              {error && (
                <div className="error-message">
                  <div className="error-message-content">
                    <div className="error-message-icon">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8 5.33333V8M8 10.6667H8.00667M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={clearError}
                    className="error-message-close"
                    aria-label="Close error message"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 4L4 12M4 4L12 12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              )}

              <div className="type-grid">
                <button
                  className="type-card"
                  onClick={() => handleTypeSelection("movie")}
                  disabled={isLoading}
                >
                  <div className="type-icon">
                    <Film size={48} />
                  </div>
                  <h3 className="type-title">Movies</h3>
                  <p className="type-description">
                    Discover your next favorite film across all genres
                  </p>
                  <div className="type-arrow">
                    <ChevronRight size={20} />
                  </div>
                  <Ripple />
                </button>

                <button
                  className="type-card"
                  onClick={() => handleTypeSelection("book")}
                  disabled={isLoading}
                >
                  <div className="type-icon">
                    <Book size={48} />
                  </div>
                  <h3 className="type-title">Books</h3>
                  <p className="type-description">
                    Find captivating reads tailored to your taste
                  </p>
                  <div className="type-arrow">
                    <ChevronRight size={20} />
                  </div>
                </button>

                <button
                  className="type-card featured"
                  onClick={() => handleTypeSelection("both")}
                  disabled={isLoading}
                >
                  <div className="featured-badge">Popular</div>
                  <div className="type-icon">
                    <Star size={48} />
                  </div>
                  <h3 className="type-title">Both</h3>
                  <p className="type-description">
                    Get the best of both worlds with movies and books
                  </p>
                  <div className="type-arrow">
                    <ChevronRight size={20} />
                  </div>
                </button>
              </div>

              {/* Upgrade Notice for Free Users */}
              {isLimited && (
                <div className="upgrade-notice">
                  <div className="upgrade-content">
                    <div className="upgrade-icon">
                      <Crown size={24} />
                    </div>
                    <div className="upgrade-text">
                      <h4>Want even better recommendations?</h4>
                      <p>
                        Upgrade to Premium for{" "}
                        <strong>up to 15 questions</strong>, enhanced AI
                        analysis, and priority support!
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("/subscription")}
                      className="btn-primary upgrade-btn"
                    >
                      <Zap size={16} />
                      Upgrade Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Question Count Selection
  if (
    showQuestionSelection &&
    selectedType &&
    !currentSession.id &&
    !isStarting
  ) {
    return (
      <div className="questions-page">
        <div className="questions-background">
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>

        <div className="container">
          <div className="questions-container">
            {/* Header */}
            <div className="questions-header">
              <h1 className="questions-title">
                How many questions would you like?
              </h1>
              <p className="questions-subtitle">
                More questions help our AI understand your preferences better
                and provide more accurate recommendations.
              </p>
            </div>

            {/* Question Count Selection */}
            <div className="type-selection glass">
              <h2 className="selection-title">
                Choose your question count ({minQuestions}-{maxQuestions}{" "}
                available)
              </h2>

              {error && (
                <div className="error-banner animate-slide-up">
                  <span>{error}</span>
                  <button onClick={clearError} className="error-close">
                    ×
                  </button>
                </div>
              )}

              {/* Question Count Controls */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "2rem",
                  marginBottom: "2rem",
                }}
              >
                <button
                  onClick={() =>
                    handleQuestionCountChange(selectedQuestionCount - 1)
                  }
                  disabled={selectedQuestionCount <= minQuestions}
                  className="btn-glass"
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Minus size={20} />
                </button>

                <div
                  style={{
                    background: "var(--glass-primary)",
                    padding: "1.5rem 3rem",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid rgba(16, 183, 127, 0.3)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "3rem",
                      fontWeight: "bold",
                      color: "var(--primary-500)",
                      lineHeight: 1,
                    }}
                  >
                    {selectedQuestionCount}
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--primary-600)",
                      fontWeight: "500",
                    }}
                  >
                    Questions
                  </div>
                </div>

                <button
                  onClick={() =>
                    handleQuestionCountChange(selectedQuestionCount + 1)
                  }
                  disabled={selectedQuestionCount >= maxQuestions}
                  className="btn-glass"
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Quick Selection Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                  marginBottom: "2rem",
                  flexWrap: "wrap",
                }}
              >
                {Array.from(
                  { length: maxQuestions - minQuestions + 1 },
                  (_, i) => {
                    const count = minQuestions + i;
                    return (
                      <button
                        key={count}
                        onClick={() => setSelectedQuestionCount(count)}
                        className={`btn-glass ${
                          selectedQuestionCount === count ? "active" : ""
                        }`}
                        style={{
                          minWidth: "48px",
                          height: "48px",
                          borderRadius: "var(--radius-md)",
                          background:
                            selectedQuestionCount === count
                              ? "var(--glass-primary)"
                              : "var(--glass-white)",
                          color:
                            selectedQuestionCount === count
                              ? "var(--primary-600)"
                              : "var(--neutral-600)",
                          border:
                            selectedQuestionCount === count
                              ? "1px solid rgba(16, 183, 127, 0.3)"
                              : "1px solid rgba(255, 255, 255, 0.18)",
                        }}
                      >
                        {count}
                      </button>
                    );
                  },
                )}
              </div>

              {/* Start Button */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => setShowQuestionSelection(false)}
                  className="btn-glass"
                >
                  <ArrowLeft size={20} />
                  Back
                </button>

                <button
                  onClick={handleStartSession}
                  className="btn-primary"
                  disabled={isLoading}
                  style={{ padding: "1rem 2rem" }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="loading-spinner" />
                      Starting...
                    </>
                  ) : (
                    <>
                      Start {selectedQuestionCount} Questions
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>

              {/* Info about question count */}
              <div
                style={{
                  marginTop: "2rem",
                  padding: "1rem",
                  background: "var(--glass-white)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.875rem",
                  color: "var(--neutral-600)",
                  textAlign: "center",
                }}
              >
                💡 <strong>Tip:</strong> More questions = Better
                recommendations!
                {isLimited && ` Upgrade to Premium for up to 15 questions.`}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Loading State
  if (isStarting || (isLoading && !currentQuestion)) {
    return (
      <div className="questions-page">
        <div className="questions-background">
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>

        <div className="container">
          <div className="loading-card glass">
            <div className="loading-content">
              <h2 className="loading-title">Generating Your Questions</h2>
              <p className="loading-description">
                Our AI is creating {selectedQuestionCount} personalized
                questions based on your preferences...
              </p>
              <div className="loading-progress">
                <div className="progress-bar">
                  <div className="progress-fill"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Questions Flow
  if (currentQuestion) {
    const currentTip = tips[currentTipIndex];
    const TipIcon = currentTip.icon;

    return (
      <div className="questions-page">
        <div className="questions-background">
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>

        <div className="container">
          <div className="questions-container">
            {/* Progress Header */}
            <div className="progress-header">
              <button
                onClick={resetSession}
                className="back-to-start glass"
                title="Start Over"
              >
                <RotateCcw size={20} />
              </button>

              <div className="progress-info">
                <span className="progress-text">
                  Question {currentSession.currentQuestionIndex + 1} of{" "}
                  {currentSession.questions.length}
                </span>
                <ProgressBar
                  value={progress}
                  showValue={false}
                  style={{ height: "6px" }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="question-card glass">
              {error && (
                <div className="error-message">
                  <div className="error-message-content">
                    <div className="error-message-icon">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8 5.33333V8M8 10.6667H8.00667M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={clearError}
                    className="error-message-close"
                    aria-label="Close error message"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 4L4 12M4 4L12 12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              )}

              <div className="question-content">
                <div className="question-number">
                  Question {currentSession.currentQuestionIndex + 1}
                </div>
                <h2 className="question-text">{currentQuestion.text}</h2>

                <div className="answer-section">
                  <InputTextarea
                    className="w-full"
                    placeholder="Type your answer here..."
                    value={currentAnswer}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    rows={4}
                    disabled={isLoading}
                    autoResize
                  />
                  <div className="answer-counter">
                    {currentAnswer.length}/500
                  </div>
                </div>
              </div>

              <div className="question-actions">
                <Button
                  icon={<ArrowLeft size={20} />}
                  label="Previous"
                  className="p-button-text"
                  onClick={goToPreviousQuestion}
                  disabled={!canGoBack() || isLoading}
                />

                <Button
                  icon={
                    isLoading ? (
                      <Loader2 size={20} className="pi-spin" />
                    ) : (
                      <ArrowRight size={20} />
                    )
                  }
                  iconPos="right"
                  label={
                    isLoading
                      ? isLastQuestion
                        ? "Generating..."
                        : "Processing..."
                      : isLastQuestion
                        ? "Get Recommendations"
                        : "Next"
                  }
                  onClick={handleNext}
                  disabled={!canGoNext() || isLoading}
                  severity="primary"
                />
              </div>
            </div>

            {/* Rotating Tips */}
            <div className="question-tips">
              <div className={`rotating-tip ${isAnimating ? "animating" : ""}`}>
                <div className="tip-icon">
                  <TipIcon size={20} />
                </div>
                <div className="tip-content">
                  <span className="tip-label">Tip:</span>
                  <span className="tip-text">{currentTip.text}</span>
                </div>
              </div>

              {/* Tip indicators */}
              <div className="tip-indicators">
                {tips.map((_, index) => (
                  <button
                    key={index}
                    className={`tip-indicator ${index === currentTipIndex ? "active" : ""}`}
                    onClick={() => {
                      setIsAnimating(true);
                      setTimeout(() => {
                        setCurrentTipIndex(index);
                        setIsAnimating(false);
                      }, 200);
                    }}
                    aria-label={`Show tip ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="questions-page">
      <div className="container">
        <div className="loading-card glass">
          <div className="loading-content">
            <Loader2 className="loading-icon" />
            <h2 className="loading-title">Loading...</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionsPage;
