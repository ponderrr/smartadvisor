// Updated RecommendationsResults.tsx with better error handling
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Star,
  Clock,
  Calendar,
  User,
  ExternalLink,
  Heart,
  Share2,
  RotateCcw,
  Sparkles,
  Film,
  Book,
  BookOpen,
  Play,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useRecommendations } from "../../context/RecommendationContext";
import { useAuth } from "../../context/AuthContext";
import { useSavedItems } from "../../context/SavedItemsContext";
import type {
  MovieRecommendation,
  BookRecommendation,
} from "../../services/api";
import "./RecommendationsResults.css";

const RecommendationsResults: React.FC = () => {
  const navigate = useNavigate();
  const { recommendationId } = useParams<{ recommendationId?: string }>();
  const { isAuthenticated } = useAuth();
  const {
    recommendations,
    isLoading,
    error,
    loadRecommendation,
    resetSession,
    clearError,
  } = useRecommendations();

  const {
    saveItem,
    unsaveItem,
    isItemSaved,
    error: saveError,
    clearError: clearSaveError,
  } = useSavedItems();

  const [isProcessingSave, setIsProcessingSave] = useState<string | null>(null);

  useEffect(() => {
    // If we have a recommendationId in URL, load that specific recommendation
    if (recommendationId && recommendationId !== recommendations?.id) {
      console.log("Loading recommendation from URL:", recommendationId);
      loadRecommendation(recommendationId);
    }

    // If no recommendations and no loading, redirect to questions
    if (!recommendations && !isLoading && !recommendationId) {
      console.log("No recommendations found, redirecting to questions");
      navigate("/questions", { replace: true });
    }
  }, [
    recommendationId,
    recommendations,
    isLoading,
    loadRecommendation,
    navigate,
  ]);

  useEffect(() => {
    clearError();
    clearSaveError();
  }, [clearError, clearSaveError]);

  // Save handler with real backend integration
  const handleSaveItem = async (
    item: MovieRecommendation | BookRecommendation,
    type: "movie" | "book"
  ) => {
    if (!isAuthenticated) {
      navigate("/signin");
      return;
    }

    try {
      setIsProcessingSave(item.id);
      clearSaveError();

      if (isItemSaved(item.id)) {
        await unsaveItem(item.id, type);
        console.log(`✅ Unsaved ${type}: ${item.title}`);
      } else {
        await saveItem(item, type);
        console.log(`💾 Saved ${type}: ${item.title}`);
      }
    } catch (error) {
      console.error(
        `Failed to ${isItemSaved(item.id) ? "unsave" : "save"} item:`,
        error
      );
    } finally {
      setIsProcessingSave(null);
    }
  };

  const handleShare = async (
    item: MovieRecommendation | BookRecommendation,
    type: "movie" | "book"
  ) => {
    const shareData = {
      title: `Check out this ${type} recommendation: ${item.title}`,
      text:
        item.description ||
        `I found this great ${type} recommendation on SmartAdvisor!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
    }
  };

  const handleStartOver = () => {
    resetSession();
    navigate("/questions");
  };

  const formatRating = (rating?: number) => {
    if (!rating) return "N/A";
    return `${rating.toFixed(1)}/5`;
  };

  const formatRuntime = (runtime?: number) => {
    if (!runtime) return "N/A";
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatPageCount = (pageCount?: number) => {
    if (!pageCount) return "N/A";
    return `${pageCount} pages`;
  };

  if (isLoading) {
    return (
      <div className="results-page">
        <div className="results-background">
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
              <h2 className="loading-title">Loading Your Recommendations</h2>
              <p className="loading-description">
                Preparing your personalized suggestions...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-page">
        <div className="results-background">
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
        <div className="container">
          <div className="error-card glass">
            <AlertCircle
              size={48}
              style={{ color: "#ef4444", marginBottom: "1.5rem" }}
            />
            <h2 className="error-title">Something went wrong</h2>
            <p className="error-message">{error}</p>
            <div className="error-actions">
              <button
                onClick={() => navigate("/questions")}
                className="btn-primary"
              >
                <RotateCcw size={20} />
                Try Again
              </button>
              <button onClick={() => navigate("/")} className="btn-glass">
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="results-page">
        <div className="results-background">
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
        <div className="container">
          <div className="empty-card glass">
            <Sparkles
              size={48}
              style={{ color: "var(--primary-500)", marginBottom: "1.5rem" }}
            />
            <h2 className="empty-title">No recommendations found</h2>
            <p className="empty-message">
              Let's get you some personalized suggestions!
            </p>
            <button
              onClick={() => navigate("/questions")}
              className="btn-primary"
            >
              <Sparkles size={20} />
              Get Recommendations
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasMovies = recommendations.movies && recommendations.movies.length > 0;
  const hasBooks = recommendations.books && recommendations.books.length > 0;
  const totalRecommendations =
    (recommendations.movies?.length || 0) +
    (recommendations.books?.length || 0);

  return (
    <div className="results-page">
      <div className="results-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className="container">
        <div className="results-container">
          {/* Header */}
          <div className="results-header">
            <div className="header-content glass">
              <div className="header-icon">
                <Sparkles size={32} />
              </div>
              <div className="header-text">
                <h1 className="results-title">
                  Your Personalized Recommendations
                </h1>
                <p className="results-subtitle">
                  Based on your preferences, here are{" "}
                  {totalRecommendations > 0 ? totalRecommendations : "some"}{" "}
                  carefully selected suggestions
                </p>
              </div>
              <button
                onClick={handleStartOver}
                className="btn-glass start-over-btn"
              >
                <RotateCcw size={20} />
                Start Over
              </button>
            </div>
          </div>

          {/* Save Error Display */}
          {saveError && (
            <div className="error-banner" style={{ marginBottom: "2rem" }}>
              <AlertCircle size={20} />
              <span>Save Error: {saveError}</span>
              <button onClick={clearSaveError} className="error-close">
                ×
              </button>
            </div>
          )}

          {/* Show message if no recommendations */}
          {!hasMovies && !hasBooks && (
            <div className="empty-card glass" style={{ marginBottom: "2rem" }}>
              <AlertCircle
                size={48}
                style={{ color: "var(--primary-500)", marginBottom: "1.5rem" }}
              />
              <h2 className="empty-title">No recommendations generated</h2>
              <p className="empty-message">
                Our AI couldn't generate recommendations based on your answers.
                This might be due to very specific or conflicting preferences,
                or we may be using fallback recommendations. Try answering the
                questions differently for better results.
              </p>
              <button onClick={handleStartOver} className="btn-primary">
                <RotateCcw size={20} />
                Try Different Answers
              </button>
            </div>
          )}

          {/* Movies Section */}
          {hasMovies && (
            <section className="recommendations-section">
              <div className="section-header">
                <div className="section-icon">
                  <Film size={24} />
                </div>
                <h2 className="section-title">Movie Recommendations</h2>
                <span className="section-count">
                  {recommendations.movies!.length} movies
                </span>
              </div>

              <div className="recommendations-grid">
                {recommendations.movies!.map((movie, index) => (
                  <div
                    key={movie.id}
                    className="recommendation-card glass"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="card-header">
                      {movie.poster_path && (
                        <div className="poster-container">
                          <img
                            src={movie.poster_path}
                            alt={`${movie.title} poster`}
                            className="poster-image"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div className="poster-overlay">
                            <Play size={48} />
                          </div>
                        </div>
                      )}
                      <div className="card-actions">
                        <button
                          onClick={() => handleSaveItem(movie, "movie")}
                          className={`action-btn ${
                            isItemSaved(movie.id) ? "saved" : ""
                          }`}
                          disabled={isProcessingSave === movie.id}
                          title={
                            isItemSaved(movie.id)
                              ? "Remove from saved"
                              : "Save for later"
                          }
                        >
                          {isProcessingSave === movie.id ? (
                            <Loader2 size={20} className="loading-spinner" />
                          ) : (
                            <Heart size={20} />
                          )}
                        </button>
                        <button
                          onClick={() => handleShare(movie, "movie")}
                          className="action-btn"
                          title="Share this recommendation"
                        >
                          <Share2 size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="card-content">
                      <h3 className="item-title">{movie.title}</h3>

                      <div className="item-meta">
                        {movie.rating && (
                          <div className="meta-item">
                            <Star size={16} />
                            <span>{formatRating(movie.rating)}</span>
                          </div>
                        )}
                        {movie.runtime && (
                          <div className="meta-item">
                            <Clock size={16} />
                            <span>{formatRuntime(movie.runtime)}</span>
                          </div>
                        )}
                        {movie.release_date && (
                          <div className="meta-item">
                            <Calendar size={16} />
                            <span>
                              {new Date(movie.release_date).getFullYear()}
                            </span>
                          </div>
                        )}
                        {movie.age_rating && (
                          <div className="meta-item age-rating">
                            <span>{movie.age_rating}</span>
                          </div>
                        )}
                      </div>

                      {movie.genres && movie.genres.length > 0 && (
                        <div className="item-genres">
                          {movie.genres.slice(0, 3).map((genre) => (
                            <span key={genre} className="genre-tag">
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}

                      {movie.description && (
                        <p className="item-description">{movie.description}</p>
                      )}

                      <div className="card-footer">
                        <button className="btn-primary view-details-btn">
                          <ExternalLink size={16} />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Footer Actions */}
          <div className="results-footer">
            <div className="footer-content glass">
              <div className="footer-text">
                <h3>Love these recommendations?</h3>
                <p>
                  Save your favorites and get more personalized suggestions by
                  answering different questions or exploring new categories.
                </p>
              </div>
              <div className="footer-actions">
                <button onClick={handleStartOver} className="btn-outline">
                  <RotateCcw size={20} />
                  Try Different Questions
                </button>
                {!isAuthenticated ? (
                  <button
                    onClick={() => navigate("/signup")}
                    className="btn-primary"
                  >
                    <Sparkles size={20} />
                    Sign Up for More
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/account?tab=history")}
                    className="btn-primary"
                  >
                    <Heart size={20} />
                    View Saved Items
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Books Section */}
          {hasBooks && (
            <section className="recommendations-section">
              <div className="section-header">
                <div className="section-icon">
                  <Book size={24} />
                </div>
                <h2 className="section-title">Book Recommendations</h2>
                <span className="section-count">
                  {recommendations.books!.length} books
                </span>
              </div>

              <div className="recommendations-grid">
                {recommendations.books!.map((book, index) => (
                  <div
                    key={book.id}
                    className="recommendation-card glass"
                    style={{
                      animationDelay: `${
                        (hasMovies ? recommendations.movies!.length : 0) +
                        index * 0.1
                      }s`,
                    }}
                  >
                    <div className="card-header">
                      {book.poster_path && (
                        <div className="poster-container">
                          <img
                            src={book.poster_path}
                            alt={`${book.title} cover`}
                            className="poster-image"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div className="poster-overlay">
                            <BookOpen size={48} />
                          </div>
                        </div>
                      )}
                      <div className="card-actions">
                        <button
                          onClick={() => handleSaveItem(book, "book")}
                          className={`action-btn ${
                            isItemSaved(book.id) ? "saved" : ""
                          }`}
                          disabled={isProcessingSave === book.id}
                          title={
                            isItemSaved(book.id)
                              ? "Remove from saved"
                              : "Save for later"
                          }
                        >
                          {isProcessingSave === book.id ? (
                            <Loader2 size={20} className="loading-spinner" />
                          ) : (
                            <Heart size={20} />
                          )}
                        </button>
                        <button
                          onClick={() => handleShare(book, "book")}
                          className="action-btn"
                          title="Share this recommendation"
                        >
                          <Share2 size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="card-content">
                      <h3 className="item-title">{book.title}</h3>

                      {book.author && (
                        <div className="item-author">
                          <User size={16} />
                          <span>by {book.author}</span>
                        </div>
                      )}

                      <div className="item-meta">
                        {book.rating && (
                          <div className="meta-item">
                            <Star size={16} />
                            <span>{formatRating(book.rating)}</span>
                          </div>
                        )}
                        {book.page_count && (
                          <div className="meta-item">
                            <BookOpen size={16} />
                            <span>{formatPageCount(book.page_count)}</span>
                          </div>
                        )}
                        {book.published_date && (
                          <div className="meta-item">
                            <Calendar size={16} />
                            <span>
                              {new Date(book.published_date).getFullYear()}
                            </span>
                          </div>
                        )}
                        {book.age_rating && (
                          <div className="meta-item age-rating">
                            <span>{book.age_rating}</span>
                          </div>
                        )}
                      </div>

                      {book.genres && book.genres.length > 0 && (
                        <div className="item-genres">
                          {book.genres.slice(0, 3).map((genre) => (
                            <span key={genre} className="genre-tag">
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}

                      {book.description && (
                        <p className="item-description">{book.description}</p>
                      )}

                      <div className="card-footer">
                        <button className="btn-primary view-details-btn">
                          <ExternalLink size={16} />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationsResults;
