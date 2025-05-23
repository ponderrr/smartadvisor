from sqlalchemy import (
    Table,
    Column,
    String,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Float,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    username = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    age = Column(Integer)
    profile_picture_url = Column(String)
    profile_picture_updated = Column(String)
    stripe_customer_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    user_id = Column(String(36), ForeignKey("users.id"))
    tier = Column(String)  # "free", "premium-monthly", "premium-annual"
    status = Column(String)  # "active", "canceled", "past_due"
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)
    cancel_at_period_end = Column(Boolean)
    price_id = Column(String)  # Stripe price ID?
    customer_id = Column(String)  # Stripe customer ID
    stripe_subscription_id = Column(String)
    stripe_subscription_item_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    user_id = Column(String(36), ForeignKey("users.id"))
    accessibility_require_subtitles = Column(Boolean)
    accessibility_require_audio_description = Column(Boolean)
    accessibility_require_closed_captions = Column(Boolean)
    content_filters_exclude_violent_content = Column(Boolean)
    content_filters_exclude_sexual_content = Column(Boolean)
    language = Column(String)  # Preferred language code (e.g., "en", "es")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserRecommendationHistory(Base):
    __tablename__ = "recommendation_history"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    user_id = Column(String(36), ForeignKey("users.id"))
    title = Column(String)  # Title of the recommended content
    created_at = Column(DateTime, default=datetime.utcnow)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    user_id = Column(String(36), ForeignKey("users.id"))
    type = Column(String)  # "movie", "book", or "both"
    timestamp = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


class RecommendationQuestions(Base):
    __tablename__ = "recommendation_questions"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    recommendation_id = Column(String(36), ForeignKey("recommendations.id"))
    question_text = Column(String)  # Text of the question
    question_order = Column(
        Integer
    )  # Order of the question in the recommendation process
    created_at = Column(DateTime, default=datetime.utcnow)


class RecommendationAnswers(Base):
    __tablename__ = "recommendation_answers"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    question_id = Column(String(36), ForeignKey("recommendation_questions.id"))
    answer_text = Column(String)  # Text of the answer
    created_at = Column(DateTime, default=datetime.utcnow)


class MovieRecommendations(Base):
    __tablename__ = "movie_recommendations"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    recommendation_id = Column(String(36), ForeignKey("recommendations.id"))
    title = Column(String)  # Title of the movie
    rating = Column(Float)  # 0-5 rating
    age_rating = Column(String)  # "G", "PG", "PG-13", etc.
    description = Column(Text)
    poster_path = Column(String)  # URL to movie poster
    created_at = Column(DateTime, default=datetime.utcnow)

    genres = relationship("Genre", secondary="movie_genres", backref="movies")


class Genre(Base):
    __tablename__ = "genres"

    name = Column(String, primary_key=True)


movie_genres = Table(
    "movie_genres",
    Base.metadata,
    Column(
        "movie_recommendation_id",
        String(36),
        ForeignKey("movie_recommendations.id"),
        primary_key=True,
    ),
    Column("genre", String, ForeignKey("genres.name"), primary_key=True),
)

book_genres = Table(
    "book_genres",
    Base.metadata,
    Column(
        "book_recommendation_id",
        String(36),
        ForeignKey("book_recommendations.id"),
        primary_key=True,
    ),
    Column("genre", String, ForeignKey("genres.name"), primary_key=True),
)


class BookRecommendations(Base):
    __tablename__ = "book_recommendations"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    recommendation_id = Column(String(36), ForeignKey("recommendations.id"))
    title = Column(String)  # Title of the book
    author = Column(String)  # Author of the book
    rating = Column(Float)  # 0-5 rating
    age_rating = Column(String)  # "Children", "Teen", "Adult", etc.
    description = Column(Text)
    poster_path = Column(String)  # URL to book cover
    created_at = Column(DateTime, default=datetime.utcnow)

    genres = relationship("Genre", secondary=book_genres, backref="books")
