from pydantic import BaseModel, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class RecommendationType(str, Enum):
    MOVIE = "movie"
    BOOK = "book"
    BOTH = "both"


class QuestionGenerationRequest(BaseModel):
    type: RecommendationType
    num_questions: int = 5

    @validator("num_questions")
    def validate_num_questions(cls, v):
        if not 3 <= v <= 15:
            raise ValueError("Number of questions must be between 3 and 15")
        return v


class Question(BaseModel):
    id: str
    text: str
    order: int


class Answer(BaseModel):
    question_id: str
    answer_text: str


class AnswerSubmission(BaseModel):
    recommendation_id: str
    answers: List[Answer]


class GenreSchema(BaseModel):
    name: str


class MovieRecommendationResponse(BaseModel):
    id: str
    title: str
    rating: Optional[float] = None
    age_rating: Optional[str] = None
    description: Optional[str] = None
    poster_path: Optional[str] = None
    release_date: Optional[str] = None
    runtime: Optional[int] = None
    genres: List[str] = []

    class Config:
        from_attributes = True


class BookRecommendationResponse(BaseModel):
    id: str
    title: str
    author: str
    rating: Optional[float] = None
    age_rating: Optional[str] = None
    description: Optional[str] = None
    poster_path: Optional[str] = None
    published_date: Optional[str] = None
    page_count: Optional[int] = None
    publisher: Optional[str] = None
    genres: List[str] = []

    class Config:
        from_attributes = True


class RecommendationResponse(BaseModel):
    id: str
    type: RecommendationType
    created_at: datetime
    questions: List[Question] = []
    movies: List[MovieRecommendationResponse] = []
    books: List[BookRecommendationResponse] = []

    class Config:
        from_attributes = True


class RecommendationHistoryResponse(BaseModel):
    id: str
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


# Response wrapper for paginated results
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    pages: int
    has_next: bool
    has_prev: bool
