import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  History,
  Film,
  Book,
  Star,
  Calendar,
  Download,
  Trash2,
  Eye,
  AlertCircle,
  Loader2,
  Search,
  RefreshCw,
} from "lucide-react";
import { useRecommendations } from "../../../context/RecommendationContext";
import "./AccountComponents.css";

const HistoryTab: React.FC = () => {
  const navigate = useNavigate();
  const {
    history: recommendationHistory,
    loadRecommendationHistory,
    isLoading,
  } = useRecommendations();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [filterBy, setFilterBy] = useState<"all" | "movie" | "book" | "both">(
    "all",
  );

  useEffect(() => {
    loadRecommendationHistory();
  }, [loadRecommendationHistory]);

  const handleViewRecommendation = (recommendationId: string) => {
    navigate(`/recommendations/${recommendationId}`);
  };

  const handleDeleteRecommendation = async (recommendationId: string) => {
    // TODO: Implement delete functionality
    console.log("Delete recommendation:", recommendationId);
  };

  const handleExportHistory = () => {
    // TODO: Implement export functionality
    console.log("Export history");
  };

  const filteredHistory = recommendationHistory
    .filter((item) => {
      const matchesSearch = item.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterBy === "all" || item.title.toLowerCase().includes(filterBy);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else {
        return a.title.localeCompare(b.title);
      }
    });

  const getRecommendationType = (title: string): "movie" | "book" | "both" => {
    if (title.toLowerCase().includes("movie")) return "movie";
    if (title.toLowerCase().includes("book")) return "book";
    return "both";
  };

  const getTypeIcon = (type: "movie" | "book" | "both") => {
    switch (type) {
      case "movie":
        return <Film size={16} />;
      case "book":
        return <Book size={16} />;
      case "both":
        return <Star size={16} />;
    }
  };

  if (isLoading && recommendationHistory.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--space-12)",
          textAlign: "center",
        }}
      >
        <Loader2
          size={48}
          className="loading-spinner"
          style={{
            color: "var(--primary-500)",
            marginBottom: "var(--space-6)",
          }}
        />
        <h3
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--neutral-800)",
            marginBottom: "var(--space-2)",
          }}
        >
          Loading History
        </h3>
        <p style={{ color: "var(--neutral-600)" }}>
          Fetching your recommendation history...
        </p>
      </div>
    );
  }

  return (
    <div className="form-section">
      {/* Section Header */}
      <div className="section-header">
        <h2 className="section-title">Recommendation History</h2>
        {recommendationHistory.length > 0 && (
          <button onClick={handleExportHistory} className="btn-edit">
            <Download size={16} />
            Export History
          </button>
        )}
      </div>

      {recommendationHistory.length === 0 && !isLoading ? (
        /* Empty State */
        <div
          style={{
            background: "var(--glass-white)",
            padding: "var(--space-12)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            textAlign: "center",
          }}
        >
          <History
            size={64}
            style={{
              color: "var(--neutral-400)",
              marginBottom: "var(--space-6)",
            }}
          />
          <h3
            style={{
              fontSize: "var(--text-xl)",
              fontWeight: "var(--weight-semibold)",
              color: "var(--neutral-800)",
              marginBottom: "var(--space-4)",
            }}
          >
            No Recommendations Yet
          </h3>
          <p
            style={{
              color: "var(--neutral-600)",
              marginBottom: "var(--space-6)",
              maxWidth: "400px",
              margin: "0 auto var(--space-6)",
            }}
          >
            Start getting personalized recommendations to see your history here.
            Your past recommendations will be saved for easy access.
          </p>
          <button onClick={() => navigate("/questions")} className="btn-save">
            <Star size={16} />
            Get Recommendations
          </button>
        </div>
      ) : (
        <>
          {/* Search and Filters */}
          <div
            style={{
              background: "var(--glass-white)",
              padding: "var(--space-6)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              marginBottom: "var(--space-8)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: "var(--space-4)",
                alignItems: "center",
              }}
            >
              {/* Search */}
              <div style={{ position: "relative" }}>
                <Search
                  size={20}
                  style={{
                    position: "absolute",
                    left: "var(--space-4)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--neutral-500)",
                  }}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search recommendations..."
                  className="form-input"
                  style={{ paddingLeft: "3rem" }}
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "title")}
                className="form-input"
                style={{ minWidth: "150px" }}
              >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
              </select>

              {/* Filter */}
              <select
                value={filterBy}
                onChange={(e) =>
                  setFilterBy(
                    e.target.value as "all" | "movie" | "book" | "both",
                  )
                }
                className="form-input"
                style={{ minWidth: "150px" }}
              >
                <option value="all">All Types</option>
                <option value="movie">Movies</option>
                <option value="book">Books</option>
                <option value="both">Both</option>
              </select>
            </div>

            {/* Results Count */}
            <div
              style={{
                marginTop: "var(--space-4)",
                paddingTop: "var(--space-4)",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                fontSize: "var(--text-sm)",
                color: "var(--neutral-600)",
              }}
            >
              Showing {filteredHistory.length} of {recommendationHistory.length}{" "}
              recommendations
              {searchTerm && ` for "${searchTerm}"`}
            </div>
          </div>

          {/* History List */}
          {filteredHistory.length === 0 ? (
            <div
              style={{
                background: "var(--glass-white)",
                padding: "var(--space-8)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                textAlign: "center",
              }}
            >
              <AlertCircle
                size={48}
                style={{
                  color: "var(--neutral-400)",
                  marginBottom: "var(--space-4)",
                }}
              />
              <h3
                style={{
                  fontSize: "var(--text-lg)",
                  fontWeight: "var(--weight-semibold)",
                  color: "var(--neutral-800)",
                  marginBottom: "var(--space-2)",
                }}
              >
                No Results Found
              </h3>
              <p style={{ color: "var(--neutral-600)" }}>
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div
              style={{
                background: "var(--glass-white)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                overflow: "hidden",
              }}
            >
              {filteredHistory.map((item, index) => {
                const type = getRecommendationType(item.title);
                const typeIcon = getTypeIcon(type);

                return (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--space-6)",
                      borderBottom:
                        index < filteredHistory.length - 1
                          ? "1px solid rgba(255, 255, 255, 0.1)"
                          : "none",
                      transition: "all var(--transition-normal)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--glass-white)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-4)",
                        flex: 1,
                      }}
                    >
                      {/* Type Icon */}
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          background:
                            type === "movie"
                              ? "rgba(239, 68, 68, 0.1)"
                              : type === "book"
                                ? "rgba(59, 130, 246, 0.1)"
                                : "var(--glass-primary)",
                          color:
                            type === "movie"
                              ? "#ef4444"
                              : type === "book"
                                ? "#3b82f6"
                                : "var(--primary-500)",
                          borderRadius: "var(--radius-md)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {typeIcon}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4
                          style={{
                            fontSize: "var(--text-base)",
                            fontWeight: "var(--weight-semibold)",
                            color: "var(--neutral-800)",
                            marginBottom: "var(--space-1)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.title}
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-4)",
                            fontSize: "var(--text-sm)",
                            color: "var(--neutral-600)",
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "var(--space-1)",
                            }}
                          >
                            <Calendar size={14} />
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                          <span
                            style={{
                              padding: "var(--space-1) var(--space-2)",
                              background:
                                type === "movie"
                                  ? "rgba(239, 68, 68, 0.1)"
                                  : type === "book"
                                    ? "rgba(59, 130, 246, 0.1)"
                                    : "var(--glass-primary)",
                              color:
                                type === "movie"
                                  ? "#ef4444"
                                  : type === "book"
                                    ? "#3b82f6"
                                    : "var(--primary-600)",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "var(--text-xs)",
                              fontWeight: "var(--weight-medium)",
                              textTransform: "capitalize",
                            }}
                          >
                            {type === "both" ? "Movies & Books" : type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        flexShrink: 0,
                      }}
                    >
                      <button
                        onClick={() => handleViewRecommendation(item.id)}
                        style={{
                          padding: "var(--space-2)",
                          background: "var(--glass-white)",
                          border: "1px solid rgba(255, 255, 255, 0.18)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--neutral-600)",
                          cursor: "pointer",
                          transition: "all var(--transition-normal)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "var(--glass-primary)";
                          e.currentTarget.style.color = "var(--primary-500)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "var(--glass-white)";
                          e.currentTarget.style.color = "var(--neutral-600)";
                        }}
                        title="View Recommendation"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => handleDeleteRecommendation(item.id)}
                        style={{
                          padding: "var(--space-2)",
                          background: "var(--glass-white)",
                          border: "1px solid rgba(255, 255, 255, 0.18)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--neutral-600)",
                          cursor: "pointer",
                          transition: "all var(--transition-normal)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(239, 68, 68, 0.1)";
                          e.currentTarget.style.color = "#ef4444";
                          e.currentTarget.style.borderColor =
                            "rgba(239, 68, 68, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "var(--glass-white)";
                          e.currentTarget.style.color = "var(--neutral-600)";
                          e.currentTarget.style.borderColor =
                            "rgba(255, 255, 255, 0.18)";
                        }}
                        title="Delete Recommendation"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Refresh Button */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "var(--space-8)",
            }}
          >
            <button
              onClick={loadRecommendationHistory}
              disabled={isLoading}
              className="btn-edit"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="loading-spinner" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Refresh History
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HistoryTab;
