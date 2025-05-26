import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Film,
  Book,
  Star,
  ChevronRight,
  Loader2,
  RotateCcw,
  Crown,
  Zap,
} from "lucide-react";
import { useRecommendations } from "../../context/RecommendationContext";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import "./QuestionsPage.css";

type RecommendationType = "movie" | "book" | "both";

const QuestionsPage: React.FC = () => {
  const navigate = useNavigate();
  useAuth();
  const { getMaxQuestions, isFeatureLimited, currentSubscription } =
    useSubscription();
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

  // Get subscription info
  const maxQuestions = getMaxQuestions();
  const isLimited = isFeatureLimited();
  const planName =
    currentSubscription?.tier === "free" ? "Free Plan" : "Premium Plan";

  // Reset session when component mounts
  useEffect(() => {
    resetSession();
    clearError();
  }, [resetSession, clearError]);

  // Redirect to results when recommendations are ready
  useEffect(() => {
    if (recommendations && currentSession.isComplete) {
      navigate("/recommendations/results", { replace: true });
    }
  }, [recommendations, currentSession.isComplete, navigate]);

  const handleStartSession = async (type: RecommendationType) => {
    try {
      setIsStarting(true);
      setSelectedType(type);

      // Use subscription-based question count
      await startRecommendationSession(type, maxQuestions);
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

  // Step 1: Type Selection
  if (!currentSession.id && !isStarting) {
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
              <div className="header-icon glass-primary">
                <Sparkles size={32} />
              </div>
              <h1 className="questions-title">
                Get Personalized Recommendations
              </h1>
              <p className="questions-subtitle">
                Our AI will ask you {maxQuestions} questions to understand your
                preferences and suggest the perfect movies or books just for
                you.
              </p>

              {/* Subscription Status */}
              <div className="subscription-status">
                <div
                  className={`status-badge ${
                    currentSubscription?.tier || "free"
                  }`}
                >
                  {isLimited ? (
                    <>
                      <Sparkles size={16} />
                      {planName}
                    </>
                  ) : (
                    <>
                      <Crown size={16} />
                      {planName}
                    </>
                  )}
                </div>
                <span className="status-text">
                  {maxQuestions} questions • Enhanced AI recommendations
                </span>
              </div>
            </div>

            {/* Type Selection */}
            <div className="type-selection glass">
              <h2 className="selection-title">
                What would you like recommendations for?
              </h2>

              {error && (
                <div className="error-banner animate-slide-up">
                  <span>{error}</span>
                  <button onClick={clearError} className="error-close">
                    ×
                  </button>
                </div>
              )}

              <div className="type-grid">
                <button
                  className="type-card"
                  onClick={() => handleStartSession("movie")}
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
                </button>

                <button
                  className="type-card"
                  onClick={() => handleStartSession("book")}
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
                  onClick={() => handleStartSession("both")}
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
                        Upgrade to Premium for <strong>15 questions</strong>,
                        enhanced AI analysis, and priority support!
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

  // Step 2: Loading State
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
              <div className="loading-icon">
                <Sparkles className="sparkle-icon" />
                <Loader2 className="loader-icon" />
              </div>
              <h2 className="loading-title">Generating Your Questions</h2>
              <p className="loading-description">
                Our AI is creating personalized questions based on your
                preferences...
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

  // Step 3: Questions Flow
  if (currentQuestion) {
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
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="question-card glass">
              {error && (
                <div className="error-banner animate-slide-up">
                  <span>{error}</span>
                  <button onClick={clearError} className="error-close">
                    ×
                  </button>
                </div>
              )}

              <div className="question-content">
                <div className="question-number">
                  Question {currentSession.currentQuestionIndex + 1}
                </div>
                <h2 className="question-text">{currentQuestion.text}</h2>

                <div className="answer-section">
                  <textarea
                    className="answer-input"
                    placeholder="Type your answer here..."
                    value={currentAnswer}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    rows={4}
                    disabled={isLoading}
                  />
                  <div className="answer-counter">
                    {currentAnswer.length}/500
                  </div>
                </div>
              </div>

              <div className="question-actions">
                <button
                  onClick={goToPreviousQuestion}
                  className="btn-glass"
                  disabled={!canGoBack() || isLoading}
                >
                  <ArrowLeft size={20} />
                  Previous
                </button>

                <button
                  onClick={handleNext}
                  className="btn-primary"
                  disabled={!canGoNext() || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="loading-spinner" />
                      {isLastQuestion ? "Generating..." : "Processing..."}
                    </>
                  ) : (
                    <>
                      {isLastQuestion ? "Get Recommendations" : "Next"}
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="question-tips">
              <p>
                💡 <strong>Tip:</strong> Be as specific as possible to get
                better recommendations!
              </p>
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

function setSelectedType(_type: string) {
  throw new Error("Function not implemented.");
}

export default QuestionsPage;
