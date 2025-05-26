from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from app.models.recommendation import (
    Recommendation,
    RecommendationQuestion,
    RecommendationAnswer,
    MovieRecommendation,
    BookRecommendation,
)
from app.models.user import User
from app.models.preferences import UserPreferences
from app.schemas.recommendation import RecommendationType, Answer
from app.services.openai_service import openai_service
from app.services.tmdb_service import tmdb_service
from app.services.books_service import books_service
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class RecommendationService:
    async def get_user_preferences(
        self, db: AsyncSession, user: User
    ) -> Optional[UserPreferences]:
        """Get user preferences from database."""
        try:
            result = await db.execute(
                select(UserPreferences).where(UserPreferences.user_id == user.id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.warning(f"Could not fetch user preferences: {e}")
            return None

    async def generate_questions(
        self,
        db: AsyncSession,
        user: User,
        recommendation_type: RecommendationType,
        num_questions: int,
    ) -> Recommendation:
        """Generate questions for a recommendation session."""
        try:
            user_preferences = await self.get_user_preferences(db, user)

            accessibility_needs = {}
            if user_preferences:
                accessibility_needs = {
                    "require_subtitles": user_preferences.accessibility_require_subtitles,
                    "require_audio_description": user_preferences.accessibility_require_audio_description,
                    "exclude_violent_content": user_preferences.content_filters_exclude_violent_content,
                    "exclude_sexual_content": user_preferences.content_filters_exclude_sexual_content,
                }

            questions_data = await openai_service.generate_questions(
                recommendation_type=recommendation_type,
                num_questions=num_questions,
                user_age=user.age,
                accessibility_needs=accessibility_needs,
            )

            recommendation = Recommendation(
                id=str(uuid.uuid4()),
                user_id=user.id,
                type=recommendation_type.value,
                timestamp=datetime.utcnow(),
            )
            db.add(recommendation)
            await db.flush()

            for question_data in questions_data:
                question = RecommendationQuestion(
                    id=str(uuid.uuid4()),
                    recommendation_id=recommendation.id,
                    question_text=question_data["text"],
                    question_order=question_data["order"],
                )
                db.add(question)

            await db.commit()

            result = await db.execute(
                select(Recommendation)
                .where(Recommendation.id == recommendation.id)
                .options(selectinload(Recommendation.questions))
            )
            recommendation = result.scalar_one()

            return recommendation

        except Exception as e:
            logger.error(f"Error generating questions: {e}")
            await db.rollback()
            raise

    async def process_answers(
        self, db: AsyncSession, recommendation: Recommendation, answers: List[Answer]
    ) -> Recommendation:
        """Process user answers and generate recommendations."""
        try:
            for answer in answers:
                db_answer = RecommendationAnswer(
                    id=str(uuid.uuid4()),
                    question_id=answer.question_id,
                    answer_text=answer.answer_text,
                )
                db.add(db_answer)

            await db.flush()

            result = await db.execute(
                select(User).where(User.id == recommendation.user_id)
            )
            user = result.scalar_one()

            user_preferences = await self.get_user_preferences(db, user)

            questions_and_answers = []

            result = await db.execute(
                select(RecommendationQuestion)
                .where(RecommendationQuestion.recommendation_id == recommendation.id)
                .options(selectinload(RecommendationQuestion.answers))
            )
            questions = result.scalars().all()

            for question in questions:
                matching_answer = next(
                    (a for a in answers if a.question_id == question.id), None
                )
                if matching_answer:
                    questions_and_answers.append(
                        {
                            "question": question.question_text,
                            "answer": matching_answer.answer_text,
                        }
                    )

            accessibility_needs = {}
            if user_preferences:
                accessibility_needs = {
                    "exclude_violent_content": user_preferences.content_filters_exclude_violent_content,
                    "exclude_sexual_content": user_preferences.content_filters_exclude_sexual_content,
                }

            ai_recommendations = await openai_service.generate_recommendations(
                recommendation_type=RecommendationType(recommendation.type),
                questions_and_answers=questions_and_answers,
                user_age=user.age,
                accessibility_needs=accessibility_needs,
            )

            if "movies" in ai_recommendations:
                for movie_data in ai_recommendations["movies"]:
                    try:
                        enriched_movie = await tmdb_service.enrich_movie_data(
                            movie_data
                        )

                        movie_rec = MovieRecommendation(
                            id=str(uuid.uuid4()),
                            recommendation_id=recommendation.id,
                            title=enriched_movie.get("title", movie_data["title"]),
                            description=enriched_movie.get(
                                "description", movie_data.get("description", "")
                            ),
                            rating=enriched_movie.get("rating"),
                            age_rating=enriched_movie.get(
                                "age_rating", movie_data.get("age_rating")
                            ),
                            poster_path=enriched_movie.get("poster_path"),
                            tmdb_id=enriched_movie.get("tmdb_id"),
                            release_date=enriched_movie.get("release_date"),
                            runtime=enriched_movie.get("runtime"),
                        )
                        db.add(movie_rec)
                    except Exception as e:
                        logger.warning(f"Error processing movie recommendation: {e}")
                        movie_rec = MovieRecommendation(
                            id=str(uuid.uuid4()),
                            recommendation_id=recommendation.id,
                            title=movie_data["title"],
                            description=movie_data.get("description", ""),
                            age_rating=movie_data.get("age_rating"),
                        )
                        db.add(movie_rec)

            if "books" in ai_recommendations:
                for book_data in ai_recommendations["books"]:
                    try:
                        enriched_book = await books_service.enrich_book_data(book_data)

                        book_rec = BookRecommendation(
                            id=str(uuid.uuid4()),
                            recommendation_id=recommendation.id,
                            title=enriched_book.get("title", book_data["title"]),
                            author=enriched_book.get(
                                "author", book_data.get("author", "")
                            ),
                            description=enriched_book.get(
                                "description", book_data.get("description", "")
                            ),
                            rating=enriched_book.get("rating"),
                            age_rating=enriched_book.get(
                                "age_rating", book_data.get("age_rating")
                            ),
                            poster_path=enriched_book.get("poster_path"),
                            isbn=enriched_book.get("isbn"),
                            published_date=enriched_book.get("published_date"),
                            page_count=enriched_book.get("page_count"),
                            publisher=enriched_book.get("publisher"),
                        )
                        db.add(book_rec)
                    except Exception as e:
                        logger.warning(f"Error processing book recommendation: {e}")
                        # Continue with basic data if enrichment fails
                        book_rec = BookRecommendation(
                            id=str(uuid.uuid4()),
                            recommendation_id=recommendation.id,
                            title=book_data["title"],
                            author=book_data.get("author", ""),
                            description=book_data.get("description", ""),
                            age_rating=book_data.get("age_rating"),
                        )
                        db.add(book_rec)

            await db.commit()

            # Reload with all relationships
            result = await db.execute(
                select(Recommendation)
                .where(Recommendation.id == recommendation.id)
                .options(
                    selectinload(Recommendation.questions).selectinload(
                        RecommendationQuestion.answers
                    ),
                    selectinload(Recommendation.movie_recommendations),
                    selectinload(Recommendation.book_recommendations),
                )
            )
            recommendation = result.scalar_one()

            return recommendation

        except Exception as e:
            logger.error(f"Error processing answers: {e}")
            await db.rollback()
            raise


recommendation_service = RecommendationService()
