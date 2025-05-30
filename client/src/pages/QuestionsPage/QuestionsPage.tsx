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

const QuestionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFeatureLimited, currentSubscription } = useSubscription();
  const maxQuestions = isFeatureLimited() ? 5 : 15;
  const planName = currentSubscription?.name || "Free Plan";
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

  const isLimited = isFeatureLimited();

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
      await startRecommendationSession(type);
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
              <h1 className="questions-title">
                Get Personalized Recommendations
              </h1>
              <p className="questions-subtitle">
                Our AI will ask you {maxQuestions} questions to understand your
                preferences and suggest the perfect movies or books just for
                you.
              </p>
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
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5.33333V8M8 10.6667H8.00667M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span>{error}</span>
                  </div>
                  <button onClick={clearError} className="error-message-close" aria-label="Close error message">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}

              <div className="type-grid" style={{ marginTop: "2rem" }}>
                <Card
                  className={classNames(
                    "type-card p-ripple",
                    "transform transition-all duration-300 hover:scale-105",
                  )}
                  onClick={() => !isLoading && handleStartSession("movie")}
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
                </Card>

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
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5.33333V8M8 10.6667H8.00667M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span>{error}</span>
                  </div>
                  <button onClick={clearError} className="error-message-close" aria-label="Close error message">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

export default QuestionsPage;
