from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class UserRecommendationHistory(Base):
    __tablename__ = "recommendation_history"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="recommendation_history")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # "movie", "book", "both"
    timestamp = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="recommendations")
    questions = relationship("RecommendationQuestion", back_populates="recommendation")
    movie_recommendations = relationship(
        "MovieRecommendation", back_populates="recommendation"
    )
    book_recommendations = relationship(
        "BookRecommendation", back_populates="recommendation"
    )


class RecommendationQuestion(Base):
    __tablename__ = "recommendation_questions"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    recommendation_id = Column(
        String(36), ForeignKey("recommendations.id"), nullable=False
    )
    question_text = Column(String, nullable=False)
    question_order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    recommendation = relationship("Recommendation", back_populates="questions")
    answers = relationship("RecommendationAnswer", back_populates="question")


class RecommendationAnswer(Base):
    __tablename__ = "recommendation_answers"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    question_id = Column(
        String(36), ForeignKey("recommendation_questions.id"), nullable=False
    )
    answer_text = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    question = relationship("RecommendationQuestion", back_populates="answers")


# Many-to-many association tables for genres
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


class Genre(Base):
    __tablename__ = "genres"

    name = Column(String, primary_key=True)


class MovieRecommendation(Base):
    __tablename__ = "movie_recommendations"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    recommendation_id = Column(
        String(36), ForeignKey("recommendations.id"), nullable=False
    )
    title = Column(String, nullable=False)
    rating = Column(Float)  # 0-5 rating
    age_rating = Column(String)  # "G", "PG", "PG-13", etc.
    description = Column(Text)
    poster_path = Column(String)  # URL to movie poster
    tmdb_id = Column(String)  # TMDB movie ID for future reference
    release_date = Column(String)
    runtime = Column(Integer)  # Runtime in minutes
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    recommendation = relationship(
        "Recommendation", back_populates="movie_recommendations"
    )
    genres = relationship("Genre", secondary=movie_genres, backref="movies")


class BookRecommendation(Base):
    __tablename__ = "book_recommendations"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    recommendation_id = Column(
        String(36), ForeignKey("recommendations.id"), nullable=False
    )
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    rating = Column(Float)  # 0-5 rating
    age_rating = Column(String)  # "Children", "Teen", "Adult", etc.
    description = Column(Text)
    poster_path = Column(String)  # URL to book cover
    isbn = Column(String)  # ISBN for future reference
    published_date = Column(String)
    page_count = Column(Integer)
    publisher = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    recommendation = relationship(
        "Recommendation", back_populates="book_recommendations"
    )
    genres = relationship("Genre", secondary=book_genres, backref="books")
