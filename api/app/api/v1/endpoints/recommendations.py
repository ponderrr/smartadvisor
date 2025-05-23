from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.recommendation import Recommendation
from app.crud.recommendation import recommendation_crud
from app.services.recommendation_service import recommendation_service
from app.schemas.recommendation import (
    QuestionGenerationRequest,
    AnswerSubmission,
    RecommendationResponse,
    Question,
    RecommendationHistoryResponse,
)

router = APIRouter()


@router.post("/generate-questions")
async def generate_questions(
    request: QuestionGenerationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Generate questions for a recommendation session."""

    # Check if user can generate this many questions (subscription limits)
    user_tier = "free"  # Default
    if hasattr(current_user, "subscription") and current_user.subscription:
        user_tier = current_user.subscription.tier

    # Apply limits based on subscription
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

        # Format questions for response
        questions = [
            Question(id=q.id, text=q.question_text, order=q.question_order)
            for q in sorted(recommendation.questions, key=lambda x: x.question_order)
        ]

        return {"recommendation_id": recommendation.id, "questions": questions}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate questions",
        )


@router.post("/submit-answers", response_model=RecommendationResponse)
async def submit_answers(
    submission: AnswerSubmission,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Submit answers and get recommendations."""

    # Get the recommendation with questions
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
        # Process answers and generate recommendations
        updated_recommendation = await recommendation_service.process_answers(
            db=db, recommendation=recommendation, answers=submission.answers
        )

        # Format response
        questions = [
            Question(id=q.id, text=q.question_text, order=q.question_order)
            for q in sorted(
                updated_recommendation.questions, key=lambda x: x.question_order
            )
        ]

        return RecommendationResponse(
            id=updated_recommendation.id,
            type=updated_recommendation.type,
            created_at=updated_recommendation.created_at,
            questions=questions,
            movies=[],  # Will be populated by response_model
            books=[],  # Will be populated by response_model
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process recommendations",
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
        # Create a title based on the recommendations
        if rec.movie_recommendations and rec.book_recommendations:
            title = f"Movies & Books - {len(rec.movie_recommendations + rec.book_recommendations)} recommendations"
        elif rec.movie_recommendations:
            title = f"Movies - {len(rec.movie_recommendations)} recommendations"
        elif rec.book_recommendations:
            title = f"Books - {len(rec.book_recommendations)} recommendations"
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

    return recommendation
