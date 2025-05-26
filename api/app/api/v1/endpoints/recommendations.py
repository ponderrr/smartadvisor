from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.recommendation import Recommendation
from app.models.subscription import Subscription
from app.crud.recommendation import recommendation_crud
from app.services.recommendation_service import recommendation_service
from app.schemas.recommendation import (
    QuestionGenerationRequest,
    AnswerSubmission,
    RecommendationResponse,
    Question,
    RecommendationHistoryResponse,
    MovieRecommendationResponse,
    BookRecommendationResponse,
)

router = APIRouter()


async def get_user_subscription_tier(db: AsyncSession, user_id: str) -> str:
    """Get user's subscription tier."""
    try:
        result = await db.execute(
            select(Subscription).where(Subscription.user_id == user_id)
        )
        subscription = result.scalar_one_or_none()
        return subscription.tier if subscription else "free"
    except Exception:
        return "free"


@router.post("/generate-questions")
async def generate_questions(
    request: QuestionGenerationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Generate questions for a recommendation session."""

    user_tier = await get_user_subscription_tier(db, current_user.id)

    max_questions = 5 if user_tier == "free" else 15
    if request.num_questions > max_questions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your subscription allows up to {max_questions} questions",
        )

    try:
        recommendation = await recommendation_service.generate_questions(
            db=db,
            user=current_user,
            recommendation_type=request.type,
            num_questions=request.num_questions,
        )

        questions = [
            Question(id=q.id, text=q.question_text, order=q.question_order)
            for q in sorted(recommendation.questions, key=lambda x: x.question_order)
        ]

        return {"recommendation_id": recommendation.id, "questions": questions}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate questions: {str(e)}",
        )


@router.post("/submit-answers", response_model=RecommendationResponse)
async def submit_answers(
    submission: AnswerSubmission,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Submit answers and get recommendations."""

    recommendation = await recommendation_crud.get_with_details(
        db, recommendation_id=submission.recommendation_id
    )

    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation session not found",
        )

    if recommendation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this recommendation",
        )

    try:
        updated_recommendation = await recommendation_service.process_answers(
            db=db, recommendation=recommendation, answers=submission.answers
        )

        questions = [
            Question(id=q.id, text=q.question_text, order=q.question_order)
            for q in sorted(
                updated_recommendation.questions, key=lambda x: x.question_order
            )
        ]

        movies = [
            MovieRecommendationResponse(
                id=movie.id,
                title=movie.title,
                rating=movie.rating,
                age_rating=movie.age_rating,
                description=movie.description,
                poster_path=movie.poster_path,
                release_date=movie.release_date,
                runtime=movie.runtime,
                genres=[],
            )
            for movie in updated_recommendation.movie_recommendations or []
        ]

        books = [
            BookRecommendationResponse(
                id=book.id,
                title=book.title,
                author=book.author,
                rating=book.rating,
                age_rating=book.age_rating,
                description=book.description,
                poster_path=book.poster_path,
                published_date=book.published_date,
                page_count=book.page_count,
                publisher=book.publisher,
                genres=[],
            )
            for book in updated_recommendation.book_recommendations or []
        ]

        return RecommendationResponse(
            id=updated_recommendation.id,
            type=updated_recommendation.type,
            created_at=updated_recommendation.created_at,
            questions=questions,
            movies=movies,
            books=books,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process recommendations: {str(e)}",
        )


@router.get("/history")
async def get_recommendation_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get user's recommendation history."""

    recommendations = await recommendation_crud.get_by_user_id(
        db, user_id=current_user.id, skip=skip, limit=limit
    )

    history_items = []
    for rec in recommendations:
        movie_count = len(rec.movie_recommendations or [])
        book_count = len(rec.book_recommendations or [])

        if movie_count > 0 and book_count > 0:
            title = f"Movies & Books - {movie_count + book_count} recommendations"
        elif movie_count > 0:
            title = f"Movies - {movie_count} recommendations"
        elif book_count > 0:
            title = f"Books - {book_count} recommendations"
        else:
            title = "Recommendation Session"

        history_items.append(
            RecommendationHistoryResponse(
                id=rec.id, title=title, created_at=rec.created_at
            )
        )

    return {
        "items": history_items,
        "total": len(history_items),
        "skip": skip,
        "limit": limit,
    }


@router.get("/{recommendation_id}", response_model=RecommendationResponse)
async def get_recommendation_details(
    recommendation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get detailed recommendation results."""

    recommendation = await recommendation_crud.get_with_details(
        db, recommendation_id=recommendation_id
    )

    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found"
        )

    if recommendation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this recommendation",
        )

    questions = [
        Question(id=q.id, text=q.question_text, order=q.question_order)
        for q in sorted(recommendation.questions, key=lambda x: x.question_order)
    ]

    movies = [
        MovieRecommendationResponse(
            id=movie.id,
            title=movie.title,
            rating=movie.rating,
            age_rating=movie.age_rating,
            description=movie.description,
            poster_path=movie.poster_path,
            release_date=movie.release_date,
            runtime=movie.runtime,
            genres=[],
        )
        for movie in recommendation.movie_recommendations or []
    ]

    books = [
        BookRecommendationResponse(
            id=book.id,
            title=book.title,
            author=book.author,
            rating=book.rating,
            age_rating=book.age_rating,
            description=book.description,
            poster_path=book.poster_path,
            published_date=book.published_date,
            page_count=book.page_count,
            publisher=book.publisher,
            genres=[],
        )
        for book in recommendation.book_recommendations or []
    ]

    return RecommendationResponse(
        id=recommendation.id,
        type=recommendation.type,
        created_at=recommendation.created_at,
        questions=questions,
        movies=movies,
        books=books,
    )
