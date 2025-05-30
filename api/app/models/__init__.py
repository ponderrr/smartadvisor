from .user import User
from .subscription import Subscription
from .preferences import UserPreferences
from .recommendation import (
    UserRecommendationHistory,
    Recommendation,
    RecommendationQuestion,
    RecommendationAnswer,
    Genre,
    MovieRecommendation,
    BookRecommendation,
    movie_genres,
    book_genres,
)

from ..core.database import Base

__all__ = [
    "Base",
    "User",
    "Subscription",
    "UserPreferences",
    "UserRecommendationHistory",
    "Recommendation",
    "RecommendationQuestion",
    "RecommendationAnswer",
    "Genre",
    "MovieRecommendation",
    "BookRecommendation",
    "movie_genres",
    "book_genres",
]
