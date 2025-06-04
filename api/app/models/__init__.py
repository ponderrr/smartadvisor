# api/app/models/__init__.py - UPDATED VERSION
from .user import User
from .subscription import Subscription
from .preferences import UserPreferences
from .saved_item import SavedItem  # Add this import
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
    "SavedItem",  # Add this to exports
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
