from typing import List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.crud.base import CRUDBase
from app.models.recommendation import (
    Recommendation,
    RecommendationQuestion,
    RecommendationAnswer,
    MovieRecommendation,
    BookRecommendation,
    UserRecommendationHistory,
)


class CRUDRecommendation(CRUDBase[Recommendation, None, None]):
    async def get_by_user_id(
        self, db: AsyncSession, *, user_id: str, skip: int = 0, limit: int = 10
    ) -> List[Recommendation]:
        """Get user's recommendations with related data."""
        result = await db.execute(
            select(Recommendation)
            .where(Recommendation.user_id == user_id)
            .options(
                selectinload(Recommendation.questions),
                selectinload(Recommendation.movie_recommendations),
                selectinload(Recommendation.book_recommendations),
            )
            .order_by(desc(Recommendation.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_with_details(
        self, db: AsyncSession, *, recommendation_id: str
    ) -> Optional[Recommendation]:
        """Get recommendation with all related data."""
        result = await db.execute(
            select(Recommendation)
            .where(Recommendation.id == recommendation_id)
            .options(
                selectinload(Recommendation.questions).selectinload(
                    RecommendationQuestion.answers
                ),
                selectinload(Recommendation.movie_recommendations),
                selectinload(Recommendation.book_recommendations),
            )
        )
        return result.scalar_one_or_none()


recommendation_crud = CRUDRecommendation(Recommendation)
